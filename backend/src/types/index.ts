import { Role, CampStatus, AppointmentStatus, NotificationType, FollowUpStatus, QueueStatus, Gender, BloodGroup } from '@prisma/client';

// Re-export Prisma enums for convenience
export { Role, CampStatus, AppointmentStatus, NotificationType, FollowUpStatus, QueueStatus, Gender, BloodGroup };

/**
 * JWT Payload structure
 */
export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  iat?: number;
  exp?: number;
}

/**
 * API Response structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: ValidationError[];
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Validation error structure
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Query parameters for list endpoints
 */
export interface ListQueryParams {
  page?: string;
  limit?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  role?: string;
  campId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * User interface (without password)
 */
export interface UserSafe {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatar?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Emergency contact structure
 */
export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

/**
 * Create camp request body
 */
export interface CreateCampDto {
  name: string;
  location: string;
  address: string;
  latitude?: number;
  longitude?: number;
  startDate: string;
  endDate: string;
  capacity: number;
  services: string[];
  description?: string;
}

/**
 * Update camp request body
 */
export interface UpdateCampDto {
  name?: string;
  location?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  startDate?: string;
  endDate?: string;
  capacity?: number;
  services?: string[];
  description?: string;
  status?: CampStatus;
}

/**
 * Create appointment request body
 */
export interface CreateAppointmentDto {
  patientId: string;
  campId: string;
  doctorId?: string;
  date: string;
  timeSlot: string;
  notes?: string;
}

/**
 * Update appointment request body
 */
export interface UpdateAppointmentDto {
  status?: AppointmentStatus;
  doctorId?: string;
  date?: string;
  timeSlot?: string;
  notes?: string;
}

/**
 * Login request body
 */
export interface LoginDto {
  email: string;
  password: string;
}

/**
 * Register request body
 */
export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: Role;
}

/**
 * Create medical report request body
 */
export interface CreateReportDto {
  patientId: string;
  campId: string;
  diagnosis: string;
  prescription?: string;
  observations?: string;
  referral?: string;
  isConfidential?: boolean;
}

/**
 * Create inventory item request body
 */
export interface CreateInventoryDto {
  medicineName: string;
  genericName?: string;
  quantity: number;
  unit: string;
  expiryDate?: string;
  lowStockThreshold?: number;
  supplier?: string;
}

/**
 * Update inventory item request body
 */
export interface UpdateInventoryDto {
  medicineName?: string;
  genericName?: string;
  quantity?: number;
  unit?: string;
  expiryDate?: string;
  lowStockThreshold?: number;
  supplier?: string;
}

/**
 * Create notification request body
 */
export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
}

/**
 * Create follow-up request body
 */
export interface CreateFollowUpDto {
  patientId: string;
  campId: string;
  scheduledDate: string;
  notes?: string;
}

/**
 * Patient profile update body
 */
export interface UpdatePatientProfileDto {
  dateOfBirth?: string;
  gender?: Gender;
  bloodGroup?: BloodGroup;
  address?: string;
  medicalHistory?: string;
  allergies?: string[];
  emergencyContact?: EmergencyContact;
}

/**
 * Admin analytics data structure
 */
export interface AnalyticsData {
  totalCamps: number;
  activeCamps: number;
  completedCamps: number;
  totalPatients: number;
  totalAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  totalDoctors: number;
  totalVolunteers: number;
  campsByStatus: Record<string, number>;
  appointmentsByMonth: Array<{ month: string; count: number }>;
  topCampsByRegistration: Array<{ name: string; registered: number; capacity: number }>;
}

/**
 * Attendance record for volunteers
 */
export interface AttendanceRecord {
  date: string;
  checkIn: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late';
}

/**
 * Offline registration sync result
 */
export interface SyncResult {
  total: number;
  succeeded: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}
