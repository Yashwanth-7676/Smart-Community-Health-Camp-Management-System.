// src/api/reports.ts
import type { ApiResponse, MedicalReport, PaginatedResponse } from '@/types';
import apiClient from './client';

export const reportsApi = {
  getAll: async (params?: Record<string, unknown>): Promise<ApiResponse<PaginatedResponse<MedicalReport>>> => {
    const response = await apiClient.get('/reports', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<MedicalReport>> => {
    const response = await apiClient.get(`/reports/${id}`);
    return response.data;
  },

  create: async (data: Partial<MedicalReport>): Promise<ApiResponse<MedicalReport>> => {
    const response = await apiClient.post('/reports', data);
    return response.data;
  },

  update: async (id: string, data: Partial<MedicalReport>): Promise<ApiResponse<MedicalReport>> => {
    const response = await apiClient.put(`/reports/${id}`, data);
    return response.data;
  },

  download: async (id: string, format: 'pdf' | 'excel' = 'pdf'): Promise<Blob> => {
    const response = await apiClient.get(`/reports/${id}/download`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },

  getByPatient: async (patientId: string): Promise<ApiResponse<MedicalReport[]>> => {
    const response = await apiClient.get(`/reports/patient/${patientId}`);
    return response.data;
  },

  getByDoctor: async (doctorId: string): Promise<ApiResponse<MedicalReport[]>> => {
    const response = await apiClient.get(`/reports/doctor/${doctorId}`);
    return response.data;
  },

  getByCamp: async (campId: string): Promise<ApiResponse<MedicalReport[]>> => {
    const response = await apiClient.get(`/reports/camp/${campId}`);
    return response.data;
  },

  exportCampSummary: async (campId: string): Promise<Blob> => {
    const response = await apiClient.get(`/reports/camp/${campId}/summary`, {
      responseType: 'blob',
    });
    return response.data;
  },

  getAnalyticsSummary: async (params?: Record<string, unknown>): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.get('/reports/analytics', { params });
    return response.data;
  },
};

