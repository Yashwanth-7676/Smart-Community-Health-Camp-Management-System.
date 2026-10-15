import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address format'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address format'),
    password: z.string().min(8, 'Password must be at least 8 characters for security'),
    role: z.enum(['PATIENT', 'DOCTOR', 'VOLUNTEER', 'ADMIN']).default('PATIENT'),
    phone: z.string().optional(),
  }),
});

export const createCampSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Camp name must be at least 3 characters'),
    location: z.string().min(2, 'Location is required'),
    address: z.string().min(5, 'Detailed address is required'),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid start date' }),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid end date' }),
    capacity: z.number().int().positive('Capacity must be a positive integer greater than 0'),
    services: z.array(z.string()).min(1, 'At least one healthcare service must be specified'),
  }),
});

export const createAppointmentSchema = z.object({
  body: z.object({
    patientId: z.string().min(1, 'Patient ID is required'),
    campId: z.string().min(1, 'Camp ID is required'),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid appointment date' }),
    timeSlot: z.string().min(1, 'Time slot is required'),
    doctorId: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const createMedicalReportSchema = z.object({
  body: z.object({
    patientId: z.string().min(1, 'Patient ID is required'),
    campId: z.string().min(1, 'Camp ID is required'),
    diagnosis: z.string().min(3, 'Diagnosis details are required'),
    prescription: z.string().optional(),
    observations: z.string().optional(),
    referral: z.string().optional(),
    isConfidential: z.boolean().optional(),
  }),
});

export const inventoryTransactionSchema = z.object({
  body: z.object({
    medicineId: z.string().min(1, 'Medicine identifier is required'),
    campId: z.string().min(1, 'Camp ID is required'),
    quantity: z.number().int().positive('Transaction quantity must be a positive number'),
    type: z.enum(['STOCK_IN', 'DISPENSED', 'EXPIRED', 'ADJUSTMENT']),
  }),
});

