/**
 * Feedback Service Layer
 * Handles business logic for feedback operations with transaction support
 */

import { db } from "./storage";
import type { IStorage } from "./storage";
import type { Feedback, FeedbackResponse, FeedbackStatusHistory } from "@shared/schema";
import {
  FeedbackError,
  ValidationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
} from "./feedback-errors";
import { getAuditLogger } from "./feedback-audit";
import { feedbackAdminLogger } from "./structured-logger";
import DOMPurify from "isomorphic-dompurify";

export interface FeedbackAdmin {
  userId: string;
  canViewAll: boolean;
  canChangeStatus: boolean;
  canChangePriority: boolean;
  canRespond: boolean;
  canDelete: boolean;
  canManageCategories: boolean;
}

export interface UpdateStatusParams {
  feedbackId: number;
  status: string;
  priority?: string;
  changeReason?: string;
  resolutionNotes?: string;
  notifyUser?: boolean;
  adminUserId: string;
  admin: FeedbackAdmin;
}

export interface AddResponseParams {
  feedbackId: number;
  message: string;
  isInternalNote: boolean;
  templateName?: string;
  adminUserId: string;
  admin: FeedbackAdmin;
}

export class FeedbackService {
  private auditLogger;

  constructor(private storage: IStorage) {
    this.auditLogger = getAuditLogger(storage);
  }

  /**
   * Update feedback status with transaction support
   * Ensures status update and history record are atomic
   */
  async updateStatus(params: UpdateStatusParams): Promise<Feedback> {
    const {
      feedbackId,
      status,
      priority,
      changeReason,
      resolutionNotes,
      notifyUser,
      adminUserId,
      admin,
    } = params;

    // Check permissions
    if (!admin.canChangeStatus) {
      throw new AuthorizationError("You don't have permission to change status");
    }
    if (priority && !admin.canChangePriority) {
      throw new AuthorizationError("You don't have permission to change priority");
    }

    // Get current feedback
    const feedback = await this.storage.getFeedbackById(feedbackId);
    if (!feedback) {
      throw new NotFoundError("Feedback");
    }

    try {
      // Build update object
      const updates: Partial<Feedback> = {
        status: status as any,
        updatedAt: new Date(),
      };

      if (priority) {
        updates.priority = priority as any;
      }

      if (status === "resolved" || status === "closed") {
        updates.resolvedAt = new Date();
        updates.resolvedByUserId = adminUserId;
        if (resolutionNotes) {
          updates.resolutionNotes = DOMPurify.sanitize(resolutionNotes);
        }
      }

      // Update feedback (wrapped in transaction in storage layer)
      const updatedFeedback = await this.storage.updateFeedback(feedbackId, updates);

      // Record status history
      await this.storage.recordFeedbackStatusHistory({
        feedbackId,
        previousStatus: feedback.status,
        newStatus: status as any,
        previousPriority: feedback.priority,
        newPriority: (priority || feedback.priority) as any,
        changedByUserId: adminUserId,
        changeReason: changeReason || null,
        isAutomated: false,
      });

      // Audit log the status change
      await this.auditLogger.logStatusChange({
        adminUserId,
        feedbackId,
        previousStatus: feedback.status,
        newStatus: status,
        previousPriority: feedback.priority,
        newPriority: priority || feedback.priority,
        reason: changeReason,
      });

      // Handle email notification (async, non-blocking)
      if (notifyUser && !feedback.userNotified && (status === "resolved" || status === "closed")) {
        this.sendResolutionEmail(feedback, updates.resolutionNotes || undefined).catch((err) => {
          console.error(`[FeedbackService] Failed to send resolution email:`, err);
        });
      }

      feedbackAdminLogger.info("Feedback status updated", {
        feedbackId,
        adminUserId,
        previousStatus: feedback.status,
        newStatus: status,
      });

      return updatedFeedback;
    } catch (error: any) {
      feedbackAdminLogger.error("Failed to update feedback status", {
        feedbackId,
        adminUserId,
        error: error.message,
      });
      throw new DatabaseError("Failed to update feedback status", error);
    }
  }

