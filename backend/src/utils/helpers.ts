import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique queue token for an appointment
 * @param campLocation - Short location identifier (e.g., "KRM" for Koramangala)
 * @param sequenceNumber - Sequence number for the token
 * @returns Queue token string (e.g., "KRM-001")
 */
export const generateQueueToken = (campLocation: string, sequenceNumber: number): string => {
  const prefix = campLocation.slice(0, 3).toUpperCase();
  const paddedNumber = String(sequenceNumber).padStart(3, '0');
  return `${prefix}-${paddedNumber}`;
};

/**
 * Format a date to a human-readable string
 * @param date - Date object or string
 * @param format - Format type: 'short' | 'long' | 'time' | 'datetime'
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string, format: 'short' | 'long' | 'time' | 'datetime' = 'short'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const options: Record<string, Intl.DateTimeFormatOptions> = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' },
    time: { hour: '2-digit', minute: '2-digit', hour12: true },
    datetime: { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true },
  };

  return dateObj.toLocaleDateString('en-IN', options[format]);
};

/**
 * Calculate age from date of birth
 * @param dateOfBirth - Date of birth
 * @returns Age in years
 */
export const calculateAge = (dateOfBirth: Date | string): number => {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
};

/**
 * Generate a unique registration ID
 * @param prefix - Prefix for the ID (e.g., "PT" for patient, "DR" for doctor)
 * @returns Unique registration ID
 */
export const generateRegistrationId = (prefix: string): string => {
  const shortUuid = uuidv4().split('-')[0].toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}-${timestamp}-${shortUuid}`;
};

/**
 * Paginate an array of results
 * @param page - Page number (1-indexed)
 * @param limit - Items per page
 * @returns Object with skip and take values for Prisma
 */
export const getPagination = (page: number, limit: number): { skip: number; take: number } => {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const safePage = Math.max(page, 1);
  return {
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
  };
};

/**
 * Build pagination meta information
 * @param total - Total number of records
 * @param page - Current page
 * @param limit - Items per page
 * @returns Pagination metadata object
 */
export const buildPaginationMeta = (total: number, page: number, limit: number) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};

/**
 * Generate available time slots for a camp day
 * @param startHour - Start hour (0-23)
 * @param endHour - End hour (0-23)
 * @param slotDurationMinutes - Duration of each slot in minutes
 * @returns Array of time slot strings
 */
export const generateTimeSlots = (
  startHour: number = 9,
  endHour: number = 17,
  slotDurationMinutes: number = 30
): string[] => {
  const slots: string[] = [];
  let currentHour = startHour;
  let currentMinute = 0;

  while (currentHour < endHour || (currentHour === endHour && currentMinute === 0)) {
    const endMinute = currentMinute + slotDurationMinutes;
    const endHourCalc = currentHour + Math.floor(endMinute / 60);
    const endMinuteCalc = endMinute % 60;

    if (endHourCalc > endHour) break;

    const startTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    const endTime = `${String(endHourCalc).padStart(2, '0')}:${String(endMinuteCalc).padStart(2, '0')}`;

    slots.push(`${startTime}-${endTime}`);

    currentMinute += slotDurationMinutes;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;
    }
  }

  return slots;
};

/**
 * Sanitize user object by removing sensitive fields
 * @param user - User object with password
 * @returns User object without password
 */
export const sanitizeUser = <T extends { password?: string }>(user: T): Omit<T, 'password'> => {
  const { password: _password, ...sanitized } = user;
  return sanitized;
};

/**
 * Check if a date range is valid (start before end)
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Boolean indicating if range is valid
 */
export const isValidDateRange = (startDate: Date | string, endDate: Date | string): boolean => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  return start < end;
};

/**
 * Convert blood group enum value to display string
 * @param bloodGroup - Blood group enum value
 * @returns Human-readable blood group string
 */
export const formatBloodGroup = (bloodGroup: string): string => {
  return bloodGroup.replace('_POSITIVE', '+').replace('_NEGATIVE', '-').replace('_', '');
};

/**
 * Generate a random 6-digit OTP
 * @returns 6-digit OTP string
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Check if a string is a valid Indian phone number
 * @param phone - Phone number string
 * @returns Boolean indicating validity
 */
export const isValidIndianPhone = (phone: string): boolean => {
  const phoneRegex = /^(\+91[\s-]?)?[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};
