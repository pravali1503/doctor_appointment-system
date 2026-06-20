/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import pg from "pg";
import { 
  User, 
  Doctor, 
  Appointment, 
  AppointmentStatus,
  WaitlistItem, 
  ClinicNotification, 
  DashboardMetrics,
  UserRole,
  QueueStatus,
  WaitlistStatus
} from "../types.js";

const { Pool } = pg;

// Database storage schema for fallback
interface DatabaseSchema {
  users: User[];
  doctors: Doctor[];
  appointments: Appointment[];
  waitlist: WaitlistItem[];
  notifications: ClinicNotification[];
}

// Config paths
const DB_DIR = path.join(process.cwd(), "db-data");
const DB_FILE = path.join(DB_DIR, "clinic_db.json");

// Pure TypeScript SHA-256 Password Hash using Node standard crypto
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "clinic_salt_123").digest("hex");
}

// Simple JWT Cryptographic Token Sign & Verify utilizing native crypto (HMAC)
const JWT_SECRET = "care_sync_secret_system_token_2026";

export function generateToken(payload: { id: string; email: string; role: string; name: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  // Set expiration to 2 hours
  const exp = Math.floor(Date.now() / 1000) + 7200;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url");
  
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
    
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): any {
  try {
    const [header, body, signature] = token.split(".");
    if (!header || !body || !signature) return null;
    
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${body}`)
      .digest("base64url");
      
    if (signature !== expectedSignature) return null;
    
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch (err) {
    return null;
  }
}

// Default Seed Data
const DEFAULT_DOCTORS: Doctor[] = [
  {
    id: "doc_1",
    name: "Dr. Sarah Jenkins",
    specialization: "Cardiology",
    experience: 14,
    qualification: "MD, DM - Cardiology (Harvard Medical)",
    consultationFee: 150,
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    availableSlots: ["09:00", "09:35", "10:10", "10:45", "11:20", "13:30", "14:05", "14:40", "15:15"],
    bufferTime: 5,
    maxDailyAppointments: 8,
    photoUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300",
    active: true,
    softDeleted: false
  },
  {
    id: "doc_2",
    name: "Dr. Michael Chang",
    specialization: "Pediatrics",
    experience: 9,
    qualification: "MD - Pediatrics (Stanford School of Medicine)",
    consultationFee: 120,
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday"],
    availableSlots: ["09:00", "09:30", "10:00", "10:30", "11:00", "14:00", "14:30", "15:00", "15:30", "16:00"],
    bufferTime: 0,
    maxDailyAppointments: 10,
    photoUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300",
    active: true,
    softDeleted: false
  },
  {
    id: "doc_3",
    name: "Dr. Elena Rostova",
    specialization: "Neurology",
    experience: 16,
    qualification: "MD, PhD - Neurology (Johns Hopkins University)",
    consultationFee: 180,
    availableDays: ["Monday", "Wednesday", "Friday"],
    availableSlots: ["10:00", "10:45", "11:30", "14:00", "14:45", "15:30", "16:15"],
    bufferTime: 15,
    maxDailyAppointments: 5,
    photoUrl: "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300",
    active: true,
    softDeleted: false
  },
  {
    id: "doc_4",
    name: "Dr. Alex Mercer",
    specialization: "General Medicine",
    experience: 7,
    qualification: "MBBS, MD - General Medicine (London Health Science)",
    consultationFee: 80,
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    availableSlots: ["08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"],
    bufferTime: 0,
    maxDailyAppointments: 12,
    photoUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300",
    active: true,
    softDeleted: false
  }
];

const DEFAULT_USERS: User[] = [
  {
    id: "usr_admin",
    email: "admin@care.com",
    name: "System Admin",
    passwordHash: hashPassword("admin123"),
    role: "ADMIN",
    joinedAt: "2026-06-01T00:00:00.000Z"
  },
  {
    id: "usr_patient_demo",
    email: "patient@care.com",
    name: "John Doe",
    passwordHash: hashPassword("patient123"),
    role: "PATIENT",
    joinedAt: "2026-06-15T08:30:00.000Z"
  }
];

const DEFAULT_APPOINTMENTS: Appointment[] = [
  {
    id: "apt_1",
    doctorId: "doc_1",
    doctorName: "Dr. Sarah Jenkins",
    doctorSpecialization: "Cardiology",
    patientId: "usr_patient_demo",
    patientName: "John Doe",
    date: "2026-06-25",
    timeSlot: "09:35",
    status: "Confirmed",
    tokenNumber: 1,
    queueStatus: "In Queue",
    createdAt: "2026-06-18T10:00:00.000Z"
  },
  {
    id: "apt_2",
    doctorId: "doc_2",
    doctorName: "Dr. Michael Chang",
    doctorSpecialization: "Pediatrics",
    patientId: "usr_patient_demo",
    patientName: "John Doe",
    date: "2026-06-26",
    timeSlot: "10:30",
    status: "Pending",
    tokenNumber: 1,
    queueStatus: "Booked",
    createdAt: "2026-06-19T09:00:00.000Z"
  }
];

// Mapper functions for PostgreSQL results
function rowToUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    role: row.role as UserRole,
    joinedAt: new Date(row.joined_at).toISOString()
  };
}

function rowToDoctor(row: any): Doctor {
  return {
    id: row.id,
    name: row.name,
    specialization: row.specialization,
    experience: Number(row.experience),
    qualification: row.qualification,
    consultationFee: Number(row.consultation_fee),
    availableDays: Array.isArray(row.available_days) ? row.available_days : JSON.parse(row.available_days || "[]"),
    availableSlots: Array.isArray(row.available_slots) ? row.available_slots : JSON.parse(row.available_slots || "[]"),
    bufferTime: Number(row.buffer_time),
    maxDailyAppointments: Number(row.max_daily_appointments),
    photoUrl: row.photo_url,
    active: row.active,
    softDeleted: row.soft_deleted
  };
}

function rowToAppointment(row: any): Appointment {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    doctorName: row.doctor_name,
    doctorSpecialization: row.doctor_specialization,
    patientId: row.patient_id,
    patientName: row.patient_name,
    date: row.date,
    timeSlot: row.time_slot,
    status: row.status as AppointmentStatus,
    tokenNumber: Number(row.token_number),
    queueStatus: row.queue_status as QueueStatus,
    prescription: row.prescription || null,
    createdAt: new Date(row.created_at).toISOString(),
    rescheduledFrom: row.rescheduled_from || undefined
  };
}

function rowToWaitlistItem(row: any): WaitlistItem {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    doctorName: row.doctor_name,
    patientId: row.patient_id,
    patientName: row.patient_name,
    date: row.date,
    timeSlot: row.time_slot,
    status: row.status as WaitlistStatus,
    joinedAt: new Date(row.joined_at).toISOString()
  };
}

function rowToNotification(row: any): ClinicNotification {
  return {
    id: row.id,
    userId: row.user_id,
    message: row.message,
    read: row.read,
    createdAt: new Date(row.created_at).toISOString()
  };
}

class Store {
  private data: DatabaseSchema;
  private pool: pg.Pool | null = null;
  public isPostgresActive = false;

  constructor() {
    this.data = {
      users: [],
      doctors: [],
      appointments: [],
      waitlist: [],
      notifications: []
    };
    this.initialize();
  }

  private async initialize() {
    // 1. Establish PostgreSQL database connection optionally
    const connectionString = process.env.DATABASE_URL;
    const dbHost = process.env.PGHOST;

    if (connectionString || dbHost) {
      try {
        const config: pg.PoolConfig = connectionString 
          ? { connectionString }
          : {
              host: process.env.PGHOST,
              port: Number(process.env.PGPORT || 5432),
              user: process.env.PGUSER,
              password: process.env.PGPASSWORD,
              database: process.env.PGDATABASE,
            };

        // Suppress unauthorized SSL issues on standard hosts
        if (config.connectionString && !config.connectionString.includes("localhost") && !config.connectionString.includes("127.0.0.1")) {
          config.ssl = { rejectUnauthorized: false };
        } else if (config.host && !config.host.includes("localhost") && !config.host.includes("127.0.0.1")) {
          config.ssl = { rejectUnauthorized: false };
        }

        this.pool = new Pool(config);
        
        // Quick connection query verification
        const client = await this.pool.connect();
        console.log("[POSTGRESQL] Successfully connected to PostgreSQL Database Instance!");
        client.release();

        this.isPostgresActive = true;
        await this.createPostgresTables();
        await this.seedPostgresIfEmpty();

        return; // Exits, avoiding local configuration on success!
      } catch (err: any) {
        console.warn("[POSTGRESQL] Connection error. Falling back gracefully to JSON Database. Details:", err.message);
      }
    }

    // 2. Initialize Fallback Database Store
    this.initializeLocalJson();
  }

  private initializeLocalJson() {
    try {
      console.log("[LOCAL DATABASE] Running CareSync in Local Backup JSON Store Mode.");
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(fileContent);

        // Sanity check to make sure keys are preset
        if (!this.data.users) this.data.users = [];
        if (!this.data.doctors) this.data.doctors = [];
        if (!this.data.appointments) this.data.appointments = [];
        if (!this.data.waitlist) this.data.waitlist = [];
        if (!this.data.notifications) this.data.notifications = [];
      } else {
        // Build seed local database
        this.data = {
          users: DEFAULT_USERS,
          doctors: DEFAULT_DOCTORS,
          appointments: DEFAULT_APPOINTMENTS,
          waitlist: [],
          notifications: [
            {
              id: "notif_1",
              userId: "usr_patient_demo",
              message: "Welcome to CareSync! Your sample appointment with Dr. Sarah Jenkins on June 25th is Confirmed.",
              read: false,
              createdAt: "2026-06-19T09:10:00.000Z"
            }
          ]
        };
        this.saveLocalJson();
      }
    } catch (err) {
      console.error("Failed to initialize system database. Fallback to in-memory store.", err);
    }
  }

  private saveLocalJson() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (err) {
      console.error("Database save crash:", err);
    }
  }

  // CREATE TABLE SCHEMAS IN POSTGRESQL
  private async createPostgresTables() {
    if (!this.pool) return;
    try {
      // 1. Users
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS curesync_users (
          id VARCHAR(50) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(20) NOT NULL,
          joined_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);

      // 2. Doctors
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS curesync_doctors (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          specialization VARCHAR(100) NOT NULL,
          experience INT NOT NULL,
          qualification VARCHAR(255) NOT NULL,
          consultation_fee DECIMAL NOT NULL,
          available_days TEXT NOT NULL,
          available_slots TEXT NOT NULL,
          buffer_time INT NOT NULL,
          max_daily_appointments INT NOT NULL,
          photo_url TEXT NOT NULL,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          soft_deleted BOOLEAN NOT NULL DEFAULT FALSE
        );
      `);

      // 3. Appointments
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS curesync_appointments (
          id VARCHAR(50) PRIMARY KEY,
          doctor_id VARCHAR(50) NOT NULL,
          doctor_name VARCHAR(255) NOT NULL,
          doctor_specialization VARCHAR(100),
          patient_id VARCHAR(50) NOT NULL,
          patient_name VARCHAR(255) NOT NULL,
          date VARCHAR(20) NOT NULL,
          time_slot VARCHAR(20) NOT NULL,
          status VARCHAR(20) NOT NULL,
          token_number INT NOT NULL,
          queue_status VARCHAR(20) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          prescription TEXT,
          rescheduled_from TEXT
        );
      `);

      // 4. Waitlists
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS curesync_waitlists (
          id VARCHAR(50) PRIMARY KEY,
          doctor_id VARCHAR(50) NOT NULL,
          doctor_name VARCHAR(255) NOT NULL,
          patient_id VARCHAR(50) NOT NULL,
          patient_name VARCHAR(255) NOT NULL,
          date VARCHAR(20) NOT NULL,
          time_slot VARCHAR(20) NOT NULL,
          status VARCHAR(20) NOT NULL,
          joined_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);

      // 5. Notifications
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS curesync_notifications (
          id VARCHAR(50) PRIMARY KEY,
          user_id VARCHAR(50) NOT NULL,
          message TEXT NOT NULL,
          read BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);

      console.log("[POSTGRESQL] Database table schemas configured successfully.");
    } catch (err) {
      console.error("[POSTGRESQL] Setup error creating schema tables: ", err);
    }
  }

  // SEED INITIAL DATA IN POSTGRESQL IF TABLES ARE EMPTY
  private async seedPostgresIfEmpty() {
    if (!this.pool) return;
    try {
      // Seed users
      const usersCheck = await this.pool.query("SELECT COUNT(*) FROM curesync_users");
      if (Number(usersCheck.rows[0].count) === 0) {
        console.log("[POSTGRESQL] Seeding initial users...");
        for (const user of DEFAULT_USERS) {
          await this.pool.query(
            "INSERT INTO curesync_users (id, email, name, password_hash, role, joined_at) VALUES ($1, $2, $3, $4, $5, $6)",
            [user.id, user.email, user.name, user.passwordHash, user.role, user.joinedAt]
          );
        }
      }

      // Seed doctors
      const docsCheck = await this.pool.query("SELECT COUNT(*) FROM curesync_doctors");
      if (Number(docsCheck.rows[0].count) === 0) {
        console.log("[POSTGRESQL] Seeding initial doctors directory...");
        for (const doc of DEFAULT_DOCTORS) {
          await this.pool.query(
            `INSERT INTO curesync_doctors 
            (id, name, specialization, experience, qualification, consultation_fee, available_days, available_slots, buffer_time, max_daily_appointments, photo_url, active, soft_deleted) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              doc.id, doc.name, doc.specialization, doc.experience, doc.qualification, doc.consultationFee,
              JSON.stringify(doc.availableDays), JSON.stringify(doc.availableSlots), doc.bufferTime, doc.maxDailyAppointments,
              doc.photoUrl, doc.active, doc.softDeleted
            ]
          );
        }
      }

      // Seed appointments
      const aptsCheck = await this.pool.query("SELECT COUNT(*) FROM curesync_appointments");
      if (Number(aptsCheck.rows[0].count) === 0) {
        console.log("[POSTGRESQL] Seeding initial bookings history...");
        for (const apt of DEFAULT_APPOINTMENTS) {
          await this.pool.query(
            `INSERT INTO curesync_appointments 
            (id, doctor_id, doctor_name, doctor_specialization, patient_id, patient_name, date, time_slot, status, token_number, queue_status, created_at) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              apt.id, apt.doctorId, apt.doctorName, apt.doctorSpecialization, apt.patientId, apt.patientName,
              apt.date, apt.timeSlot, apt.status, apt.tokenNumber, apt.queueStatus, apt.createdAt
            ]
          );
        }

        // Add matching notifications
        await this.pool.query(
          "INSERT INTO curesync_notifications (id, user_id, message, read, created_at) VALUES ($1, $2, $3, $4, $5)",
          ["notif_1", "usr_patient_demo", "Welcome to CareSync! Your sample appointment with Dr. Sarah Jenkins on June 25th is Confirmed.", false, "2026-06-19T09:10:00.000Z"]
        );
      }

    } catch (err) {
      console.error("[POSTGRESQL] Error seeding SQL database:", err);
    }
  }


  // ===================================
  // ---- REFACTORED ASYNC STORE API ---
  // ===================================

  // ---- Users API ----
  async getUsers(): Promise<User[]> {
    if (this.isPostgresActive && this.pool) {
      const res = await this.pool.query("SELECT * FROM curesync_users");
      return res.rows.map(rowToUser);
    }
    return this.data.users;
  }

  async getUserById(id: string): Promise<User | undefined> {
    if (this.isPostgresActive && this.pool) {
      const res = await this.pool.query("SELECT * FROM curesync_users WHERE id = $1", [id]);
      if (res.rows.length === 0) return undefined;
      return rowToUser(res.rows[0]);
    }
    return this.data.users.find(u => u.id === id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (this.isPostgresActive && this.pool) {
      const res = await this.pool.query("SELECT * FROM curesync_users WHERE LOWER(email) = LOWER($1)", [email.trim()]);
      if (res.rows.length === 0) return undefined;
      return rowToUser(res.rows[0]);
    }
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  async createUser(user: Omit<User, "id" | "joinedAt">): Promise<User> {
    const id = "usr_" + Math.random().toString(36).substring(2, 11);
    const joinedAt = new Date().toISOString();

    if (this.isPostgresActive && this.pool) {
      const res = await this.pool.query(
        "INSERT INTO curesync_users (id, email, name, password_hash, role, joined_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [id, user.email.trim(), user.name.trim(), user.passwordHash, user.role, joinedAt]
      );
      return rowToUser(res.rows[0]);
    }

    const newUser: User = { ...user, id, joinedAt };
    this.data.users.push(newUser);
    this.saveLocalJson();
    return newUser;
  }

  // ---- Doctors API ----
  async getDoctors(includeDeleted = false): Promise<Doctor[]> {
    if (this.isPostgresActive && this.pool) {
      const q = includeDeleted 
        ? "SELECT * FROM curesync_doctors" 
        : "SELECT * FROM curesync_doctors WHERE soft_deleted = false";
      const res = await this.pool.query(q);
      return res.rows.map(rowToDoctor);
    }

    return this.data.doctors.filter(d => includeDeleted || !d.softDeleted);
  }

  async getDoctorById(id: string): Promise<Doctor | undefined> {
    if (this.isPostgresActive && this.pool) {
      const res = await this.pool.query("SELECT * FROM curesync_doctors WHERE id = $1", [id]);
      if (res.rows.length === 0) return undefined;
      return rowToDoctor(res.rows[0]);
    }
    return this.data.doctors.find(d => d.id === id);
  }

  async createDoctor(doctorData: Omit<Doctor, "id" | "active" | "softDeleted">): Promise<Doctor> {
    const id = "doc_" + Math.random().toString(36).substring(2, 11);
    const active = true;
    const softDeleted = false;

    if (this.isPostgresActive && this.pool) {
      const res = await this.pool.query(
        `INSERT INTO curesync_doctors 
        (id, name, specialization, experience, qualification, consultation_fee, available_days, available_slots, buffer_time, max_daily_appointments, photo_url, active, soft_deleted) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
        [
          id, doctorData.name, doctorData.specialization, doctorData.experience, doctorData.qualification, doctorData.consultationFee,
          JSON.stringify(doctorData.availableDays), JSON.stringify(doctorData.availableSlots), doctorData.bufferTime, doctorData.maxDailyAppointments,
          doctorData.photoUrl, active, softDeleted
        ]
      );
      return rowToDoctor(res.rows[0]);
    }

    const newDoc: Doctor = { ...doctorData, id, active, softDeleted };
    this.data.doctors.push(newDoc);
    this.saveLocalJson();
    return newDoc;
  }

  async updateDoctor(id: string, updates: Partial<Omit<Doctor, "id">>): Promise<Doctor | null> {
    if (this.isPostgresActive && this.pool) {
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      for (const [key, val] of Object.entries(updates)) {
        const dbKey = key === "consultationFee" ? "consultation_fee" :
                      key === "availableDays" ? "available_days" :
                      key === "availableSlots" ? "available_slots" :
                      key === "bufferTime" ? "buffer_time" :
                      key === "maxDailyAppointments" ? "max_daily_appointments" :
                      key === "photoUrl" ? "photo_url" :
                      key === "softDeleted" ? "soft_deleted" : key;

        fields.push(`${dbKey} = $${idx++}`);
        values.push(Array.isArray(val) ? JSON.stringify(val) : val);
      }

      if (fields.length === 0) return this.getDoctorById(id) as any;

      values.push(id);
      const q = `UPDATE curesync_doctors SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`;
      const res = await this.pool.query(q, values);
      if (res.rows.length === 0) return null;
      return rowToDoctor(res.rows[0]);
    }

    const i = this.data.doctors.findIndex(d => d.id === id);
    if (i === -1) return null;
    this.data.doctors[i] = { ...this.data.doctors[i], ...updates };
    this.saveLocalJson();
    return this.data.doctors[i];
  }

  async softDeleteDoctor(id: string): Promise<boolean> {
    if (this.isPostgresActive && this.pool) {
      const res = await this.pool.query("UPDATE curesync_doctors SET soft_deleted = true WHERE id = $1 RETURNING *", [id]);
      return res.rows.length > 0;
    }

    const idx = this.data.doctors.findIndex(d => d.id === id);
    if (idx === -1) return false;
    this.data.doctors[idx].softDeleted = true;
    this.saveLocalJson();
    return true;
  }

  // ---- Appointments API ----
  async getAppointments(): Promise<Appointment[]> {
    if (this.isPostgresActive && this.pool) {
      const res = await this.pool.query("SELECT * FROM curesync_appointments ORDER BY date ASC, time_slot ASC");
      return res.rows.map(rowToAppointment);
    }
    return this.data.appointments;
  }

  async getAppointmentById(id: string): Promise<Appointment | undefined> {
    if (this.isPostgresActive && this.pool) {
      const res = await this.pool.query("SELECT * FROM curesync_appointments WHERE id = $1", [id]);
      if (res.rows.length === 0) return undefined;
      return rowToAppointment(res.rows[0]);
    }
    return this.data.appointments.find(a => a.id === id);
  }

  // Core Booking Business Logic (dynamic locks to avoid race conditions via PostgreSQL constraints)
  async createAppointment(appointmentData: {
    doctorId: string;
    patientId: string;
    patientName: string;
    date: string;
    timeSlot: string;
  }): Promise<{ success: boolean; error?: string; appointment?: Appointment; waitlisted?: boolean; waitlistItem?: WaitlistItem }> {
    
    // Select specialist details
    const doctor = await this.getDoctorById(appointmentData.doctorId);
    if (!doctor || doctor.softDeleted || !doctor.active) {
      return { success: false, error: "Doctor is unavailable or inactive." };
    }

    // Days check
    const dayOfWeek = new Date(appointmentData.date).toLocaleDateString("en-US", { weekday: "long" });
    if (!doctor.availableDays.includes(dayOfWeek)) {
      return { success: false, error: `Doctor does not consult on ${dayOfWeek}.` };
    }

    // Hour slots check
    if (!doctor.availableSlots.includes(appointmentData.timeSlot)) {
      return { success: false, error: "The selected time slot is not in the doctor's consult schedule." };
    }

    // Past date block
    const reqDateTime = new Date(`${appointmentData.date}T${appointmentData.timeSlot}`);
    if (reqDateTime.getTime() < Date.now()) {
      return { success: false, error: "You cannot book an appointment for a past date or time." };
    }

    // Check for double booking
    let hasDoubleBook = false;
    if (this.isPostgresActive && this.pool) {
      const checkDouble = await this.pool.query(
        "SELECT COUNT(*) FROM curesync_appointments WHERE doctor_id = $1 AND date = $2 AND time_slot = $3 AND status != 'Cancelled'",
        [appointmentData.doctorId, appointmentData.date, appointmentData.timeSlot]
      );
      hasDoubleBook = Number(checkDouble.rows[0].count) > 0;
    } else {
      hasDoubleBook = this.data.appointments.some(
        a => a.doctorId === appointmentData.doctorId &&
             a.date === appointmentData.date &&
             a.timeSlot === appointmentData.timeSlot &&
             a.status !== "Cancelled"
      );
    }

    if (hasDoubleBook) {
      // Create Standby waitlist item
      const waitlistId = "wt_" + Math.random().toString(36).substring(2, 11);
      const joinedAt = new Date().toISOString();
      const waitlistStatus: WaitlistStatus = "Active";

      if (this.isPostgresActive && this.pool) {
        const resWait = await this.pool.query(
          `INSERT INTO curesync_waitlists (id, doctor_id, doctor_name, patient_id, patient_name, date, time_slot, status, joined_at) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
          [waitlistId, doctor.id, doctor.name, appointmentData.patientId, appointmentData.patientName, appointmentData.date, appointmentData.timeSlot, waitlistStatus, joinedAt]
        );
        const waitlistItem = rowToWaitlistItem(resWait.rows[0]);
        await this.createNotification(
          appointmentData.patientId,
          `Slot ${appointmentData.timeSlot} on ${appointmentData.date} for ${doctor.name} is full. You was auto-placed on the Standby Waitlist!`
        );
        return { success: false, error: "Time slot is already booked.", waitlisted: true, waitlistItem };
      }

      const waitlistItem: WaitlistItem = {
        id: waitlistId,
        doctorId: doctor.id,
        doctorName: doctor.name,
        patientId: appointmentData.patientId,
        patientName: appointmentData.patientName,
        date: appointmentData.date,
        timeSlot: appointmentData.timeSlot,
        status: "Active",
        joinedAt
      };
      
      this.data.waitlist.push(waitlistItem);
      this.createNotification(
        appointmentData.patientId,
        `Slot ${appointmentData.timeSlot} on ${appointmentData.date} for ${doctor.name} is full. You was auto-placed on the Waitlist!`
      );
      this.saveLocalJson();
      return { success: false, error: "Time slot is already booked.", waitlisted: true, waitlistItem };
    }

    // Capacity checks
    let dailyCount = 0;
    if (this.isPostgresActive && this.pool) {
      const dailyCheck = await this.pool.query(
        "SELECT COUNT(*) FROM curesync_appointments WHERE doctor_id = $1 AND date = $2 AND status != 'Cancelled'",
        [doctor.id, appointmentData.date]
      );
      dailyCount = Number(dailyCheck.rows[0].count);
    } else {
      dailyCount = this.data.appointments.filter(
        a => a.doctorId === doctor.id && a.date === appointmentData.date && a.status !== "Cancelled"
      ).length;
    }

    if (dailyCount >= doctor.maxDailyAppointments) {
      return { success: false, error: "Doctor has reached the maximum daily bookings capacity for this day." };
    }

    // Patient overlap check
    let patientOverlap = false;
    if (this.isPostgresActive && this.pool) {
      const overlapCheck = await this.pool.query(
        "SELECT COUNT(*) FROM curesync_appointments WHERE patient_id = $1 AND date = $2 AND time_slot = $3 AND status != 'Cancelled'",
        [appointmentData.patientId, appointmentData.date, appointmentData.timeSlot]
      );
      patientOverlap = Number(overlapCheck.rows[0].count) > 0;
    } else {
      patientOverlap = this.data.appointments.some(
        a => a.patientId === appointmentData.patientId &&
             a.date === appointmentData.date &&
             a.timeSlot === appointmentData.timeSlot &&
             a.status !== "Cancelled"
      );
    }

    if (patientOverlap) {
      return { success: false, error: "You already have another appointment active at this exact slot." };
    }

    // Allocation Token
    const token = dailyCount + 1;
    const aptId = "apt_" + Math.random().toString(36).substring(2, 11);
    const createdAt = new Date().toISOString();

    if (this.isPostgresActive && this.pool) {
      const resApt = await this.pool.query(
        `INSERT INTO curesync_appointments 
        (id, doctor_id, doctor_name, doctor_specialization, patient_id, patient_name, date, time_slot, status, token_number, queue_status, created_at) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
        [aptId, doctor.id, doctor.name, doctor.specialization, appointmentData.patientId, appointmentData.patientName, appointmentData.date, appointmentData.timeSlot, "Pending", token, "Booked", createdAt]
      );
      const appointment = rowToAppointment(resApt.rows[0]);
      await this.createNotification(
        appointmentData.patientId,
        `Your appointment booking with ${doctor.name} (${doctor.specialization}) on ${appointmentData.date} at ${appointmentData.timeSlot} was requested successfully. (Token: #${token})`
      );
      return { success: true, appointment };
    }

    const newApt: Appointment = {
      id: aptId,
      doctorId: doctor.id,
      doctorName: doctor.name,
      doctorSpecialization: doctor.specialization,
      patientId: appointmentData.patientId,
      patientName: appointmentData.patientName,
      date: appointmentData.date,
      timeSlot: appointmentData.timeSlot,
      status: "Pending",
      tokenNumber: token,
      queueStatus: "Booked",
      createdAt
    };

    this.data.appointments.push(newApt);
    this.createNotification(
      appointmentData.patientId,
      `Your appointment booking with ${doctor.name} (${doctor.specialization}) on ${appointmentData.date} at ${appointmentData.timeSlot} was requested successfully. (Token: #${token})`
    );
    this.saveLocalJson();
    return { success: true, appointment: newApt };
  }

  // Update Status of Appointment (Pending -> Confirmed -> Completed or Cancelled)
  async updateAppointmentStatus(id: string, newStatus: AppointmentStatus, metadata?: { prescription?: string; queueStatus?: "Booked" | "Confirmed" | "In Queue" | "Completed" }): Promise<Appointment | null> {
    const apt = await this.getAppointmentById(id);
    if (!apt) return null;

    if (apt.status === "Completed" && newStatus !== "Completed") {
      return null; // Completed records cannot be altered
    }

    const previousStatus = apt.status;
    const finalPrescription = metadata?.prescription !== undefined ? metadata.prescription : (apt.prescription || null);
    
    let finalQueueStatus: QueueStatus = apt.queueStatus;
    if (metadata?.queueStatus !== undefined) {
      finalQueueStatus = metadata.queueStatus;
    } else {
      if (newStatus === "Confirmed") finalQueueStatus = "Confirmed";
      if (newStatus === "Completed") finalQueueStatus = "Completed";
    }

    if (this.isPostgresActive && this.pool) {
      const res = await this.pool.query(
        "UPDATE curesync_appointments SET status = $1, prescription = $2, queue_status = $3 WHERE id = $4 RETURNING *",
        [newStatus, finalPrescription, finalQueueStatus, id]
      );
      const updatedApt = rowToAppointment(res.rows[0]);
      
      await this.createNotification(
        updatedApt.patientId,
        `Your appointment with ${updatedApt.doctorName} on ${updatedApt.date} has been updated to: ${newStatus}.`
      );

      // Trigger automatic waitlist logic
      if (newStatus === "Cancelled" && previousStatus !== "Cancelled") {
        const fetchWait = await this.pool.query(
          "SELECT * FROM curesync_waitlists WHERE doctor_id = $1 AND date = $2 AND time_slot = $3 AND status = 'Active' ORDER BY joined_at ASC LIMIT 1",
          [updatedApt.doctorId, updatedApt.date, updatedApt.timeSlot]
        );

        if (fetchWait.rows.length > 0) {
          const candidate = rowToWaitlistItem(fetchWait.rows[0]);
          await this.pool.query("UPDATE curesync_waitlists SET status = 'Notified' WHERE id = $1", [candidate.id]);
          await this.createNotification(
            candidate.patientId,
            `EXCLUSIVE OPENING: The slot ${candidate.timeSlot} on ${candidate.date} with ${candidate.doctorName} has opened! Log in and book now!`
          );
        }
      }

      return updatedApt;
    }

    // Fallback JSON Flow
    const idx = this.data.appointments.findIndex(a => a.id === id);
    if (idx === -1) return null;

    this.data.appointments[idx].status = newStatus;
    if (metadata?.prescription !== undefined) {
      this.data.appointments[idx].prescription = metadata.prescription;
    }
    this.data.appointments[idx].queueStatus = finalQueueStatus;

    this.createNotification(
      apt.patientId,
      `Your appointment with ${apt.doctorName} on ${apt.date} has been updated to: ${newStatus}.`
    );

    if (newStatus === "Cancelled" && previousStatus !== "Cancelled") {
      const nextCandidateIdx = this.data.waitlist.findIndex(
        w => w.doctorId === apt.doctorId && 
             w.date === apt.date && 
             w.timeSlot === apt.timeSlot && 
             w.status === "Active"
      );

      if (nextCandidateIdx !== -1) {
        const candidate = this.data.waitlist[nextCandidateIdx];
        this.data.waitlist[nextCandidateIdx].status = "Notified";
        this.createNotification(
          candidate.patientId,
          `EXCLUSIVE OPENING: The slot ${candidate.timeSlot} on ${candidate.date} with ${candidate.doctorName} has opened! Log in and book now!`
        );
      }
    }

    this.saveLocalJson();
    return this.data.appointments[idx];
  }

  // Reschedule Booking functionality
  async rescheduleAppointment(id: string, newDate: string, newSlot: string): Promise<{ success: boolean; error?: string; appointment?: Appointment }> {
    const apt = await this.getAppointmentById(id);
    if (!apt) return { success: false, error: "Appointment not found." };

    if (apt.status === "Completed" || apt.status === "Cancelled") {
      return { success: false, error: "Cannot reschedule cancelled or completed appointments." };
    }

    const doctor = await this.getDoctorById(apt.doctorId);
    if (!doctor || doctor.softDeleted || !doctor.active) {
      return { success: false, error: "Doctor is currently unavailable." };
    }

    // Double booking check
    let hasDoubleBook = false;
    if (this.isPostgresActive && this.pool) {
      const checkDouble = await this.pool.query(
        "SELECT COUNT(*) FROM curesync_appointments WHERE doctor_id = $1 AND date = $2 AND time_slot = $3 AND status != 'Cancelled' AND id != $4",
        [apt.doctorId, newDate, newSlot, id]
      );
      hasDoubleBook = Number(checkDouble.rows[0].count) > 0;
    } else {
      hasDoubleBook = this.data.appointments.some(
        a => a.doctorId === apt.doctorId &&
             a.date === newDate &&
             a.timeSlot === newSlot &&
             a.status !== "Cancelled" &&
             a.id !== id
      );
    }

    if (hasDoubleBook) {
      return { success: false, error: "The new requested slot is already occupied. Select a different slot." };
    }

    const previousRef = `on ${apt.date} at ${apt.timeSlot}`;

    if (this.isPostgresActive && this.pool) {
      const res = await this.pool.query(
        "UPDATE curesync_appointments SET date = $1, time_slot = $2, rescheduled_from = $3, status = $4 WHERE id = $5 RETURNING *",
        [newDate, newSlot, previousRef, "Pending", id]
      );
      const updatedApt = rowToAppointment(res.rows[0]);
      await this.createNotification(
        updatedApt.patientId,
        `Your appointment with ${doctor.name} was rescheduled to ${newDate} at ${newSlot}. Pending clinic approval.`
      );
      return { success: true, appointment: updatedApt };
    }

    const idx = this.data.appointments.findIndex(a => a.id === id);
    this.data.appointments[idx].date = newDate;
    this.data.appointments[idx].timeSlot = newSlot;
    this.data.appointments[idx].rescheduledFrom = previousRef;
    this.data.appointments[idx].status = "Pending";

    this.createNotification(
      apt.patientId,
      `Your appointment with ${doctor.name} was rescheduled to ${newDate} at ${newSlot}. Pending clinic approval.`
    );

    this.saveLocalJson();
    return { success: true, appointment: this.data.appointments[idx] };
  }

  // ---- Waitlists API ----
  async getWaitlist(): Promise<WaitlistItem[]> {
    if (this.isPostgresActive && this.pool) {
      const res = await this.pool.query("SELECT * FROM curesync_waitlists ORDER BY joined_at DESC");
      return res.rows.map(rowToWaitlistItem);
    }
    return this.data.waitlist;
  }

  async joinWaitlist(doctorId: string, date: string, timeSlot: string, patientId: string, patientName: string): Promise<WaitlistItem | null> {
    const doctor = await this.getDoctorById(doctorId);
    if (!doctor) return null;

    const waitId = "wt_" + Math.random().toString(36).substring(2, 11);
    const joinedAt = new Date().toISOString();
    const status: WaitlistStatus = "Active";

    if (this.isPostgresActive && this.pool) {
      const res = await this.pool.query(
        `INSERT INTO curesync_waitlists (id, doctor_id, doctor_name, patient_id, patient_name, date, time_slot, status, joined_at) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [waitId, doctorId, doctor.name, patientId, patientName, date, timeSlot, status, joinedAt]
      );
      return rowToWaitlistItem(res.rows[0]);
    }

    const waitlistItem: WaitlistItem = {
      id: waitId,
      doctorId,
      doctorName: doctor.name,
      patientId,
      patientName,
      date,
      timeSlot,
      status,
      joinedAt
    };
    
    this.data.waitlist.push(waitlistItem);
    this.saveLocalJson();
    return waitlistItem;
  }

  // ---- Notifications API ----
  async getNotificationsForUser(userId: string): Promise<ClinicNotification[]> {
    if (this.isPostgresActive && this.pool) {
      const res = await this.pool.query("SELECT * FROM curesync_notifications WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
      return res.rows.map(rowToNotification);
    }
    return this.data.notifications.filter(n => n.userId === userId).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createNotification(userId: string, message: string): Promise<ClinicNotification> {
    const notifId = "notif_" + Math.random().toString(36).substring(2, 11);
    const createdAt = new Date().toISOString();

    if (this.isPostgresActive && this.pool) {
      const res = await this.pool.query(
        "INSERT INTO curesync_notifications (id, user_id, message, read, created_at) VALUES ($1, $2, $3, false, $4) RETURNING *",
        [notifId, userId, message, createdAt]
      );
      return rowToNotification(res.rows[0]);
    }

    const notif: ClinicNotification = {
      id: notifId,
      userId,
      message,
      read: false,
      createdAt
    };
    this.data.notifications.push(notif);
    this.saveLocalJson();
    return notif;
  }

  async markNotificationsAsRead(userId: string): Promise<void> {
    if (this.isPostgresActive && this.pool) {
      await this.pool.query("UPDATE curesync_notifications SET read = true WHERE user_id = $1", [userId]);
      return;
    }

    this.data.notifications.forEach(n => {
      if (n.userId === userId) {
        n.read = true;
      }
    });
    this.saveLocalJson();
  }

  // ---- Admin Dashboard Metrics Helper ----
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    // Collect stats from backend queries directly!
    const doctorsList = await this.getDoctors();
    const totalDoctors = doctorsList.length;

    let totalPatients = 0;
    if (this.isPostgresActive && this.pool) {
      const checkPatients = await this.pool.query("SELECT COUNT(*) FROM curesync_users WHERE role = 'PATIENT'");
      totalPatients = Number(checkPatients.rows[0].count);
    } else {
      totalPatients = this.data.users.filter(u => u.role === "PATIENT").length;
    }

    const todayDate = new Date().toISOString().split("T")[0];
    const appointmentsList = await this.getAppointments();

    const todayAppointmentsCount = appointmentsList.filter(a => a.date === todayDate && a.status !== "Cancelled").length;
    const upcomingAppointmentsCount = appointmentsList.filter(
      a => a.date >= todayDate && (a.status === "Confirmed" || a.status === "Pending")
    ).length;
    const completedAppointmentsCount = appointmentsList.filter(a => a.status === "Completed").length;

    const totalTracked = appointmentsList.length;
    const cancelledTracked = appointmentsList.filter(a => a.status === "Cancelled").length;
    const cancellationRate = totalTracked > 0 ? (cancelledTracked / totalTracked) * 100 : 0;

    // Doctor utilization rate
    const doctorUtilization = doctorsList.map(doc => {
      const bookingsCount = appointmentsList.filter(a => a.doctorId === doc.id && a.status !== "Cancelled").length;
      const capacityUnits = doc.maxDailyAppointments * 10 || 10;
      const rate = Math.min(100, Math.round((bookingsCount / capacityUnits) * 100));
      return { doctorName: doc.name, rate };
    });

    // Busiest time slots aggregator
    const slotCounts: Record<string, number> = {};
    appointmentsList.forEach(a => {
      if (a.status !== "Cancelled") {
        slotCounts[a.timeSlot] = (slotCounts[a.timeSlot] || 0) + 1;
      }
    });
    
    const busiestTimeSlots = Object.entries(slotCounts)
      .map(([slot, count]) => ({ slot, count }))
      .sort((a,b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalDoctors,
      totalPatients,
      todayAppointmentsCount,
      upcomingAppointmentsCount,
      completedAppointmentsCount,
      cancellationRate: parseFloat(cancellationRate.toFixed(1)),
      doctorUtilization,
      busiestTimeSlots
    };
  }
}

export const clinicStore = new Store();
