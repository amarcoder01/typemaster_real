import { useEffect, useState, useCallback } from 'react';
import { useNetwork } from '@/lib/network-context';
import { WifiOff, RefreshCw, AlertTriangle, CheckCircle, CloudOff, Signal, SignalLow, SignalMedium, SignalHigh } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ConnectionQuality } from '@/hooks/useNetworkStatus';

function getQualityIcon(quality: ConnectionQuality) {
  switch (quality) {
    case 'excellent':
      return <SignalHigh className="w-3.5 h-3.5" />;
    case 'good':
      return <SignalMedium className="w-3.5 h-3.5" />;
    case 'fair':
      return <SignalLow className="w-3.5 h-3.5" />;
    case 'poor':
      return <Signal className="w-3.5 h-3.5" />;
    case 'offline':
      return <WifiOff className="w-3.5 h-3.5" />;
  }
}

export function NetworkStatusBanner() {
  const { 
    isOnline, 
    wasOffline, 
    connectionState,
    connectionQuality,
    isServerReachable, 
    isCheckingServer,
    checkConnection,
    pendingActions,
    retryPendingActions,
    nextRetryIn,
    retryCount,
  } = useNetwork();
  
  const [showReconnected, setShowReconnected] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Handle "Back Online" ephemeral state
  useEffect(() => {
    if (connectionState === 'connected' && wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [connectionState, wasOffline]);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    // Enforce a minimum delay for UX so the user sees the spinner
    const minDelayPromise = new Promise(resolve => setTimeout(resolve, 800));
    
    try {
      // Force a check even if navigator.onLine is false
      const [connected] = await Promise.all([
        checkConnection(true),
        minDelayPromise
      ]);

      if (connected && pendingActions.length > 0) {
        await retryPendingActions();
      }
    } finally {
      setIsRetrying(false);
    }
  }, [checkConnection, pendingActions.length, retryPendingActions]);

  const isDisconnected = connectionState === 'disconnected' || !isOnline;
  const isReconnecting = connectionState === 'reconnecting';
  // const isConnected = connectionState === 'connected' && isOnline && isServerReachable; // Not used currently

  // Render nothing if everything is fine and we're not showing the "Restored" message
  if (!isDisconnected && !isReconnecting && !showReconnected && !(!isServerReachable && isOnline) && pendingActions.length === 0) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-6 right-6 z-[50] flex flex-col gap-3 items-end pointer-events-none"
      role="status"
      aria-live="polite"
    >
      {/* Offline State */}
      {isDisconnected && (
        <div className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 bg-zinc-900 text-white rounded-full shadow-lg border border-zinc-800 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/20 shrink-0">
            <WifiOff className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">No Internet Connection</span>
            <span className="text-xs text-zinc-400">Check your connection</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRetry}
            disabled={isRetrying}
            className="ml-1 h-8 w-8 p-0 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"
            title="Try to reconnect"
          >
            <RefreshCw className={cn("w-4 h-4", isRetrying && "animate-spin")} />
          </Button>
        </div>
      )}

      {/* Server Unreachable State */}
      {isOnline && !isServerReachable && !isCheckingServer && !isReconnecting && !isDisconnected && (
        <div className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 bg-zinc-900 text-white rounded-full shadow-lg border border-amber-500/30 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 shrink-0">
            <CloudOff className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Unable to Connect</span>
            <span className="text-xs text-zinc-400">Server may be unreachable</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRetry}
            disabled={isRetrying}
            className="ml-1 h-8 w-8 p-0 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"
            title="Retry connection"
          >
            <RefreshCw className={cn("w-4 h-4", isRetrying && "animate-spin")} />
          </Button>
        </div>
      )}

      {/* Reconnecting State */}
      {isReconnecting && (
        <div className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 bg-zinc-900 text-white rounded-full shadow-lg border border-blue-500/30 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 shrink-0">
            <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
          </div>
          <span className="text-sm font-medium">Checking connection...</span>
        </div>
      )}

      {/* Restored State */}
      {showReconnected && !isDisconnected && (
        <div className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 bg-zinc-900 text-white rounded-full shadow-lg border border-emerald-500/30 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 shrink-0">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-sm font-medium">Connection Restored</span>
        </div>
      )}

      {/* Pending Actions Indicator */}
      {pendingActions.length > 0 && !isDisconnected && (
        <div className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 bg-zinc-900 text-white rounded-full shadow-lg border border-zinc-800 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 shrink-0">
            <AlertTriangle className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Syncing Changes</span>
            <span className="text-xs text-zinc-400">
              Uploading {pendingActions.length} pending item{pendingActions.length > 1 ? 's' : ''}...
              {nextRetryIn && ` • Retry in ${nextRetryIn}s`}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRetry}
            disabled={isRetrying}
            className="ml-1 h-8 w-8 p-0 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"
            title="Sync now"
          >
            <RefreshCw className={cn("w-4 h-4", isRetrying && "animate-spin")} />
          </Button>
        </div>
      )}
    </div>
  );
}

export function OfflineIndicator({ className }: { className?: string }) {
  const { isOnline, connectionState } = useNetwork();

  if (isOnline && connectionState === 'connected') return null;

  return (
    <div 
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 bg-destructive/10 text-destructive rounded-full text-xs font-medium",
        className
      )}
      role="status"
      aria-label="Offline"
    >
      <WifiOff className="w-3 h-3" aria-hidden="true" />
      {connectionState === 'reconnecting' ? 'Reconnecting...' : 'Offline'}
    </div>
  );
}

export function ConnectionQualityIndicator({ className, showLabel = false }: { className?: string; showLabel?: boolean }) {
  const { connectionQuality, isOnline, connectionState } = useNetwork();

  if (!isOnline || connectionState !== 'connected') return null;

  const qualityConfig: Record<ConnectionQuality, { label: string; color: string }> = {
    excellent: { label: 'Excellent', color: 'text-green-500' },
    good: { label: 'Good', color: 'text-emerald-500' },
    fair: { label: 'Fair', color: 'text-yellow-500' },
    poor: { label: 'Poor', color: 'text-orange-500' },
    offline: { label: 'Offline', color: 'text-red-500' },
  };

  const config = qualityConfig[connectionQuality];

  return (
    <div 
      className={cn(
        "inline-flex items-center gap-1.5",
        config.color,
        className
      )}
      role="status"
      aria-label={`Connection quality: ${config.label}`}
    >
      {getQualityIcon(connectionQuality)}
      {showLabel && <span className="text-xs font-medium">{config.label}</span>}
    </div>
  );
}
