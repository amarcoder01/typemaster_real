/**
 * Batched Leaderboard API Client
 * Fetches multiple leaderboard data points in a single request for better performance
 */

export interface BatchLeaderboardRequest {
  type: 'leaderboard' | 'aroundMe';
  timeframe?: 'all' | 'daily' | 'weekly' | 'monthly';
  language?: string;
  limit?: number;
  offset?: number;
  userId?: string;
  range?: number;
}

export interface BatchLeaderboardResponse {
  results: Array<{
    type: string;
    data?: any;
    error?: string;
  }>;
}

/**
 * Fetch multiple leaderboard data points in a single batched request
 */
export async function fetchLeaderboardBatch(
  requests: BatchLeaderboardRequest[]
): Promise<BatchLeaderboardResponse> {
  const response = await fetch('/api/leaderboard/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  if (!response.ok) {
    throw new Error(`Batch request failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch leaderboard and user rank in a single request
 */
export async function fetchLeaderboardWithRank(
  userId: string | undefined,
  timeframe: 'all' | 'daily' | 'weekly' | 'monthly' = 'all',
  language: string = 'en',
  limit: number = 20,
  offset: number = 0
): Promise<{
  leaderboard: any;
  aroundMe: any;
}> {
  const requests: BatchLeaderboardRequest[] = [
    {
      type: 'leaderboard',
      timeframe,
      language,
      limit,
      offset,
    },
  ];

  // Only fetch aroundMe if user is logged in
  if (userId) {
    requests.push({
      type: 'aroundMe',
      timeframe,
      language,
      userId,
      range: 3,
    });
  }

  const response = await fetchLeaderboardBatch(requests);

  return {
    leaderboard: response.results[0]?.data || null,
    aroundMe: response.results[1]?.data || null,
  };
}

