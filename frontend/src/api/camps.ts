// src/api/camps.ts
import type { ApiResponse, Camp, PaginatedResponse, SearchFilters } from '@/types';
import apiClient from './client';

export const campsApi = {
  getAll: async (filters?: SearchFilters): Promise<ApiResponse<PaginatedResponse<Camp>>> => {
    const response = await apiClient.get('/camps', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Camp>> => {
    const response = await apiClient.get(`/camps/${id}`);
    return response.data;
  },

  create: async (data: Partial<Camp>): Promise<ApiResponse<Camp>> => {
    const response = await apiClient.post('/camps', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Camp>): Promise<ApiResponse<Camp>> => {
    const response = await apiClient.put(`/camps/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/camps/${id}`);
    return response.data;
  },

  getNearby: async (lat: number, lng: number, radius: number): Promise<ApiResponse<Camp[]>> => {
    const response = await apiClient.get('/camps/nearby', { params: { lat, lng, radius } });
    return response.data;
  },

  getUpcoming: async (): Promise<ApiResponse<Camp[]>> => {
    const response = await apiClient.get('/camps/upcoming');
    return response.data;
  },

  getOngoing: async (): Promise<ApiResponse<Camp[]>> => {
    const response = await apiClient.get('/camps/ongoing');
    return response.data;
  },

  register: async (campId: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.post(`/camps/${campId}/register`);
    return response.data;
  },

  unregister: async (campId: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/camps/${campId}/register`);
    return response.data;
  },

  addDoctor: async (campId: string, doctorId: string): Promise<ApiResponse<Camp>> => {
    const response = await apiClient.post(`/camps/${campId}/doctors`, { doctorId });
    return response.data;
  },

  removeDoctor: async (campId: string, doctorId: string): Promise<ApiResponse<Camp>> => {
    const response = await apiClient.delete(`/camps/${campId}/doctors/${doctorId}`);
    return response.data;
  },

  addVolunteer: async (campId: string, volunteerId: string): Promise<ApiResponse<Camp>> => {
    const response = await apiClient.post(`/camps/${campId}/volunteers`, { volunteerId });
    return response.data;
  },

  getStatistics: async (campId: string): Promise<ApiResponse<Record<string, unknown>>> => {
    const response = await apiClient.get(`/camps/${campId}/statistics`);
    return response.data;
  },

  uploadImage: async (campId: string, file: File): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await apiClient.post(`/camps/${campId}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

