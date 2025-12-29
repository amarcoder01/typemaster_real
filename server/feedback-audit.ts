/**
 * Feedback Audit Logging System
 * Tracks all admin actions for compliance and security
 */

import type { IStorage } from "./storage";

export enum AuditAction {
  // Feedback Actions
  FEEDBACK_VIEWED = "feedback.viewed",
  FEEDBACK_STATUS_CHANGED = "feedback.status_changed",
  FEEDBACK_PRIORITY_CHANGED = "feedback.priority_changed",
  FEEDBACK_RESPONDED = "feedback.responded",
  FEEDBACK_ARCHIVED = "feedback.archived",
  FEEDBACK_MARKED_SPAM = "feedback.marked_spam",
  FEEDBACK_DELETED = "feedback.deleted",
  
  // Category Actions
  CATEGORY_CREATED = "category.created",
  CATEGORY_UPDATED = "category.updated",
  CATEGORY_DELETED = "category.deleted",
  
  // Admin Management
  ADMIN_GRANTED = "admin.granted",
  ADMIN_REVOKED = "admin.revoked",
  ADMIN_PERMISSIONS_CHANGED = "admin.permissions_changed",
  
  // Bulk Actions
  BULK_STATUS_UPDATE = "bulk.status_update",
  BULK_ARCHIVE = "bulk.archive",
  BULK_DELETE = "bulk.delete",
}

export interface AuditLogEntry {
  action: AuditAction;
  adminUserId: string;
  adminUsername?: string;
  targetResourceType: "feedback" | "category" | "admin" | "bulk";
  targetResourceId?: number | string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export class FeedbackAuditLogger {
  private logs: AuditLogEntry[] = [];
  private maxBufferSize = 100;

  constructor(private storage: IStorage) {}

  /**
   * Log an admin action
   */
  async log(entry: Omit<AuditLogEntry, "timestamp">): Promise<void> {
    const logEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date(),
    };

    // Add to buffer
    this.logs.push(logEntry);

    // Log to console for immediate visibility
    console.log(
      `[Audit] ${entry.action} by ${entry.adminUsername || entry.adminUserId} on ${entry.targetResourceType}${entry.targetResourceId ? ` #${entry.targetResourceId}` : ""}`,
      entry.changes ? JSON.stringify(entry.changes) : ""
    );

    // Flush buffer if it's full
    if (this.logs.length >= this.maxBufferSize) {
      await this.flush();
    }
  }

  /**
   * Log feedback status change
   */
  async logStatusChange(params: {
    adminUserId: string;
    adminUsername?: string;
    feedbackId: number;
    previousStatus: string;
    newStatus: string;
    previousPriority?: string;
    newPriority?: string;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.log({
      action: AuditAction.FEEDBACK_STATUS_CHANGED,
      adminUserId: params.adminUserId,
      adminUsername: params.adminUsername,
      targetResourceType: "feedback",
      targetResourceId: params.feedbackId,
      changes: {
        status: { from: params.previousStatus, to: params.newStatus },
        ...(params.previousPriority &&
          params.newPriority && {
            priority: { from: params.previousPriority, to: params.newPriority },
          }),
      },
      metadata: {
        reason: params.reason,
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Log feedback response
   */
  async logResponse(params: {
    adminUserId: string;
    adminUsername?: string;
    feedbackId: number;
    isInternalNote: boolean;
    messageLength: number;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.log({
      action: AuditAction.FEEDBACK_RESPONDED,
      adminUserId: params.adminUserId,
      adminUsername: params.adminUsername,
      targetResourceType: "feedback",
      targetResourceId: params.feedbackId,
      metadata: {
        isInternalNote: params.isInternalNote,
        messageLength: params.messageLength,
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Log feedback archive
   */
  async logArchive(params: {
    adminUserId: string;
    adminUsername?: string;
    feedbackId: number;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.log({
      action: AuditAction.FEEDBACK_ARCHIVED,
      adminUserId: params.adminUserId,
      adminUsername: params.adminUsername,
      targetResourceType: "feedback",
      targetResourceId: params.feedbackId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Log spam marking
   */
  async logMarkSpam(params: {
    adminUserId: string;
    adminUsername?: string;
    feedbackId: number;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.log({
      action: AuditAction.FEEDBACK_MARKED_SPAM,
      adminUserId: params.adminUserId,
      adminUsername: params.adminUsername,
      targetResourceType: "feedback",
      targetResourceId: params.feedbackId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Log bulk action
   */
  async logBulkAction(params: {
    action: AuditAction;
    adminUserId: string;
    adminUsername?: string;
    feedbackIds: number[];
    changes?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.log({
      action: params.action,
      adminUserId: params.adminUserId,
      adminUsername: params.adminUsername,
      targetResourceType: "bulk",
      metadata: {
        feedbackIds: params.feedbackIds,
        count: params.feedbackIds.length,
      },
      changes: params.changes,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Log admin permission change
   */
  async logAdminPermissionChange(params: {
    adminUserId: string;
    adminUsername?: string;
    targetAdminUserId: string;
    action: "granted" | "revoked" | "updated";
    permissions?: Record<string, boolean>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const actionMap = {
      granted: AuditAction.ADMIN_GRANTED,
      revoked: AuditAction.ADMIN_REVOKED,
      updated: AuditAction.ADMIN_PERMISSIONS_CHANGED,
    };

    await this.log({
      action: actionMap[params.action],
      adminUserId: params.adminUserId,
      adminUsername: params.adminUsername,
      targetResourceType: "admin",
      targetResourceId: params.targetAdminUserId,
      changes: params.permissions,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Flush buffered logs to persistent storage
   */
  async flush(): Promise<void> {
    if (this.logs.length === 0) return;

    try {
      // In a production system, you would persist these to a database table
      // For now, we'll just log them and clear the buffer
      console.log(`[Audit] Flushing ${this.logs.length} audit log entries`);
      
      // TODO: Implement persistent storage
      // await this.storage.saveAuditLogs(this.logs);
      
      this.logs = [];
    } catch (error) {
      console.error("[Audit] Failed to flush audit logs:", error);
    }
  }

  /**
   * Get recent audit logs for a specific resource
   */
  async getResourceAuditLog(
    resourceType: "feedback" | "admin",
    resourceId: number | string,
    limit: number = 50
  ): Promise<AuditLogEntry[]> {
    // TODO: Implement retrieval from persistent storage
    // For now, return from buffer
    return this.logs
      .filter(
        (log) =>
          log.targetResourceType === resourceType &&
          log.targetResourceId === resourceId
      )
      .slice(-limit);
  }

  /**
   * Get admin activity log
   */
  async getAdminActivityLog(
    adminUserId: string,
    limit: number = 100
  ): Promise<AuditLogEntry[]> {
    // TODO: Implement retrieval from persistent storage
    return this.logs
      .filter((log) => log.adminUserId === adminUserId)
      .slice(-limit);
  }
}

// Singleton instance
let auditLogger: FeedbackAuditLogger | null = null;

export function getAuditLogger(storage: IStorage): FeedbackAuditLogger {
  if (!auditLogger) {
    auditLogger = new FeedbackAuditLogger(storage);
  }
  return auditLogger;
}

