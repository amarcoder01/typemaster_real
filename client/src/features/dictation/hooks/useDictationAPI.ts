import { useCallback, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { DictationSentence } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

interface FetchSentenceOptions {
  difficulty: string;
  category: string;
  excludeIds: number[];
  maxRetries?: number;
  silent?: boolean; // Don't show toasts for prefetch failures
}

interface SaveTestData {
  sentenceId: number;
  speedLevel: string;
  actualSpeed: number;
  actualSentence: string;
  typedText: string;
  wpm: number;
  accuracy: number;
  errors: number;
  replayCount: number;
  hintUsed: number;
  duration: number;
}

interface UseDictationAPIReturn {
  // Fetch sentence
  fetchSentence: (options: FetchSentenceOptions) => Promise<DictationSentence | null>;
  isFetching: boolean;
  fetchError: string | null;
  
  // Save test
  saveTest: (data: SaveTestData) => Promise<{ id: number } | null>;
  isSaving: boolean;
  saveError: string | null;
  
  // Cancel ongoing requests
  cancelRequests: () => void;
}

/**
 * Hook for managing Dictation API calls with proper error handling
 */
export function useDictationAPI(): UseDictationAPIReturn {
  const { toast } = useToast();
  
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Helper to delay with exponential backoff
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Single fetch attempt
  const attemptFetch = async (
    params: URLSearchParams,
    controller: AbortController,
    timeoutMs: number
  ): Promise<DictationSentence | null> => {
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(`/api/dictation/sentence?${params.toString()}`, {
        signal: controller.signal,
        credentials: 'include',
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 404) {
          // No retry for 404 - this is a definitive "no results" response
          throw { status: 404, message: 'No sentences found matching your criteria' };
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data.sentence as DictationSentence;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };
  
  // Fetch a new sentence with retry logic
  const fetchSentence = useCallback(async (
    options: FetchSentenceOptions
  ): Promise<DictationSentence | null> => {
    const { difficulty, category, excludeIds, maxRetries = 3, silent = false } = options;
    
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setIsFetching(true);
    setFetchError(null);
    
    // Build params
    const params = new URLSearchParams();
    params.set('difficulty', difficulty);
    if (category !== 'all') {
      params.set('category', category);
    }
    if (excludeIds.length > 0) {
      params.set('excludeIds', excludeIds.join(','));
    }
    
    let lastError: any = null;
    
    // Retry loop with exponential backoff
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      try {
        // Increase timeout for each retry (10s, 15s, 20s, 25s)
        const timeoutMs = 10000 + (attempt * 5000);
        const sentence = await attemptFetch(params, controller, timeoutMs);
        
        if (sentence) {
          setIsFetching(false);
          abortControllerRef.current = null;
          return sentence;
        }
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on 404 (no sentences found)
        if (error.status === 404) {
          setFetchError(error.message);
          if (!silent) {
            toast({
              title: 'No sentences found',
              description: 'No sentences match your current filters. Try different settings.',
              variant: 'destructive',
            });
          }
          setIsFetching(false);
          abortControllerRef.current = null;
          return null;
        }
        
        // Don't retry if aborted manually
        if (error.name === 'AbortError' && attempt === maxRetries) {
          break;
        }
        
        // Retry with exponential backoff
        if (attempt < maxRetries) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt), 8000); // 1s, 2s, 4s, 8s
          await delay(backoffMs);
        }
      }
    }
    
    // All retries failed
    console.error('[DictationAPI] All fetch attempts failed:', lastError);
    const errorMsg = lastError?.name === 'AbortError' 
      ? 'Request timed out' 
      : 'Failed to fetch sentence';
    setFetchError(errorMsg);
    
    if (!silent) {
      toast({
        title: lastError?.name === 'AbortError' ? 'Request timeout' : 'Error',
        description: lastError?.name === 'AbortError'
          ? 'The server took too long to respond. Please try again.'
          : 'Could not fetch a new sentence. Please try again.',
        variant: 'destructive',
      });
    }
    
    setIsFetching(false);
    abortControllerRef.current = null;
    return null;
  }, [toast]);
  
  // Save test mutation
  const saveTestMutation = useMutation({
    mutationFn: async (testData: SaveTestData): Promise<{ id: number } | null> => {
      const response = await fetch('/api/dictation/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(testData),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: 'Please log in',
            description: 'You need to be logged in to save your progress',
            variant: 'destructive',
          });
          return null;
        }
        throw new Error(`Failed to save test: HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data.result as { id: number };
    },
    onError: (error: Error) => {
      console.error('Failed to save test:', error);
      toast({
        title: 'Warning',
        description: 'Could not save your test result. Your progress may not be saved.',
      });
    },
  });
  
  // Save test wrapper
  const saveTest = useCallback(async (data: SaveTestData): Promise<{ id: number } | null> => {
    try {
      const result = await saveTestMutation.mutateAsync(data);
      return result;
    } catch {
      return null;
    }
  }, [saveTestMutation]);
  
  // Cancel ongoing requests
  const cancelRequests = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);
  
  return {
    fetchSentence,
    isFetching,
    fetchError,
    saveTest,
    isSaving: saveTestMutation.isPending,
    saveError: saveTestMutation.error?.message || null,
    cancelRequests,
  };
}
