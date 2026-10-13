// src/api/patients.ts
import type { ApiResponse, MedicalReport, PaginatedResponse, PatientProfile } from '@/types';
import apiClient from './client';

export const patientsApi = {
  getProfile: async (): Promise<ApiResponse<PatientProfile>> => {
    const response = await apiClient.get('/patients/profile');
    return response.data;
  },

  updateProfile: async (data: Partial<PatientProfile>): Promise<ApiResponse<PatientProfile>> => {
    const response = await apiClient.put('/patients/profile', data);
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<PatientProfile>> => {
    const response = await apiClient.get(`/patients/${id}`);
    return response.data;
  },

  getAll: async (params?: Record<string, unknown>): Promise<ApiResponse<PaginatedResponse<PatientProfile>>> => {
    const response = await apiClient.get('/patients', { params });
    return response.data;
  },

  getMedicalHistory: async (patientId?: string): Promise<ApiResponse<MedicalReport[]>> => {
    const url = patientId ? `/patients/${patientId}/medical-history` : '/patients/medical-history';
    const response = await apiClient.get(url);
    return response.data;
  },

  createMedicalReport: async (data: Partial<MedicalReport>): Promise<ApiResponse<MedicalReport>> => {
    const response = await apiClient.post('/patients/reports', data);
    return response.data;
  },

  getMedicalReport: async (reportId: string): Promise<ApiResponse<MedicalReport>> => {
    const response = await apiClient.get(`/patients/reports/${reportId}`);
    return response.data;
  },

  updateMedicalReport: async (reportId: string, data: Partial<MedicalReport>): Promise<ApiResponse<MedicalReport>> => {
    const response = await apiClient.put(`/patients/reports/${reportId}`, data);
    return response.data;
  },

  downloadReport: async (reportId: string): Promise<Blob> => {
    const response = await apiClient.get(`/patients/reports/${reportId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<ApiResponse<{ avatar: string }>> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await apiClient.post('/patients/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  search: async (query: string): Promise<ApiResponse<PatientProfile[]>> => {
    const response = await apiClient.get('/patients/search', { params: { q: query } });
    return response.data;
  },
};

