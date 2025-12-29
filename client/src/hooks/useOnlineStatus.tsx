import { useState, useEffect } from "react";

/**
 * Hook to detect online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      console.log("[OnlineStatus] Connection restored");
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.warn("[OnlineStatus] Connection lost");
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Component to show offline banner
 */
export function OfflineBanner({ isOnline }: { isOnline: boolean }) {
  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground px-4 py-2 text-center text-sm font-medium">
      <span className="inline-flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
        You are currently offline. Some features may not work.
      </span>
    </div>
  );
}

