import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Certificate, VerificationResponse } from "@shared/schema";

interface CreateCertificateData {
  certificateType: "standard" | "code" | "book" | "race" | "dictation" | "stress";
  testResultId?: number;
  codeTestId?: number;
  bookTestId?: number;
  raceId?: number;
  dictationTestId?: number;
  stressTestId?: number;
  wpm: number;
  accuracy: number;
  consistency: number;
  duration: number;
  metadata?: Record<string, any>;
}

export function useCreateCertificate() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCertificateData) => {
      // Validate required fields before sending
      if (!data.certificateType) {
        throw new Error("Certificate type is required");
      }
      if (typeof data.wpm !== 'number' || data.wpm < 0) {
        throw new Error("Valid WPM is required");
      }
      if (typeof data.accuracy !== 'number' || data.accuracy < 0 || data.accuracy > 100) {
        throw new Error("Valid accuracy (0-100) is required");
      }
      if (typeof data.duration !== 'number' || data.duration <= 0) {
        throw new Error("Valid duration is required");
      }

      const response = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = "Failed to create certificate";
        let errorCode = "UNKNOWN_ERROR";
        
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
          errorCode = error.code || errorCode;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }

        // Provide user-friendly error messages based on error code
        if (errorCode === "VALIDATION_ERROR") {
          errorMessage = "Invalid certificate data. Please check all fields.";
        } else if (errorCode === "OWNERSHIP_DENIED" || errorCode === "PARTICIPATION_DENIED") {
          errorMessage = "You don't have permission to create a certificate for this test.";
        } else if (errorCode === "DUPLICATE_CERTIFICATE") {
          errorMessage = "A certificate already exists for this test.";
        } else if (errorCode === "INVALID_REFERENCE") {
          errorMessage = "The test result is invalid or no longer exists.";
        }

        const error = new Error(errorMessage);
        (error as any).code = errorCode;
        throw error;
      }

      const certificate = await response.json() as Certificate;
      
      if (!certificate || !certificate.id) {
        throw new Error("Invalid certificate data received from server");
      }

      return certificate;
    },
    onSuccess: (certificate) => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      toast({
        title: "Certificate Created! 🎉",
        description: "Your achievement certificate has been generated successfully.",
      });
    },
    onError: (error: Error & { code?: string }) => {
      console.error("[Certificate] Creation failed:", error);
      toast({
        title: "Certificate Creation Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    },
    retry: (failureCount, error: any) => {
      // Don't retry on client validation errors or permission errors
      if (error?.code === "VALIDATION_ERROR" || 
          error?.code === "OWNERSHIP_DENIED" || 
          error?.code === "PARTICIPATION_DENIED" ||
          error?.code === "DUPLICATE_CERTIFICATE") {
        return false;
      }
      // Retry up to 2 times for network/server errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

export function useUserCertificates(userId?: string, certificateType?: string) {
  return useQuery({
    queryKey: ["certificates", userId, certificateType],
    queryFn: async () => {
      if (!userId) {
        return [];
      }

      const params = new URLSearchParams();
      if (certificateType && certificateType !== "all") {
        params.append("type", certificateType);
      }

      const response = await fetch(`/api/certificates?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        let errorMessage = "Failed to fetch certificates";
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Ensure we always return an array
      if (!Array.isArray(data)) {
        console.error("[Certificate] API returned non-array:", typeof data);
        return [];
      }

      return data as Certificate[];
    },
    enabled: !!userId,
    staleTime: 30000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

export function useCertificateById(id: number) {
  return useQuery({
    queryKey: ["certificate", id],
    queryFn: async () => {
      const response = await fetch(`/api/certificates/${id}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch certificate");
      }

      return response.json() as Promise<Certificate>;
    },
    enabled: !!id,
    staleTime: 60000,
  });
}

export function useCertificateByShareId(shareId: string) {
  return useQuery({
    queryKey: ["certificate", "shared", shareId],
    queryFn: async () => {
      const response = await fetch(`/api/certificates/share/${shareId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch shared certificate");
      }

      return response.json() as Promise<Certificate>;
    },
    enabled: !!shareId,
    staleTime: 60000,
  });
}

export function useDeleteCertificate() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/certificates/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete certificate");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      toast({
        title: "Certificate Deleted",
        description: "Your certificate has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ============================================================================
// CERTIFICATE VERIFICATION HOOKS
// ============================================================================

/**
 * Hook to verify a certificate by its verification ID
 */
export function useVerifyCertificate(verificationId: string | null) {
  return useQuery<VerificationResponse>({
    queryKey: ["verify", verificationId],
    queryFn: async () => {
      if (!verificationId) {
        throw new Error("Verification ID is required");
      }

      const response = await fetch(`/api/verify/${encodeURIComponent(verificationId)}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Verification failed");
      }

      return response.json();
    },
    enabled: !!verificationId,
    retry: false,
    staleTime: 30000,
  });
}

/**
 * Hook to revoke a certificate
 */
export function useRevokeCertificate() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const response = await fetch(`/api/certificates/${id}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to revoke certificate");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      queryClient.invalidateQueries({ queryKey: ["verify"] });
      toast({
        title: "Certificate Revoked",
        description: `Certificate ${data.verificationId} has been revoked.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Revocation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to unrevoke (restore) a certificate
 */
export function useUnrevokeCertificate() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/certificates/${id}/unrevoke`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to restore certificate");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      queryClient.invalidateQueries({ queryKey: ["verify"] });
      toast({
        title: "Certificate Restored",
        description: `Certificate ${data.verificationId} has been restored.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Restore Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to fetch verification statistics
 */
export function useVerificationStats() {
  return useQuery({
    queryKey: ["verification", "stats"],
    queryFn: async () => {
      const response = await fetch("/api/verification/stats");
      
      if (!response.ok) {
        throw new Error("Failed to fetch verification stats");
      }

      return response.json();
    },
    staleTime: 60000,
  });
}
