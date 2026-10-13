// src/api/inventory.ts
import type { ApiResponse, InventoryItem, PaginatedResponse } from '@/types';
import apiClient from './client';

export const inventoryApi = {
  getAll: async (params?: Record<string, unknown>): Promise<ApiResponse<PaginatedResponse<InventoryItem>>> => {
    const response = await apiClient.get('/inventory', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<InventoryItem>> => {
    const response = await apiClient.get(`/inventory/${id}`);
    return response.data;
  },

  create: async (data: Partial<InventoryItem>): Promise<ApiResponse<InventoryItem>> => {
    const response = await apiClient.post('/inventory', data);
    return response.data;
  },

  update: async (id: string, data: Partial<InventoryItem>): Promise<ApiResponse<InventoryItem>> => {
    const response = await apiClient.put(`/inventory/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/inventory/${id}`);
    return response.data;
  },

  getLowStock: async (): Promise<ApiResponse<InventoryItem[]>> => {
    const response = await apiClient.get('/inventory/low-stock');
    return response.data;
  },

  getExpiringSoon: async (days: number = 30): Promise<ApiResponse<InventoryItem[]>> => {
    const response = await apiClient.get('/inventory/expiring', { params: { days } });
    return response.data;
  },

  adjustQuantity: async (id: string, adjustment: number, reason: string): Promise<ApiResponse<InventoryItem>> => {
    const response = await apiClient.post(`/inventory/${id}/adjust`, { adjustment, reason });
    return response.data;
  },

  transferToCamp: async (id: string, campId: string, quantity: number): Promise<ApiResponse<InventoryItem>> => {
    const response = await apiClient.post(`/inventory/${id}/transfer`, { campId, quantity });
    return response.data;
  },

  getCampInventory: async (campId: string): Promise<ApiResponse<InventoryItem[]>> => {
    const response = await apiClient.get(`/inventory/camp/${campId}`);
    return response.data;
  },

  bulkImport: async (file: File): Promise<ApiResponse<{ imported: number; errors: string[] }>> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/inventory/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  exportReport: async (): Promise<Blob> => {
    const response = await apiClient.get('/inventory/export', { responseType: 'blob' });
    return response.data;
  },
};

