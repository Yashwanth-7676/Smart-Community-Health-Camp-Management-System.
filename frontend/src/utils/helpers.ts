// src/utils/helpers.ts
import { format, formatDistance, isValid, parseISO } from 'date-fns';
import type { AppointmentStatus, BloodGroup, CampStatus, UserRole } from '@/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, pattern = 'dd MMM yyyy'): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return 'Invalid date';
    return format(d, pattern);
  } catch {
    return 'Invalid date';
  }
}

export function formatTime(date: string | Date, pattern = 'hh:mm a'): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return 'Invalid time';
    return format(d, pattern);
  } catch {
    return 'Invalid time';
  }
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'dd MMM yyyy, hh:mm a');
}

export function formatRelativeTime(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return 'Unknown';
    return formatDistance(d, new Date(), { addSuffix: true });
  } catch {
    return 'Unknown';
  }
}

export function getCampStatusColor(status: CampStatus): string {
  const colors: Record<CampStatus, string> = {
    upcoming: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    ongoing: 'bg-green-500/20 text-green-400 border border-green-500/30',
    completed: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border border-red-500/30',
  };
  return colors[status] || 'bg-gray-500/20 text-gray-400';
}

export function getAppointmentStatusColor(status: AppointmentStatus): string {
  const colors: Record<AppointmentStatus, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    confirmed: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    checked_in: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    in_progress: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
    completed: 'bg-green-500/20 text-green-400 border border-green-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border border-red-500/30',
    no_show: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  };
  return colors[status] || 'bg-gray-500/20 text-gray-400';
}

export function getBloodGroupColor(bloodGroup: BloodGroup): string {
  const colors: Record<BloodGroup, string> = {
    'A+': 'bg-red-500/20 text-red-400',
    'A-': 'bg-red-600/20 text-red-500',
    'B+': 'bg-blue-500/20 text-blue-400',
    'B-': 'bg-blue-600/20 text-blue-500',
    'AB+': 'bg-purple-500/20 text-purple-400',
    'AB-': 'bg-purple-600/20 text-purple-500',
    'O+': 'bg-green-500/20 text-green-400',
    'O-': 'bg-green-600/20 text-green-500',
  };
  return colors[bloodGroup] || 'bg-gray-500/20 text-gray-400';
}

export function getRoleColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    patient: 'bg-cyan-500/20 text-cyan-400',
    doctor: 'bg-blue-500/20 text-blue-400',
    volunteer: 'bg-green-500/20 text-green-400',
    admin: 'bg-red-500/20 text-red-400',
    organizer: 'bg-purple-500/20 text-purple-400',
  };
  return colors[role] || 'bg-gray-500/20 text-gray-400';
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function generateInitials(name: string): string {
  if (!name) return '??';
  const words = name.trim().split(' ');
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
}

export function calculateAge(dateOfBirth: string): number {
  const dob = parseISO(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function calculateBMI(weight: number, height: number): number {
  const heightInM = height / 100;
  return parseFloat((weight / (heightInM * heightInM)).toFixed(1));
}

export function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-400' };
  if (bmi < 25) return { label: 'Normal', color: 'text-green-400' };
  if (bmi < 30) return { label: 'Overweight', color: 'text-yellow-400' };
  return { label: 'Obese', color: 'text-red-400' };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getCapacityPercentage(registered: number, max: number): number {
  return Math.round((registered / max) * 100);
}

export function getCapacityColor(percentage: number): string {
  if (percentage >= 90) return 'text-red-400';
  if (percentage >= 70) return 'text-yellow-400';
  return 'text-green-400';
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export function generateQRData(appointmentId: string): string {
  return JSON.stringify({
    appointmentId,
    timestamp: new Date().toISOString(),
    system: 'SmartHealthCamp',
  });
}

export function parseJWT(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1];
    const decoded = atob(base64);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const decoded = parseJWT(token);
  if (!decoded || typeof decoded.exp !== 'number') return true;
  return decoded.exp * 1000 < Date.now();
}

export function getServiceLabel(service: string): string {
  return service
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function sortByDate<T extends { createdAt: string }>(items: T[], order: 'asc' | 'desc' = 'desc'): T[] {
  return [...items].sort((a, b) => {
    const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return order === 'asc' ? diff : -diff;
  });
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    if (!groups[group]) groups[group] = [];
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

