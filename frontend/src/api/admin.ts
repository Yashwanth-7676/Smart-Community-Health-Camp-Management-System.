// src/api/admin.ts
import type { AnalyticsData, ApiResponse, Camp, PaginatedResponse, User } from '@/types';
import apiClient from './client';

export const adminApi = {
  getDashboardStats: async (): Promise<ApiResponse<AnalyticsData>> => {
    const response = await apiClient.get('/admin/dashboard');
    return response.data;
  },

  getAnalytics: async (params?: Record<string, unknown>): Promise<ApiResponse<AnalyticsData>> => {
    const response = await apiClient.get('/admin/analytics', { params });
    return response.data;
  },

  getAllUsers: async (params?: Record<string, unknown>): Promise<ApiResponse<PaginatedResponse<User>>> => {
    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  },

  getUserById: async (id: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.get(`/admin/users/${id}`);
    return response.data;
  },

  updateUser: async (id: string, data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await apiClient.put(`/admin/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/admin/users/${id}`);
    return response.data;
  },

  activateUser: async (id: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.post(`/admin/users/${id}/activate`);
    return response.data;
  },

  deactivateUser: async (id: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.post(`/admin/users/${id}/deactivate`);
    return response.data;
  },

  getAllCamps: async (params?: Record<string, unknown>): Promise<ApiResponse<PaginatedResponse<Camp>>> => {
    const response = await apiClient.get('/admin/camps', { params });
    return response.data;
  },

  createCamp: async (data: Partial<Camp>): Promise<ApiResponse<Camp>> => {
    const response = await apiClient.post('/admin/camps', data);
    return response.data;
  },

  updateCamp: async (id: string, data: Partial<Camp>): Promise<ApiResponse<Camp>> => {
    const response = await apiClient.put(`/admin/camps/${id}`, data);
    return response.data;
  },

  deleteCamp: async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/admin/camps/${id}`);
    return response.data;
  },

  exportReport: async (type: string, params?: Record<string, unknown>): Promise<Blob> => {
    const response = await apiClient.get(`/admin/reports/export/${type}`, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  sendNotification: async (data: {
    userIds?: string[];
    role?: string;
    title: string;
    message: string;
    type: string;
  }): Promise<ApiResponse<null>> => {
    const response = await apiClient.post('/admin/notifications/send', data);
    return response.data;
  },

  getSystemLogs: async (params?: Record<string, unknown>): Promise<ApiResponse<unknown[]>> => {
    const response = await apiClient.get('/admin/logs', { params });
    return response.data;
  },
};

