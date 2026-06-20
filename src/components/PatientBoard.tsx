/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Calendar, Clock, CheckCircle2, AlertCircle, Sparkles, Search, ChevronRight, BookmarkCheck, Inbox, ShieldAlert, BadgeCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Doctor, Appointment, WaitlistItem, SearchFilters } from "../types";
import { apiService } from "../services/api";
import DoctorCard from "./DoctorCard";

interface PatientBoardProps {
  doctors: Doctor[];
  appointments: Appointment[];
  waitlists: WaitlistItem[];
  onRefreshData: () => void;
  onAddToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function PatientBoard({
  doctors,
  appointments,
  waitlists,
  onRefreshData,
  onAddToast
}: PatientBoardProps) {
  // Filters state
  const [filters, setFilters] = useState<SearchFilters>({
    searchQuery: "",
    specialization: "",
    maxFee: 200,
    availableDate: "",
    availabilityStatus: "All",
    sortBy: "earliest"
  });

  // Scheduling box state
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingSlot, setBookingSlot] = useState("");

  // Rescheduling box state
  const [reschedulingApt, setReschedulingApt] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlot, setRescheduleSlot] = useState("");

  // Selected Specialization listing
  const specializationList = Array.from(new Set(doctors.map(d => d.specialization)));

  // ---- Smart Recommendation algorithm (Lowest Waiting & Prioritized) ----
  const [smartRec, setSmartRec] = useState<{ doctor: Doctor; slot: string; reason: string } | null>(null);

  useEffect(() => {
    if (doctors.length === 0) return;
    
    // Find the doctor with lowest consultation fee, highest experience and active state
    const activeDocs = doctors.filter(d => d.active && !d.softDeleted);
    if (activeDocs.length === 0) {
      setSmartRec(null);
      return;
    }

    // Rank based on active factors:
    // (1) lowest fee, (2) highest experience, (3) available slots
    const sortedDocs = [...activeDocs].sort((a, b) => {
      if (a.consultationFee !== b.consultationFee) return a.consultationFee - b.consultationFee;
      return b.experience - a.experience;
    });

    const recommended = sortedDocs[0];
    const availableSlot = recommended.availableSlots[0] || "09:00";
    
    setSmartRec({
      doctor: recommended,
      slot: availableSlot,
      reason: `Highly experienced (${recommended.experience} yrs) expert with budget consultation of just $${recommended.consultationFee}.`
    });
  }, [doctors]);

  // Handle Search filtering
  const filteredDoctors = doctors
    .filter(doc => {
      if (doc.softDeleted) return false;
      
      const matchesSearch = doc.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) || 
                            doc.specialization.toLowerCase().includes(filters.searchQuery.toLowerCase());
      
      const matchesSpec = !filters.specialization || doc.specialization === filters.specialization;
      
      const matchesFee = doc.consultationFee <= filters.maxFee;

      return matchesSearch && matchesSpec && matchesFee;
    })
    .sort((a, b) => {
      if (filters.sortBy === "lowest_fee") return a.consultationFee - b.consultationFee;
      if (filters.sortBy === "highest_experience") return b.experience - a.experience;
      return 0; // Default order
    });

  const handleOpenBooking = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    
    // Default to tomorrow or next consulting day
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];
    
    setBookingDate(dateStr);
    setBookingSlot(doctor.availableSlots[0] || "09:00");
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;

    try {
      const response = await apiService.bookAppointment({
        doctorId: selectedDoctor.id,
        date: bookingDate,
        timeSlot: bookingSlot
      });

      if (response.waitlisted) {
        onAddToast(response.message, "info");
      } else {
        onAddToast("Appointment request submitted successfully!", "success");
      }
      
      setSelectedDoctor(null);
      onRefreshData();
    } catch (err: any) {
      onAddToast(err.message || "Failed to submit booking.", "error");
    }
  };

  const handleCancelApt = async (id: string) => {
    if (!confirm("Are you sure you would like to cancel this scheduled appointment?")) return;
    try {
      await apiService.cancelAppointment(id);
      onAddToast("Your appointment has been successfully cancelled.", "success");
      onRefreshData();
    } catch (err: any) {
      onAddToast(err.message || "Failed to cancel.", "error");
    }
  };

  const handleOpenReschedule = (apt: Appointment) => {
    setReschedulingApt(apt);
    setRescheduleDate(apt.date);
    setRescheduleSlot(apt.timeSlot);
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingApt) return;

    try {
      await apiService.rescheduleAppointment(reschedulingApt.id, {
        date: rescheduleDate,
        timeSlot: rescheduleSlot
      });
      onAddToast("Appointment rescheduled. Pending clinic confirmation.", "success");
      setReschedulingApt(null);
      onRefreshData();
    } catch (err: any) {
      onAddToast(err.message, "error");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      
      {/* LEFT 2 COLUMNS: Browse & Active Bookings */}
      <div className="lg:col-span-2 space-y-8">
        
        {/* SECTION: Patient's Active Appointments and Timeline tracking */}
        <section className="bg-white rounded-2xl border border-slate-205 border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 font-display">
              <BadgeCheck className="w-5 h-5 text-blue-600" />
              Your Upcoming Consultations
            </h3>
            <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
              {appointments.filter(a => a.status !== "Cancelled" && a.status !== "Completed").length} Active
            </span>
          </div>

          {appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              <Inbox className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-500">No active scheduled appointments found.</p>
              <p className="text-xs text-slate-400 mt-1">Select an expert below and schedule your consultation instantly.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {appointments.map((apt) => {
                  // Color configuration of timeline steps based on status
                  const isCancelled = apt.status === "Cancelled";
                  const isCompleted = apt.status === "Completed";
                  const isConfirmed = apt.status === "Confirmed";
                  const isInTreatment = apt.queueStatus === "In Queue" && !isCompleted && !isCancelled;
                  
                  // Timeline steps to reflect "Waiting" to "In Treatment" transition
                  const timelineSteps = [
                    { label: "Booked", reached: true, sub: "Clinic requested" },
                    { label: "Waiting", reached: isConfirmed || isCompleted || apt.queueStatus === "In Queue", sub: "Lobby queue" },
                    { label: "In Treatment", reached: apt.queueStatus === "In Queue" || isCompleted, sub: "Under Consultation" },
                    { label: "Completed", reached: isCompleted, sub: "Archived & Closed" }
                  ];

                  return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ type: "spring", stiffness: 380, damping: 28 }}
                      key={apt.id} 
                      className={`relative rounded-xl border p-5 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${
                        isInTreatment 
                          ? "border-blue-450 border-blue-500 bg-gradient-to-b from-white to-blue-50/10 shadow-blue-100/50 shadow-md ring-1 ring-blue-500/20" 
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      {/* Floating glowing background for In Treatment status */}
                      {isInTreatment && (
                        <motion.div 
                          initial={{ opacity: 0.1 }}
                          animate={{ opacity: [0.1, 0.25, 0.1] }}
                          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                          className="absolute inset-0 bg-blue-500/10 pointer-events-none"
                        />
                      )}
                      
                      {/* Active Live Treatment Notice Alert */}
                      <AnimatePresence>
                        {isInTreatment && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0, scale: 0.95 }}
                            animate={{ opacity: 1, height: "auto", scale: 1 }}
                            exit={{ opacity: 0, height: 0, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="mb-4 rounded-lg bg-gradient-to-r from-blue-650 via-blue-600 to-indigo-600 p-3.5 text-white shadow-md shadow-blue-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-blue-550 border-blue-500"
                          >
                            <div className="flex items-start gap-2.5">
                              <span className="relative flex h-3 w-3 mt-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-200 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                              </span>
                              <div>
                                <h5 className="text-xs font-bold uppercase tracking-wider text-blue-100 font-display">Live Treatment Call</h5>
                                <p className="text-xs mt-0.5 font-medium leading-relaxed">
                                  You are now <strong className="underline text-amber-300">In Treatment</strong>! Please head to Dr. {apt.doctorName}'s chamber.
                                </p>
                              </div>
                            </div>
                            <div className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-blue-100 shrink-0 font-mono self-start sm:self-auto">
                              NOW CONSULTING
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Appointment Basic Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 font-display">{apt.doctorName}</h4>
                          <p className="text-xs font-bold text-blue-600">{apt.doctorSpecialization}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Status Label with animated highlight */}
                          <motion.span 
                            layoutId={`badge-${apt.id}`}
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide border ${
                              isInTreatment ? "bg-blue-600 border-blue-500 text-white shadow-xs animate-pulse" :
                              isCompleted ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
                              isCancelled ? "bg-rose-50 border-rose-200 text-rose-800" :
                              isConfirmed ? "bg-blue-50 border-blue-200 text-blue-800" :
                              "bg-yellow-50 border-yellow-200 text-yellow-800"
                            }`}
                          >
                            {isInTreatment ? "In Treatment" : apt.status}
                          </motion.span>

                          {/* Token Indicator */}
                          {apt.status !== "Cancelled" && (
                            <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-mono font-bold text-blue-800">
                              Token: #{apt.tokenNumber}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Date/Time detail */}
                      <div className="flex flex-wrap items-center gap-4 py-3 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>Date: {apt.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-blue-700">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>At: {apt.timeSlot}</span>
                        </div>
                        {apt.rescheduledFrom && (
                          <div className="bg-amber-50 px-2 py-0.5 rounded text-[10px] text-amber-700 font-medium">
                            Rescheduled from: {apt.rescheduledFrom}
                          </div>
                        )}
                        {!isCancelled && !isCompleted && (
                          <div className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            apt.queueStatus === "In Queue" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"
                          }`}>
                            Queue: {apt.queueStatus === "In Queue" ? "In Treatment" : "Waiting"}
                          </div>
                        )}
                      </div>

                      {/* VISUAL TIMELINE COMPONENT (Only for Active / Confirmed Bookings) */}
                      {!isCancelled && (
                        <div className="py-4 px-2 border-t border-slate-100">
                          <div className="flex justify-between relative">
                            <div className="absolute top-4 left-10 right-10 h-0.5 bg-slate-100 z-0"></div>
                            
                            {/* Inner progressed bar with Framer Motion spring width animation */}
                            <motion.div 
                              className="absolute top-4 left-10 h-0.5 bg-blue-500 z-0"
                              initial={{ width: "0%" }}
                              animate={{
                                width: isCompleted ? "calc(100% - 80px)" :
                                       apt.queueStatus === "In Queue" ? "calc(66% - 50px)" :
                                       isConfirmed ? "calc(33% - 20px)" : "0%"
                              }}
                              transition={{ type: "spring", stiffness: 120, damping: 18 }}
                            />

                            {timelineSteps.map((step, idx) => {
                              const isStepActive = (idx === 0 && !isConfirmed && apt.queueStatus !== "In Queue" && !isCompleted) ||
                                                 (idx === 1 && isConfirmed && apt.queueStatus !== "In Queue" && !isCompleted) ||
                                                 (idx === 2 && apt.queueStatus === "In Queue" && !isCompleted) ||
                                                 (idx === 3 && isCompleted);

                              return (
                                <div key={idx} className="flex flex-col items-center text-center z-10 w-20 relative">
                                  <motion.div 
                                    animate={isStepActive ? {
                                      scale: [1, 1.15, 1],
                                      borderColor: "#2563eb",
                                      backgroundColor: "#2563eb",
                                      boxShadow: "0 0 10px rgba(59, 130, 246, 0.4)"
                                    } : { scale: 1 }}
                                    transition={isStepActive ? { repeat: Infinity, duration: 2, ease: "easeInOut" } : {}}
                                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-all ${
                                      step.reached 
                                        ? "bg-blue-600 border-blue-600 text-white shadow-md" 
                                        : "bg-white border-slate-200 text-slate-400"
                                    }`}
                                  >
                                    {idx + 1}
                                  </motion.div>
                                  <span className={`block text-[10px] font-bold mt-1.5 transition-colors ${
                                    isStepActive ? "text-blue-600 font-extrabold" : step.reached ? "text-slate-900" : "text-slate-400"
                                  }`}>{step.label}</span>
                                  <span className="hidden sm:block text-[8px] text-slate-400 mt-0.5 leading-tight">{step.sub}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Prescription Details block */}
                      {isCompleted && apt.prescription && (
                        <div className="rounded-xl bg-blue-50/50 p-4 border border-blue-100/50 mt-2 text-xs">
                          <h5 className="font-bold text-blue-900 mb-1 flex items-center gap-1 font-display">
                            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                            Treatment Prescription / Advice:
                          </h5>
                          <p className="text-blue-800 block font-serif italic whitespace-pre-line bg-white/70 p-3 rounded-lg border border-blue-105">{apt.prescription}</p>
                        </div>
                      )}

                      {/* Cancellation & Rescheduling Controls */}
                      {!isCancelled && !isCompleted && (
                        <div className="mt-4 flex gap-2 justify-end border-t border-slate-100 pt-3">
                          <button
                            onClick={() => handleOpenReschedule(apt)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => handleCancelApt(apt.id)}
                            className="rounded-lg border border-rose-100 bg-rose-50/50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 cursor-pointer"
                          >
                            Cancel Appointment
                          </button>
                        </div>
                      )}

                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* SECTION: Complete Doctor Listing Directory */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">Find Your Medical Specialists</h3>
              <p className="text-xs text-slate-500">Search doctor records, consult costs, and schedules.</p>
            </div>

            {/* Sorting choices */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Sort By:</span>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 focus:outline-none"
              >
                <option value="earliest">Earliest Available</option>
                <option value="lowest_fee">Lowest Fee ($ to $$)</option>
                <option value="highest_experience">Highest Experience</option>
              </select>
            </div>
          </div>

          {/* Filtering control segment */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            
            {/* Search Input */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search doctors, cardiacs, pediatrics..."
                value={filters.searchQuery}
                onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-800"
              />
            </div>

            {/* Speciality selections */}
            <div>
              <select
                value={filters.specialization}
                onChange={(e) => setFilters(prev => ({ ...prev, specialization: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none"
              >
                <option value="">All Specializations</option>
                {specializationList.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            {/* Price Fee bar */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-slate-400 font-bold">Max Fee: ${filters.maxFee}</span>
              </div>
              <input 
                type="range"
                min="50"
                max="300"
                step="10"
                value={filters.maxFee}
                onChange={(e) => setFilters(prev => ({ ...prev, maxFee: Number(e.target.value) }))}
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

          </div>

          {/* Doctor Cards directories grids */}
          {filteredDoctors.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-white border border-gray-100 flex flex-col items-center">
              <span className="text-3xl">😞</span>
              <h4 className="text-sm font-bold text-gray-800 mt-2">No Matching Clinicians Located</h4>
              <p className="text-xs text-gray-500 max-w-xs mt-1">Try relaxing some fee sliders or typing a generic clinician name query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredDoctors.map((doc) => (
                <DoctorCard
                  key={doc.id}
                  doctor={doc}
                  onBookSelected={handleOpenBooking}
                  isAdmin={false}
                />
              ))}
            </div>
          )}

        </section>

      </div>

      {/* RIGHT SIDEBAR COLUMN: Smart Recommendations & Waitlists */}
      <div className="space-y-6">
        
        {/* WIDGET: Smart Recommendation (Lowest waiting/Best experience) */}
        {smartRec && (
          <div className="rounded-2xl border border-blue-105 bg-gradient-to-b from-blue-50/60 to-blue-50/10 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500 text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide font-display">Expert recommendation</h4>
            </div>
            
            <div className="flex gap-3 items-start">
              <img 
                src={smartRec.doctor.photoUrl} 
                alt={smartRec.doctor.name} 
                className="w-10 h-10 rounded-full object-cover ring-1 ring-blue-200 shadow-xs" 
              />
              <div>
                <h5 className="text-sm font-bold text-slate-900 font-display">{smartRec.doctor.name}</h5>
                <p className="text-xs font-bold text-blue-600 mb-2">{smartRec.doctor.specialization}</p>
                <p className="text-xs text-blue-800 leading-relaxed bg-blue-50/70 p-2.5 rounded-lg border border-blue-100">
                  {smartRec.reason}
                </p>
                <button
                  onClick={() => handleOpenBooking(smartRec.doctor)}
                  className="mt-3 inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition cursor-pointer font-display"
                >
                  <span>Book Recommended Slot</span>
                  <ChevronRight className="w-3.5 h-3.5 font-bold" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* WIDGET: Priority Waitlists tracker */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-1.5 uppercase tracking-wide font-display">
            <BookmarkCheck className="w-4 h-4 text-blue-600" />
            Your Waitlist Standby Tracker
          </h4>

          {waitlists.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center border border-dashed border-slate-100 rounded-lg">
              You are not currently waiting on any standby slots.
            </p>
          ) : (
            <div className="space-y-3">
              {waitlists.map((wt) => (
                <div key={wt.id} className="p-3 bg-slate-50/60 rounded-xl border border-slate-100 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-850 text-slate-800">{wt.doctorName}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold border ${
                      wt.status === "Active" ? "bg-amber-50 border-amber-200 text-amber-700 animate-pulse" :
                      wt.status === "Notified" ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-bold" :
                      "bg-slate-100 border-slate-200 text-slate-450"
                    }`}>
                      {wt.status}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-1">Requested slot: {wt.date} ({wt.timeSlot})</p>
                  
                  {wt.status === "Notified" && (
                    <div className="bg-emerald-50/80 p-2 rounded-lg border border-emerald-100 mt-2 text-emerald-800">
                      <span className="block font-bold">✨ EXCLUSIVE SPOT RELEASE</span>
                      <p className="mt-0.5 text-[10px]">The slot has opened! Please click "Schedule Consultation" on this doctor below to claim!</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* COMPONENT DRAWER: Appointment scheduler booking modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h4 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 font-display">
              Schedule Consultation with {selectedDoctor.name}
            </h4>
            
            <form onSubmit={handleBookSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Consultation Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Consulting Hour</label>
                <select
                  value={bookingSlot}
                  onChange={(e) => setBookingSlot(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                >
                  {selectedDoctor.availableSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100/50 text-xs text-blue-850 text-blue-800">
                <span className="font-bold flex items-center gap-1 font-display">
                  <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                  Waitlist / Standing Auto-Queue Protection
                </span>
                <p className="mt-1 leading-relaxed">If the requested hour is booked by another patient, the platform will automatically add you on priority standby.</p>
              </div>

              {/* Drawer actions */}
              <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedDoctor(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-md cursor-pointer font-display"
                >
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPONENT DRAWER: Rescheduler modal */}
      {reschedulingApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h4 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 font-display">
              Modify Appointment Date / Time
            </h4>
            
            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Slot Time</label>
                <select
                  value={rescheduleSlot}
                  onChange={(e) => setRescheduleSlot(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                >
                  {/* Find active timeslots for doctor */}
                  {(doctors.find(d => d.id === reschedulingApt.doctorId)?.availableSlots || []).map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setReschedulingApt(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-md cursor-pointer font-display"
                >
                  Confirm Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
