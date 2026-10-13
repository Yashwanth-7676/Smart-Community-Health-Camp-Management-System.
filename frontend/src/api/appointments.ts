// src/api/appointments.ts
import type { ApiResponse, Appointment, PaginatedResponse } from '@/types';
import apiClient from './client';

export interface CreateAppointmentRequest {
  campId: string;
  service: string;
  appointmentDate: string;
  timeSlot: string;
  notes?: string;
}

export const appointmentsApi = {
  getAll: async (params?: Record<string, unknown>): Promise<ApiResponse<PaginatedResponse<Appointment>>> => {
    const response = await apiClient.get('/appointments', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Appointment>> => {
    const response = await apiClient.get(`/appointments/${id}`);
    return response.data;
  },

  create: async (data: CreateAppointmentRequest): Promise<ApiResponse<Appointment>> => {
    const response = await apiClient.post('/appointments', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Appointment>): Promise<ApiResponse<Appointment>> => {
    const response = await apiClient.put(`/appointments/${id}`, data);
    return response.data;
  },

  cancel: async (id: string, reason?: string): Promise<ApiResponse<Appointment>> => {
    const response = await apiClient.post(`/appointments/${id}/cancel`, { reason });
    return response.data;
  },

  checkIn: async (id: string): Promise<ApiResponse<Appointment>> => {
    const response = await apiClient.post(`/appointments/${id}/check-in`);
    return response.data;
  },

  complete: async (id: string): Promise<ApiResponse<Appointment>> => {
    const response = await apiClient.post(`/appointments/${id}/complete`);
    return response.data;
  },

  getMyAppointments: async (params?: Record<string, unknown>): Promise<ApiResponse<PaginatedResponse<Appointment>>> => {
    const response = await apiClient.get('/appointments/my', { params });
    return response.data;
  },

  getAvailableSlots: async (campId: string, date: string, service: string): Promise<ApiResponse<string[]>> => {
    const response = await apiClient.get('/appointments/slots', {
      params: { campId, date, service },
    });
    return response.data;
  },

  generateQR: async (id: string): Promise<ApiResponse<{ qrCode: string }>> => {
    const response = await apiClient.get(`/appointments/${id}/qr`);
    return response.data;
  },

  reschedule: async (id: string, date: string, timeSlot: string): Promise<ApiResponse<Appointment>> => {
    const response = await apiClient.put(`/appointments/${id}/reschedule`, { date, timeSlot });
    return response.data;
  },

  getTodayAppointments: async (): Promise<ApiResponse<Appointment[]>> => {
    const response = await apiClient.get('/appointments/today');
    return response.data;
  },
};

