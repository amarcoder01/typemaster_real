import { FeedbackService } from "../feedback-service";
import { NotFoundError, AuthorizationError } from "../feedback-errors";

const mockStorage = {
  getFeedbackById: jest.fn(),
  updateFeedback: jest.fn(),
  recordFeedbackStatusHistory: jest.fn(),
  createFeedbackResponse: jest.fn(),
  getFeedbackResponses: jest.fn(),
  archiveFeedback: jest.fn(),
  markFeedbackAsSpam: jest.fn(),
  blockFeedbackSubmitter: jest.fn(),
  getUser: jest.fn(),
  getFeedbackCategoryById: jest.fn(),
} as any;

describe("FeedbackService", () => {
  let service: FeedbackService;

  beforeEach(() => {
    service = new FeedbackService(mockStorage);
    jest.clearAllMocks();
  });

  describe("updateStatus", () => {
    it("should update feedback status successfully", async () => {
      const mockFeedback = {
        id: 1,
        status: "new",
        priority: "medium",
        userId: "user1",
      };

      mockStorage.getFeedbackById.mockResolvedValue(mockFeedback);
      mockStorage.updateFeedback.mockResolvedValue({
        ...mockFeedback,
        status: "in_progress",
      });

      const result = await service.updateStatus({
        feedbackId: 1,
        status: "in_progress",
        adminUserId: "admin1",
        admin: {
          userId: "admin1",
          canChangeStatus: true,
          canChangePriority: true,
          canViewAll: true,
          canRespond: true,
          canDelete: true,
          canManageCategories: true,
        },
      });

      expect(result.status).toBe("in_progress");
      expect(mockStorage.recordFeedbackStatusHistory).toHaveBeenCalled();
    });

    it("should throw AuthorizationError if admin lacks permission", async () => {
      const mockFeedback = { id: 1, status: "new" };
      mockStorage.getFeedbackById.mockResolvedValue(mockFeedback);

      await expect(
        service.updateStatus({
          feedbackId: 1,
          status: "in_progress",
          adminUserId: "admin1",
          admin: {
            userId: "admin1",
            canChangeStatus: false,
            canChangePriority: false,
            canViewAll: true,
            canRespond: true,
            canDelete: false,
            canManageCategories: false,
          },
        })
      ).rejects.toThrow(AuthorizationError);
    });

    it("should throw NotFoundError if feedback does not exist", async () => {
      mockStorage.getFeedbackById.mockResolvedValue(undefined);

      await expect(
        service.updateStatus({
          feedbackId: 999,
          status: "in_progress",
          adminUserId: "admin1",
          admin: {
            userId: "admin1",
            canChangeStatus: true,
            canChangePriority: true,
            canViewAll: true,
            canRespond: true,
            canDelete: true,
            canManageCategories: true,
          },
        })
      ).rejects.toThrow(NotFoundError);
    });
  });
});

