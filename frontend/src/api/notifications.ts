// src/api/notifications.ts
import type { ApiResponse, Notification, PaginatedResponse } from '@/types';
import apiClient from './client';

export const notificationsApi = {
  getAll: async (params?: Record<string, unknown>): Promise<ApiResponse<PaginatedResponse<Notification>>> => {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },

  getUnreadCount: async (): Promise<ApiResponse<{ count: number }>> => {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (id: string): Promise<ApiResponse<Notification>> => {
    const response = await apiClient.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<ApiResponse<null>> => {
    const response = await apiClient.put('/notifications/read-all');
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/notifications/${id}`);
    return response.data;
  },

  deleteAll: async (): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete('/notifications/all');
    return response.data;
  },

  updateSettings: async (settings: Record<string, boolean>): Promise<ApiResponse<null>> => {
    const response = await apiClient.put('/notifications/settings', settings);
    return response.data;
  },

  getSettings: async (): Promise<ApiResponse<Record<string, boolean>>> => {
    const response = await apiClient.get('/notifications/settings');
    return response.data;
  },
};

