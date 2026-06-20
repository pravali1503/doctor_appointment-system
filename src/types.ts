/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = "ADMIN" | "PATIENT";

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  joinedAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  experience: number; // in years
  qualification: string;
  consultationFee: number;
  availableDays: string[]; // e.g., ["Monday", "Wednesday"]
  availableSlots: string[]; // e.g., ["09:00", "09:30", "10:00"]
  bufferTime: number; // in minutes
  maxDailyAppointments: number;
  photoUrl: string;
  active: boolean;
  softDeleted: boolean;
}

export type AppointmentStatus = "Pending" | "Confirmed" | "Cancelled" | "Completed";
export type QueueStatus = "Booked" | "Confirmed" | "In Queue" | "Completed";

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  patientId: string;
  patientName: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:MM
  status: AppointmentStatus;
  tokenNumber: number;
  queueStatus: QueueStatus;
  prescription?: string | null;
  createdAt: string;
  rescheduledFrom?: string; // date + slot
}

export type WaitlistStatus = "Active" | "Notified" | "Booked" | "Expired";

export interface WaitlistItem {
  id: string;
  doctorId: string;
  doctorName: string;
  patientId: string;
  patientName: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:MM
  status: WaitlistStatus;
  joinedAt: string;
}

export interface ClinicNotification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface DashboardMetrics {
  totalDoctors: number;
  totalPatients: number;
  todayAppointmentsCount: number;
  upcomingAppointmentsCount: number;
  completedAppointmentsCount: number;
  cancellationRate: number; // e.g., 12.5%
  doctorUtilization: { doctorName: string; rate: number }[]; // booking vs capacity
  busiestTimeSlots: { slot: string; count: number }[];
}

export interface SearchFilters {
  searchQuery: string;
  specialization: string;
  maxFee: number;
  availableDate: string;
  availabilityStatus: "All" | "Available Today" | "Available This Week";
  sortBy: "earliest" | "lowest_fee" | "highest_experience";
}
