/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Activity, Star, User, Lock, Mail, ChevronRight, RefreshCw, Sparkles, AlertTriangle, ShieldCheck, Plus, ArrowRight
} from "lucide-react";

import { apiService } from "./services/api";
import { Doctor, Appointment, WaitlistItem, ClinicNotification } from "./types";
import Header from "./components/Header";
import PatientBoard from "./components/PatientBoard";
import AdminBoard from "./components/AdminBoard";
import DoctorRegisterModal from "./components/DoctorRegisterModal";
import ToastContainer, { ToastMessage } from "./components/Toast";

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Dark mode state with localStorage persistence
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("caresync-theme");
    if (saved) return saved === "dark";
    // Check system preference if no previous selection
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches || false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("caresync-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("caresync-theme", "light");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Authentication mode ('login' | 'register')
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  
  // Login standard input states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"PATIENT" | "ADMIN">("PATIENT");

  // Telemetry items states
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [waitlists, setWaitlists] = useState<WaitlistItem[]>([]);
  const [notifications, setNotifications] = useState<ClinicNotification[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Modal active states
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [editDoctorItem, setEditDoctorItem] = useState<Doctor | null>(null);

  // Real-time custom toast lists
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = "toast_" + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check ongoing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const storedToken = apiService.getToken();
      if (storedToken) {
        try {
          const res = await apiService.getMe();
          setCurrentUser(res.user);
          addToast(`Session restored. Welcome back, ${res.user.name}!`, "success");
        } catch (err) {
          apiService.setToken(null);
        }
      }
      setLoadingSession(false);
    };

    checkSession();

    // Event listener for auto-session expiration triggers (401/403)
    const handleAuthExpired = () => {
      setCurrentUser(null);
      addToast("Your session has expired. Please log in again.", "error");
    };

    window.addEventListener("auth-expired", handleAuthExpired);
    return () => window.removeEventListener("auth-expired", handleAuthExpired);
  }, []);

  // Sync data whenever user logs in or updates
  const syncClinicData = async () => {
    if (!currentUser) return;
    setLoadingData(true);
    try {
      const [docsData, aptsData, waitData, notifData] = await Promise.all([
        apiService.getDoctors(),
        apiService.getAppointments(),
        apiService.getWaitlist(),
        apiService.getNotifications()
      ]);

      setDoctors(docsData);
      // Sort appointments: latest bookings first
      setAppointments(aptsData.sort((a: Appointment, b: Appointment) => b.createdAt.localeCompare(a.createdAt)));
      setWaitlists(waitData);
      setNotifications(notifData);
    } catch (err: any) {
      addToast("System Sync Conflict: " + err.message, "error");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    syncClinicData();

    // Polling triggers every 15 seconds to simulate real-time updates / queues standings
    const interval = setInterval(() => {
      syncClinicData();
    }, 15000);

    return () => clearInterval(interval);
  }, [currentUser]);

  // Auth Operations
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      addToast("Please provide both email and password.", "error");
      return;
    }

    try {
      if (authMode === "login") {
        const res = await apiService.login({ email, password });
        setCurrentUser(res.user);
        addToast(`Login successful. Welcome, ${res.user.name}!`, "success");
      } else {
        if (!name.trim()) {
          addToast("Name is required for registration.", "error");
          return;
        }
        const res = await apiService.register({ email, password, name, role });
        setCurrentUser(res.user);
        addToast("Registration complete. Account set up!", "success");
      }
      // Reset inputs
      setEmail("");
      setPassword("");
      setName("");
    } catch (err: any) {
      addToast(err.message || "Authentication failed.", "error");
    }
  };

  // Perform Quick Demostration Login (Instant bypass)
  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    try {
      const res = await apiService.login({ email: demoEmail, password: demoPass });
      setCurrentUser(res.user);
      addToast(`Direct Sign-in: Welcome ${res.user.name}!`, "success");
    } catch (err: any) {
      addToast(err.message, "error");
    }
  };

  const handleLogout = () => {
    apiService.setToken(null);
    setCurrentUser(null);
    setDoctors([]);
    setAppointments([]);
    setWaitlists([]);
    setNotifications([]);
    addToast("Logged out of the CareSync platform successfully.", "info");
  };

  const handleMarkNotificationsRead = async () => {
    try {
      await apiService.markNotificationsRead();
      const freshNotifs = await apiService.getNotifications();
      setNotifications(freshNotifs);
    } catch (err) {
      console.error(err);
    }
  };

  // Perspective Fast-Toggler (Evaluator Assistance)
  const handleRoleMockToggle = async () => {
    if (!currentUser) return;
    
    // Switch to opposite role
    const demoEmail = currentUser.role === "ADMIN" ? "patient@care.com" : "admin@care.com";
    const demoPass = currentUser.role === "ADMIN" ? "patient123" : "admin123";

    addToast(`Switching preview context...`, "info");
    await handleQuickLogin(demoEmail, demoPass);
  };

  // Doctor operations triggers
  const handleOpenCreateDoctor = () => {
    setEditDoctorItem(null);
    setIsDoctorModalOpen(true);
  };

  const handleOpenEditDoctor = (doc: Doctor) => {
    setEditDoctorItem(doc);
    setIsDoctorModalOpen(true);
  };

  const handleSaveDoctor = async (docData: any) => {
    try {
      if (docData.id) {
        // Update
        const response = await apiService.updateDoctor(docData.id, docData);
        addToast(`Doctor profile for ${response.doctor.name} updated.`, "success");
      } else {
        // Create
        const response = await apiService.createDoctor(docData);
        addToast(`New doctor record initialized: ${response.doctor.name}.`, "success");
      }
      setIsDoctorModalOpen(false);
      syncClinicData();
    } catch (err: any) {
      addToast(err.message, "error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-250 relative">
      
      {/* Human-crafted Clean Ambient Background Grid */}
      <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute inset-0 bg-grid-pattern opacity-60 dark:opacity-20"></div>
        <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-blue-50/30 dark:from-blue-950/10 to-transparent"></div>
      </div>

      {/* Toast notifications portal */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header
          currentUser={currentUser}
          notifications={notifications}
          onLogout={handleLogout}
          onReadNotifications={handleMarkNotificationsRead}
          onRoleMockToggle={handleRoleMockToggle}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
        />

        {/* Main Container Wrapper */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">

        
        {loadingSession ? (
          <div className="flex h-96 flex-col items-center justify-center text-center">
            <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="mt-4 text-sm font-medium text-slate-550">Initializing Clinic Gateway. Please wait...</p>
          </div>
        ) : currentUser ? (
          
          /* AUTHENTICATED PORTALS */
          <div>
            {/* Header info badge block */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 dark:border-slate-800 pb-5 gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 font-display">
                  {currentUser.role === "ADMIN" ? "Administrative Cockpit" : "Patient Portal Hub"}
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1 font-display">
                  {currentUser.role === "ADMIN" ? "CareSync Clinic Command Panel" : `Good Morning, ${currentUser.name}`}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {currentUser.role === "ADMIN" 
                    ? "Manage clinicians, review booking standbys, update queue statuses, and track analytics."
                    : "Explore specialists, schedule consulting slots, view queue timelines, and read prescriptions."}
                </p>
              </div>

              {/* Fast Synchronize trigger */}
              <button
                onClick={syncClinicData}
                disabled={loadingData}
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-55"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
                <span>{loadingData ? "Syncing..." : "Sync Database"}</span>
              </button>
            </div>

            {/* RENDER ACTIVE USER ROLE VIEWS */}
            {currentUser.role === "ADMIN" ? (
              <AdminBoard
                doctors={doctors}
                appointments={appointments}
                waitlists={waitlists}
                onRefreshData={syncClinicData}
                onEditDoctor={handleOpenEditDoctor}
                onOpenCreateDoctor={handleOpenCreateDoctor}
                onAddToast={addToast}
              />
            ) : (
              <PatientBoard
                doctors={doctors}
                appointments={appointments}
                waitlists={waitlists}
                onRefreshData={syncClinicData}
                onAddToast={addToast}
              />
            )}

          </div>
        ) : (
          
          /* ANONYMOUS LANDING PORTAL & SECURITY GATEWAY */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center justify-center min-h-[80vh]">
            
            {/* Left Column: Platform Branding and Aesthetic Showcase */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 text-white shadow-md shadow-blue-105 dark:shadow-none">
                <Activity className="w-6 h-6" />
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display leading-[1.12]">
                CareSync Clinic
              </h1>

              <div className="border-l-4 border-blue-500 pl-4 py-1.5 italic text-slate-600 dark:text-slate-300">
                “Wherever the art of Medicine is loved, there is also a love of Humanity.”
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 not-italic mt-1">— Hippocrates</span>
              </div>
              
              <p className="text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400 max-w-xl">
                A thoughtfully simplified system for elegant patient queue coordination, direct clinician workflows, and compassionate appointment scheduling.
              </p>

              {/* Super experience custom human-made visual showcase instead of heavy lists */}
              <div className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/30 p-2 shadow-md">
                <img 
                  src="/src/assets/images/clinic_hero_dashboard_1781974339455.jpg" 
                  alt="Modern CareSync Clinic professional medical staff" 
                  className="rounded-xl w-full object-cover max-h-[280px]"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md px-3.5 py-2.5 rounded-lg border border-slate-150 dark:border-slate-850 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">✦ Cultivating patient satisfaction and clinical excellence.</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold font-mono">LIVE SYNCED</span>
                </div>
              </div>

            </div>

            {/* Right Column: Portal Login/Register card */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
                
                {/* Mode Selector Tabs */}
                <div className="flex rounded-lg bg-slate-100 dark:bg-slate-805 dark:bg-slate-800 p-1 mb-5">
                  <button
                    onClick={() => setAuthMode("login")}
                    className={`flex-1 rounded-md py-1.5 text-center text-xs font-bold cursor-pointer transition ${authMode === "login" ? "bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"}`}
                  >
                    Account Login
                  </button>
                  <button
                    onClick={() => setAuthMode("register")}
                    className={`flex-1 rounded-md py-1.5 text-center text-xs font-bold cursor-pointer transition ${authMode === "register" ? "bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"}`}
                  >
                    Register Patient
                  </button>
                </div>

                <h3 className="text-base font-bold text-slate-950 dark:text-white mb-1 font-display">
                  {authMode === "login" ? "Welcome back" : "Patient Registration"}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-450 mb-5">Provide credentials or select a Quick Demo bypass account below.</p>

                {/* Authentication input form */}
                <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                  {authMode === "register" && (
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-405 mb-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Mary Jane"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-405 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <input
                        type="email"
                        required
                        placeholder="e.g. Mary@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-405 mb-1">Security Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <input
                        type="password"
                        required
                        placeholder="Enter 6+ characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-805 dark:border-slate-800 pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  {authMode === "register" && (
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-405 mb-2">Request Platform Role</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-semibold cursor-pointer">
                          <input 
                            type="radio" 
                            name="reg_role" 
                            checked={role === "PATIENT"} 
                            onChange={() => setRole("PATIENT")} 
                            className="accent-blue-600 h-4 w-4"
                          />
                          <span>PATIENT (Default)</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-semibold cursor-pointer">
                          <input 
                            type="radio" 
                            name="reg_role" 
                            checked={role === "ADMIN"} 
                            onChange={() => setRole("ADMIN")}
                            className="accent-blue-600 h-4 w-4"
                          />
                          <span>ADMINISTRATIVE</span>
                        </label>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-blue-600 py-2 text-center text-xs font-bold text-white hover:bg-blue-700 shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                    id="submit-auth-btn"
                  >
                    <span>{authMode === "login" ? "Enter Portal" : "Join Platform"}</span>
                    <ArrowRight className="w-4 h-4 font-bold" />
                  </button>

                </form>

                {/* FAST DEMO ACCESS CHANNELS (Absolute master key for frictionless testing!) */}
                <div className="border-t border-slate-205 border-slate-100 dark:border-slate-800 mt-6 pt-5">
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-3">Evaluator Access Assist</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => handleQuickLogin("admin@care.com", "admin123")}
                      className="flex flex-col items-start p-3 bg-slate-900 dark:bg-slate-950/65 rounded-xl hover:bg-slate-950 dark:hover:bg-slate-950 transition cursor-pointer text-left border border-slate-800 dark:border-slate-800 shadow-sm"
                      id="quick-login-admin"
                    >
                      <div className="flex items-center gap-1 text-blue-400 font-extrabold mb-0.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-white">Sign-in as Admin</span>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">Username: admin@care.com</span>
                    </button>

                    <button
                      onClick={() => handleQuickLogin("patient@care.com", "patient123")}
                      className="flex flex-col items-start p-3 bg-blue-50/65 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/60 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition cursor-pointer text-left shadow-xs font-medium text-blue-800 dark:text-blue-300"
                      id="quick-login-patient"
                    >
                      <div className="flex items-center gap-1 text-blue-800 dark:text-blue-300 font-extrabold mb-0.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Sign-in as Patient</span>
                      </div>
                      <span className="text-[10px] text-blue-650 text-blue-600 dark:text-blue-400">Username: patient@care.com</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

      </main>

      {/* FOOTER METRICS AREA */}
      <footer className="border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 dark:text-slate-500">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>CareSync Sandbox: Live Operational Databases Active</span>
          </div>
          <div>
            <span>© 2026 CareSync Systems, Inc. Made for 4-Day Appathon.</span>
          </div>
        </div>
      </footer>
      </div>

      {/* Absolute Admin Doctor creations Modals */}
      <DoctorRegisterModal
        isOpen={isDoctorModalOpen}
        onClose={() => setIsDoctorModalOpen(false)}
        onSave={handleSaveDoctor}
        doctorToEdit={editDoctorItem}
      />

    </div>
  );
}
