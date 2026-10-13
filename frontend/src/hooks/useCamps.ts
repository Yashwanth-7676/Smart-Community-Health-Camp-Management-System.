// src/hooks/useCamps.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campsApi } from '@/api/camps';
import type { Camp, SearchFilters } from '@/types';
import toast from 'react-hot-toast';

export const useCamps = (filters?: SearchFilters) => {
  return useQuery({
    queryKey: ['camps', filters],
    queryFn: async () => {
      const res = await campsApi.getAll(filters);
      return res.data;
    },
  });
};

export const useCamp = (id: string) => {
  return useQuery({
    queryKey: ['camp', id],
    queryFn: async () => {
      const res = await campsApi.getById(id);
      return res.data;
    },
    enabled: Boolean(id),
  });
};

export const useUpcomingCamps = () => {
  return useQuery({
    queryKey: ['camps', 'upcoming'],
    queryFn: async () => {
      const res = await campsApi.getUpcoming();
      return res.data;
    },
  });
};

export const useCreateCamp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Camp>) => campsApi.create(data),
    onSuccess: () => {
      toast.success('Camp created successfully!');
      queryClient.invalidateQueries({ queryKey: ['camps'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create camp');
    },
  });
};

export const useUpdateCamp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Camp> }) => campsApi.update(id, data),
    onSuccess: (_, variables) => {
      toast.success('Camp updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['camps'] });
      queryClient.invalidateQueries({ queryKey: ['camp', variables.id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update camp');
    },
  });
};
