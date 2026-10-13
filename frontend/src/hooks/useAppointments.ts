// src/hooks/useAppointments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi, CreateAppointmentRequest } from '@/api/appointments';
import toast from 'react-hot-toast';

export const useAppointments = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['appointments', params],
    queryFn: async () => {
      const res = await appointmentsApi.getAll(params);
      return res.data;
    },
  });
};

export const useAppointment = (id: string) => {
  return useQuery({
    queryKey: ['appointment', id],
    queryFn: async () => {
      const res = await appointmentsApi.getById(id);
      return res.data;
    },
    enabled: Boolean(id),
  });
};

export const useMyAppointments = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['my-appointments', params],
    queryFn: async () => {
      const res = await appointmentsApi.getMyAppointments(params);
      return res.data;
    },
  });
};

export const useAvailableSlots = (campId: string, date: string, service: string) => {
  return useQuery({
    queryKey: ['slots', campId, date, service],
    queryFn: async () => {
      const res = await appointmentsApi.getAvailableSlots(campId, date, service);
      return res.data || [];
    },
    enabled: Boolean(campId && date),
  });
};

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAppointmentRequest) => appointmentsApi.create(data),
    onSuccess: () => {
      toast.success('Appointment booked successfully!');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to book appointment');
    },
  });
};

export const useCancelAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      appointmentsApi.cancel(id, reason),
    onSuccess: () => {
      toast.success('Appointment cancelled');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to cancel appointment');
    },
  });
};
