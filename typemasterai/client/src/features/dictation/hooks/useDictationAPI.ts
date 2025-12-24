import { useCallback, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { DictationSentence } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

interface FetchSentenceOptions {
  difficulty: string;
  category: string;
  excludeIds: number[];
}

interface FetchBatchSentencesOptions {
  difficulty: string;
  category: string;
  count: number;
  excludeIds?: number[];
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
  
  // Fetch batch of sentences (for challenge mode)
  fetchBatchSentences: (options: FetchBatchSentencesOptions) => Promise<DictationSentence[]>;
  isFetchingBatch: boolean;
  
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
  const [isFetchingBatch, setIsFetchingBatch] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const batchAbortControllerRef = useRef<AbortController | null>(null);
  
  // Fetch a new sentence
  const fetchSentence = useCallback(async (
    options: FetchSentenceOptions
  ): Promise<DictationSentence | null> => {
    const { difficulty, category, excludeIds } = options;
    
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    setIsFetching(true);
    setFetchError(null);
    
    // Set timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 15000);
    
    try {
      const params = new URLSearchParams();
      params.set('difficulty', difficulty);
      if (category !== 'all') {
        params.set('category', category);
      }
      if (excludeIds.length > 0) {
        params.set('excludeIds', excludeIds.join(','));
      }
      
      const response = await fetch(`/api/dictation/sentence?${params.toString()}`, {
        signal: controller.signal,
        credentials: 'include',
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 404) {
          const errorMsg = 'No sentences found matching your criteria';
          setFetchError(errorMsg);
          toast({
            title: 'No sentences found',
            description: 'No sentences match your current filters. Try different settings.',
            variant: 'destructive',
          });
          return null;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data.sentence as DictationSentence;
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        const errorMsg = 'Request timed out';
        setFetchError(errorMsg);
        toast({
          title: 'Request timeout',
          description: 'The server took too long to respond. Please try again.',
          variant: 'destructive',
        });
        return null;
      }
      
      console.error('Failed to fetch sentence:', error);
      const errorMsg = 'Failed to fetch sentence';
      setFetchError(errorMsg);
      toast({
        title: 'Error',
        description: 'Could not fetch a new sentence. Please try again.',
        variant: 'destructive',
      });
      return null;
      
    } finally {
      setIsFetching(false);
      abortControllerRef.current = null;
    }
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
  
  // Fetch batch of sentences for challenge mode
  const fetchBatchSentences = useCallback(async (
    options: FetchBatchSentencesOptions
  ): Promise<DictationSentence[]> => {
    const { difficulty, category, count, excludeIds = [] } = options;
    
    // Cancel any previous batch request
    if (batchAbortControllerRef.current) {
      batchAbortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    batchAbortControllerRef.current = controller;
    
    setIsFetchingBatch(true);
    
    // Set timeout (longer for batch)
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 30000);
    
    try {
      const params = new URLSearchParams();
      params.set('difficulty', difficulty);
      params.set('count', count.toString());
      if (category !== 'all') {
        params.set('category', category);
      }
      if (excludeIds.length > 0) {
        params.set('excludeIds', excludeIds.join(','));
      }
      
      const response = await fetch(`/api/dictation/sentences/batch?${params.toString()}`, {
        signal: controller.signal,
        credentials: 'include',
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: 'No sentences found',
            description: 'Not enough sentences match your criteria. Try different settings.',
            variant: 'destructive',
          });
          return [];
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data.sentences as DictationSentence[];
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        toast({
          title: 'Request timeout',
          description: 'The server took too long to respond. Please try again.',
          variant: 'destructive',
        });
        return [];
      }
      
      console.error('Failed to fetch batch sentences:', error);
      toast({
        title: 'Error',
        description: 'Could not fetch sentences. Please try again.',
        variant: 'destructive',
      });
      return [];
      
    } finally {
      setIsFetchingBatch(false);
      batchAbortControllerRef.current = null;
    }
  }, [toast]);
  
  // Cancel ongoing requests
  const cancelRequests = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (batchAbortControllerRef.current) {
      batchAbortControllerRef.current.abort();
      batchAbortControllerRef.current = null;
    }
  }, []);
  
  return {
    fetchSentence,
    isFetching,
    fetchError,
    fetchBatchSentences,
    isFetchingBatch,
    saveTest,
    isSaving: saveTestMutation.isPending,
    saveError: saveTestMutation.error?.message || null,
    cancelRequests,
  };
}