  /**
   * Add admin response to feedback
   * Automatically transitions 'new' feedback to 'under_review'
   */
  async addResponse(params: AddResponseParams): Promise<FeedbackResponse> {
    const { feedbackId, message, isInternalNote, templateName, adminUserId, admin } = params;

    // Check permissions
    if (!admin.canRespond) {
      throw new AuthorizationError("You don't have permission to respond to feedback");
    }

    // Get current feedback
    const feedback = await this.storage.getFeedbackById(feedbackId);
    if (!feedback) {
      throw new NotFoundError("Feedback");
    }

    try {
      const sanitizedMessage = DOMPurify.sanitize(message.trim());

      // Create response
      const response = await this.storage.createFeedbackResponse({
        feedbackId,
        adminUserId,
        message: sanitizedMessage,
        isInternalNote: isInternalNote || false,
        templateName: templateName || undefined,
      });

      // Audit log the response
      await this.auditLogger.logResponse({
        adminUserId,
        feedbackId,
        isInternalNote: isInternalNote || false,
        messageLength: message.length,
      });

      // Auto-transition new feedback to under_review
      if (feedback.status === "new") {
        await this.storage.updateFeedback(feedbackId, {
          status: "under_review",
          updatedAt: new Date(),
        });
        await this.storage.recordFeedbackStatusHistory({
          feedbackId,
          previousStatus: "new",
          newStatus: "under_review",
          previousPriority: feedback.priority,
          newPriority: feedback.priority,
          changedByUserId: adminUserId,
          changeReason: "First admin response",
          isAutomated: true,
        });
      }

      feedbackAdminLogger.info("Admin response added", {
        feedbackId,
        adminUserId,
        isInternalNote: isInternalNote || false,
      });

      return response;
    } catch (error: any) {
      feedbackAdminLogger.error("Failed to add response", {
        feedbackId,
        adminUserId,
        error: error.message,
      });
      throw new DatabaseError("Failed to add response", error);
    }
  }

  /**
   * Archive feedback
   */
  async archiveFeedback(feedbackId: number, admin: FeedbackAdmin): Promise<void> {
    if (!admin.canDelete) {
      throw new AuthorizationError("You don't have permission to archive feedback");
    }

    const feedback = await this.storage.getFeedbackById(feedbackId);
    if (!feedback) {
      throw new NotFoundError("Feedback");
    }

    try {
      await this.storage.archiveFeedback(feedbackId);
      
      // Audit log the archive
      await this.auditLogger.logArchive({
        adminUserId: admin.userId,
        feedbackId,
      });
    } catch (error: any) {
      console.error("[FeedbackService] Archive error:", error);
      throw new DatabaseError("Failed to archive feedback", error);
    }
  }

  /**
   * Mark feedback as spam and block submitter
   */
  async markAsSpam(feedbackId: number, admin: FeedbackAdmin): Promise<void> {
    if (!admin.canDelete) {
      throw new AuthorizationError("You don't have permission to mark feedback as spam");
    }

    const feedback = await this.storage.getFeedbackById(feedbackId);
    if (!feedback) {
      throw new NotFoundError("Feedback");
    }

    try {
      await this.storage.markFeedbackAsSpam(feedbackId);

      // Block IP address if available
      if (feedback.ipAddress) {
        await this.storage.blockFeedbackSubmitter(
          feedback.ipAddress,
          "ip",
          "Marked as spam by admin",
          60 * 24 // 24 hours
        );
      }

      // Audit log the spam marking
      await this.auditLogger.logMarkSpam({
        adminUserId: admin.userId,
        feedbackId,
      });
    } catch (error: any) {
      console.error("[FeedbackService] Mark spam error:", error);
      throw new DatabaseError("Failed to mark as spam", error);
    }
  }

  /**
   * Send resolution email notification (non-blocking)
   */
  private async sendResolutionEmail(
    feedback: Feedback,
    resolutionNotes?: string
  ): Promise<void> {
    try {
      const { emailService } = require("./email-service");

      let recipientEmail: string | null = null;
      let username: string | undefined;

      if (feedback.userId) {
        const user = await this.storage.getUser(feedback.userId);
        if (user) {
          recipientEmail = user.email;
          username = user.username;
        }
      } else if (feedback.contactEmail) {
        recipientEmail = feedback.contactEmail;
      }

      if (recipientEmail) {
              const emailResult = await emailService.sendFeedbackResolutionEmail(recipientEmail, {
                feedbackId: feedback.id,
                subject: feedback.subject,
                resolutionNotes: resolutionNotes || undefined,
                username,
                status: feedback.status,
              });

        if (emailResult.success) {
          await this.storage.updateFeedback(feedback.id, { userNotified: true });
          console.log(
            `[FeedbackService] Resolution email sent to ${recipientEmail} for feedback #${feedback.id}`
          );
        } else {
          console.error(
            `[FeedbackService] Failed to send resolution email for feedback #${feedback.id}:`,
            emailResult.error
          );
        }
      }
    } catch (error) {
      console.error(
        `[FeedbackService] Error sending resolution email for feedback #${feedback.id}:`,
        error
      );
    }
  }

  /**
   * Validate category exists
   */
  async validateCategory(categoryId: number): Promise<boolean> {
    const category = await this.storage.getFeedbackCategoryById(categoryId);
    return category !== undefined;
  }
}

