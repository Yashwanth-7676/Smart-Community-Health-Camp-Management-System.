// src/hooks/useApi.ts
import { useState, useCallback } from 'react';
import apiClient from '@/api/client';

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

export const useApi = <T = any>() => {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const request = useCallback(async (apiCall: Promise<{ data: T }>) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await apiCall;
      setState({ data: response.data, isLoading: false, error: null });
      return response.data;
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(err.message || 'API request failed');
      setState((prev) => ({ ...prev, isLoading: false, error }));
      throw error;
    }
  }, []);

  return {
    ...state,
    request,
    client: apiClient,
  };
};

export default useApi;
