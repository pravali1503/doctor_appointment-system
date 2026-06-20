/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { 
  clinicStore, 
  hashPassword, 
  generateToken, 
  verifyToken 
} from "./src/db/store.js";

// Extend express Request to include the credentials payload
interface AuthorizedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: "ADMIN" | "PATIENT";
    name: string;
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Middleware: Request Logger
  app.use((req, res, next) => {
    console.log(`[API LOG] ${req.method} ${req.url}`);
    next();
  });

  // ---- JWT Authentication Middleware ----
  async function authenticateToken(req: AuthorizedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({ error: "Missing authentication token. Access denied." });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(403).json({ error: "Invalid or expired session token. Please log in again." });
    }

    req.user = decoded;
    next();
  }

  function requireAdmin(req: AuthorizedRequest, res: Response, next: NextFunction) {
    if (!req.user || req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Access denied. Administrative privileges are required." });
    }
    next();
  }

  // ==========================================
  // 1. AUTHENTICATION ENDPOINTS
  // ==========================================

  // POST /api/auth/register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name, role } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ error: "All profile fields (email, password, name) are required." });
      }

      const existingUser = await clinicStore.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Uniqueness violation: Email is already registered." });
      }

      const requestedRole = (role === "ADMIN") ? "ADMIN" : "PATIENT";
      const userPasswordHash = hashPassword(password);

      const created = await clinicStore.createUser({
        email: email.trim(),
        name: name.trim(),
        passwordHash: userPasswordHash,
        role: requestedRole
      });

      const token = generateToken({
        id: created.id,
        email: created.email,
        role: created.role,
        name: created.name
      });

      return res.status(201).json({
        message: "Registration successful.",
        token,
        user: { id: created.id, email: created.email, name: created.name, role: created.role }
      });
    } catch (err: any) {
      return res.status(500).json({ error: "Internal server registry error: " + err.message });
    }
  });

  // POST /api/auth/login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
      }

      const user = await clinicStore.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials: User not found." });
      }

      if (user.passwordHash !== hashPassword(password)) {
        return res.status(401).json({ error: "Invalid credentials: Password mismatch." });
      }

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      });

      return res.json({
        message: "Login successful.",
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role }
      });
    } catch (err: any) {
      return res.status(500).json({ error: "Login server crash: " + err.message });
    }
  });

  // POST /api/auth/refresh
  app.post("/api/auth/refresh", (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Token reference is required" });
    
    // Verify & reissue
    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: "Session token invalid or expired" });

    const freshToken = generateToken({
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name
    });

    return res.json({ token: freshToken });
  });

  // GET /api/auth/me
  app.get("/api/auth/me", authenticateToken, (req: AuthorizedRequest, res) => {
    return res.json({ user: req.user });
  });

  // ==========================================
  // 2. DOCTORS ENDPOINTS
  // ==========================================

  // GET /api/doctors
  app.get("/api/doctors", async (req, res) => {
    try {
      const doctors = await clinicStore.getDoctors();
      return res.json(doctors);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to fetch doctors: " + err.message });
    }
  });

  // GET /api/doctors/:id
  app.get("/api/doctors/:id", async (req, res) => {
    const doc = await clinicStore.getDoctorById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Doctor profile not found." });
    return res.json(doc);
  });

  // POST /api/doctors (Admin Only)
  app.post("/api/doctors", authenticateToken, requireAdmin, async (req: AuthorizedRequest, res) => {
    try {
      const { 
        name, specialization, experience, qualification, 
        consultationFee, availableDays, availableSlots, 
        bufferTime, maxDailyAppointments, photoUrl 
      } = req.body;

      if (!name || !specialization || !qualification || !consultationFee || !availableDays || !availableSlots) {
        return res.status(400).json({ error: "Primary parameters for doctor creation are missing." });
      }

      const added = await clinicStore.createDoctor({
        name,
        specialization,
        experience: Number(experience) || 3,
        qualification,
        consultationFee: Number(consultationFee),
        availableDays,
        availableSlots,
        bufferTime: Number(bufferTime) || 0,
        maxDailyAppointments: Number(maxDailyAppointments) || 10,
        photoUrl: photoUrl || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300"
      });

      return res.status(201).json({ message: "Doctor profile created successfully.", doctor: added });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to create doctor: " + err.message });
    }
  });

  // PUT /api/doctors/:id (Admin Only)
  app.put("/api/doctors/:id", authenticateToken, requireAdmin, async (req: AuthorizedRequest, res) => {
    try {
      const updated = await clinicStore.updateDoctor(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: "Doctor profile not found." });
      return res.json({ message: "Doctor profile updated.", doctor: updated });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to modify doctor: " + err.message });
    }
  });

  // PATCH /api/doctors/:id/status (Admin Only)
  app.patch("/api/doctors/:id/status", authenticateToken, requireAdmin, async (req: AuthorizedRequest, res) => {
    try {
      const { active } = req.body;
      if (typeof active !== "boolean") return res.status(400).json({ error: "Invalid dynamic status type." });

      const updated = await clinicStore.updateDoctor(req.params.id, { active });
      if (!updated) return res.status(404).json({ error: "Doctor profile not found." });

      return res.json({ message: `Doctor is now ${active ? 'Active' : 'Inactive'}.`, doctor: updated });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to toggle status: " + err.message });
    }
  });

  // DELETE /api/doctors/:id (Admin Only soft delete)
  app.delete("/api/doctors/:id", authenticateToken, requireAdmin, async (req: AuthorizedRequest, res) => {
    try {
      const success = await clinicStore.softDeleteDoctor(req.params.id);
      if (!success) return res.status(404).json({ error: "Doctor profile and records not found." });
      return res.json({ message: "Doctor deactivated and soft deleted from directory." });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to delete: " + err.message });
    }
  });

  // ==========================================
  // 3. APPOINTMENTS ENDPOINTS
  // ==========================================

  // GET /api/appointments
  app.get("/api/appointments", authenticateToken, async (req: AuthorizedRequest, res) => {
    try {
      const user = req.user!;
      let apts = await clinicStore.getAppointments();
      if (user.role === "PATIENT") {
        apts = apts.filter(a => a.patientId === user.id);
      }
      return res.json(apts);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // POST /api/appointments (Booking)
  app.post("/api/appointments", authenticateToken, async (req: AuthorizedRequest, res) => {
    try {
      const user = req.user!;
      const { doctorId, date, timeSlot } = req.body;

      if (!doctorId || !date || !timeSlot) {
        return res.status(400).json({ error: "Doctor ID, date, and time slot are required." });
      }

      const bookingDecision = await clinicStore.createAppointment({
        doctorId,
        patientId: user.id,
        patientName: user.name,
        date,
        timeSlot
      });

      if (!bookingDecision.success) {
        if (bookingDecision.waitlisted) {
          return res.status(202).json({
            message: "Slot is occupied. You was placed on the priority waitlist.",
            waitlisted: true,
            waitlistItem: bookingDecision.waitlistItem
          });
        }
        return res.status(400).json({ error: bookingDecision.error });
      }

      return res.status(201).json({
        message: "Appointment scheduled successfully.",
        appointment: bookingDecision.appointment
      });
    } catch (err: any) {
      return res.status(500).json({ error: "Scheduler conflict: " + err.message });
    }
  });

  // PATCH /api/appointments/:id/cancel
  app.patch("/api/appointments/:id/cancel", authenticateToken, async (req: AuthorizedRequest, res) => {
    try {
      const user = req.user!;
      const apt = await clinicStore.getAppointmentById(req.params.id);
      
      if (!apt) return res.status(404).json({ error: "Appointment not found." });

      // Security: Patients can only cancel their own. Admin can cancel any.
      if (user.role === "PATIENT" && apt.patientId !== user.id) {
        return res.status(403).json({ error: "Permission denied." });
      }

      if (apt.status === "Completed") {
        return res.status(400).json({ error: "Completed appointments cannot be cancelled." });
      }

      const updated = await clinicStore.updateAppointmentStatus(req.params.id, "Cancelled");
      return res.json({ message: "Appointment has been cancelled successfully.", appointment: updated });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // PATCH /api/appointments/:id/confirm (Admin Only)
  app.patch("/api/appointments/:id/confirm", authenticateToken, requireAdmin, async (req: AuthorizedRequest, res) => {
    try {
      const updated = await clinicStore.updateAppointmentStatus(req.params.id, "Confirmed");
      if (!updated) return res.status(404).json({ error: "Appointment reference not found." });
      return res.json({ message: "Appointment confirmed.", appointment: updated });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // PATCH /api/appointments/:id/complete (Admin Only - can include prescription & queueStatus)
  app.patch("/api/appointments/:id/complete", authenticateToken, requireAdmin, async (req: AuthorizedRequest, res) => {
    try {
      const { prescription, queueStatus } = req.body;
      const updated = await clinicStore.updateAppointmentStatus(req.params.id, "Completed", { 
        prescription, 
        queueStatus: queueStatus || "Completed" 
      });
      if (!updated) return res.status(404).json({ error: "Appointment reference not found." });
      return res.json({ message: "Appointment completed & treatment closed.", appointment: updated });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // PATCH /api/appointments/:id/reschedule
  app.patch("/api/appointments/:id/reschedule", authenticateToken, async (req: AuthorizedRequest, res) => {
    try {
      const user = req.user!;
      const { date, timeSlot } = req.body;
      if (!date || !timeSlot) return res.status(400).json({ error: "Date and time slot are required." });

      const apt = await clinicStore.getAppointmentById(req.params.id);
      if (!apt) return res.status(404).json({ error: "Appointment not found." });

      if (user.role === "PATIENT" && apt.patientId !== user.id) {
        return res.status(403).json({ error: "Permission denied." });
      }

      const result = await clinicStore.rescheduleAppointment(req.params.id, date, timeSlot);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.json({ message: "Appointment rescheduled successfully.", appointment: result.appointment });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // 4. WAITLIST ENDPOINTS
  // ==========================================

  // GET /api/waitlist
  app.get("/api/waitlist", authenticateToken, async (req: AuthorizedRequest, res) => {
    try {
      const user = req.user!;
      let lists = await clinicStore.getWaitlist();
      if (user.role === "PATIENT") {
        lists = lists.filter(w => w.patientId === user.id);
      }
      return res.json(lists);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // POST /api/waitlist (Manual sign-on)
  app.post("/api/waitlist", authenticateToken, async (req: AuthorizedRequest, res) => {
    try {
      const user = req.user!;
      const { doctorId, date, timeSlot } = req.body;

      if (!doctorId || !date || !timeSlot) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const joined = await clinicStore.joinWaitlist(doctorId, date, timeSlot, user.id, user.name);
      if (!joined) return res.status(404).json({ error: "Doctor not found" });

      return res.status(201).json({ message: "Placed on waitlist.", waitlistItem: joined });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // 5. NOTIFICATIONS ENDPOINTS
  // ==========================================

  app.get("/api/notifications", authenticateToken, async (req: AuthorizedRequest, res) => {
    try {
      const user = req.user!;
      const match = await clinicStore.getNotificationsForUser(user.id);
      return res.json(match);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/notifications/read", authenticateToken, async (req: AuthorizedRequest, res) => {
    try {
      const user = req.user!;
      await clinicStore.markNotificationsAsRead(user.id);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // 6. ANALYTICS (Admin Only)
  // ==========================================

  app.get("/api/analytics", authenticateToken, requireAdmin, async (req: AuthorizedRequest, res) => {
    try {
      const reports = await clinicStore.getDashboardMetrics();
      return res.json(reports);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // 7. VITE CLIENT MIDDLEWARE & STATIC SERVING
  // ==========================================

  if (process.env.NODE_ENV !== "production") {
    // Development server with HMR configurations disabled
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production asset binding
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    // Fallback support for older express versions
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Launch Container Gateway on Port 3000
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CareSync Platform running smoothly on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Critical server launch failure:", err);
});
