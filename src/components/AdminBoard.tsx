/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Users, TrendingUp, DollarSign, Calendar, CheckSquare, ShieldCheck, 
  Trash2, Edit, RefreshCw, Sparkles, Clock, AlertTriangle, ChevronRight, MessageSquareCode
} from "lucide-react";
import { Doctor, Appointment, DashboardMetrics, WaitlistItem } from "../types";
import { apiService } from "../services/api";
import DoctorCard from "./DoctorCard";

interface AdminBoardProps {
  doctors: Doctor[];
  appointments: Appointment[];
  waitlists: WaitlistItem[];
  onRefreshData: () => void;
  onEditDoctor: (doc: Doctor) => void;
  onOpenCreateDoctor: () => void;
  onAddToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function AdminBoard({
  doctors,
  appointments,
  waitlists,
  onRefreshData,
  onEditDoctor,
  onOpenCreateDoctor,
  onAddToast
}: AdminBoardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Active appointment completing prescription states
  const [completingApt, setCompletingApt] = useState<Appointment | null>(null);
  const [prescriptionText, setPrescriptionText] = useState("");

  // Fetch current clinic analytics
  const fetchAnalytics = async () => {
    setLoadingMetrics(true);
    try {
      const data = await apiService.getAnalytics();
      setMetrics(data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [appointments, doctors]);

  // Operational controls
  const handleConfirm = async (id: string) => {
    try {
      await apiService.confirmAppointment(id);
      onAddToast("Appointment has been approved and confirmed.", "success");
      onRefreshData();
    } catch (err: any) {
      onAddToast(err.message, "error");
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await apiService.cancelAppointment(id);
      onAddToast("Appointment has been cancelled.", "info");
      onRefreshData();
    } catch (err: any) {
      onAddToast(err.message, "error");
    }
  };

  const handleOpenComplete = (apt: Appointment) => {
    setCompletingApt(apt);
    setPrescriptionText("");
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingApt) return;

    try {
      await apiService.completeAppointment(completingApt.id, {
        prescription: prescriptionText.trim(),
        queueStatus: "Completed"
      });
      onAddToast("Appointment marked as completed and files archived.", "success");
      setCompletingApt(null);
      onRefreshData();
    } catch (err: any) {
      onAddToast(err.message, "error");
    }
  };

  const handleToggleDocStatus = async (id: string, current: boolean) => {
    try {
      await apiService.toggleDoctorStatus(id, !current);
      onAddToast(`Doctor status changed successfully.`, "success");
      onRefreshData();
    } catch (err: any) {
      onAddToast(err.message, "error");
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm("Are you sure you would like to deactivate and soft-delete this doctor? This hides them from directory listing but preserves historical records.")) return;
    try {
      await apiService.deleteDoctor(id);
      onAddToast("Doctor profile soft deleted successfully.", "success");
      onRefreshData();
    } catch (err: any) {
      onAddToast(err.message, "error");
    }
  };

  // Live Queue Advanced simulator (Clinician workspace tool)
  const handleAdvanceQueue = async (docId: string) => {
    // Find first 'Confirmed' or 'Booked' appointment for the doctor today and set its queueStatus to 'In Queue'
    const todayStr = new Date().toISOString().split("T")[0];
    const docApts = appointments.filter(
      a => a.doctorId === docId && a.date === todayStr && a.status !== "Cancelled"
    );

    // If there is an active 'In Queue' appointment, let's complete it first!
    const activeInQueue = docApts.find(a => a.queueStatus === "In Queue" && a.status !== "Completed");
    if (activeInQueue) {
      handleOpenComplete(activeInQueue);
      onAddToast(`Please provide prescription for ${activeInQueue.patientName} to close current consult!`, "info");
      return;
    }

    const nextInLine = docApts.find(a => a.queueStatus === "Booked" && a.status === "Pending" || a.status === "Confirmed");
    if (!nextInLine) {
      onAddToast("No more patients waiting in queue today.", "info");
      return;
    }

    try {
      // Auto confirm and place 'In Queue'
      await apiService.confirmAppointment(nextInLine.id);
      await apiService.completeAppointment(nextInLine.id, { queueStatus: "In Queue" });
      onAddToast(`${nextInLine.patientName} (Token: #${nextInLine.tokenNumber}) is now IN CONSULTATION!`, "success");
      onRefreshData();
    } catch (err: any) {
      onAddToast(err.message, "error");
    }
  };

  return (
    <div className="space-y-8">
      
      {/* SECTION: Analytics widgets grids */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 font-display">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Clinic Operations Telemetry
            </h3>
            <p className="text-xs text-slate-400">Monitoring real-time booking rates, capacity buffers, and clinician utilization.</p>
          </div>
          
          <button 
            onClick={fetchAnalytics}
            disabled={loadingMetrics}
            className="rounded-lg p-2 hover:bg-slate-50 border border-slate-205 border-slate-200 flex items-center gap-1.5 text-xs text-slate-600 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingMetrics ? 'animate-spin' : ''}`} />
            <span>Reload metrics</span>
          </button>
        </div>

        {metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Cards 1: Clinicians */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-3">
                <Users className="w-5 h-5" />
              </div>
              <span className="block text-xs font-semibold text-slate-400">Total Specialists</span>
              <p className="text-2xl font-bold text-slate-950 mt-1 font-display">{metrics.totalDoctors}</p>
              <span className="text-[10px] text-slate-400">Active consulting experts</span>
            </div>

            {/* Cards 2: Patients */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600 mb-3">
                <Users className="w-5 h-5" />
              </div>
              <span className="block text-xs font-semibold text-slate-400">Registered Patients</span>
              <p className="text-2xl font-bold text-slate-950 mt-1 font-display">{metrics.totalPatients}</p>
              <span className="text-[10px] text-slate-400">Collaborating Candidates</span>
            </div>

            {/* Cards 3: Today's Bookings */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-650 text-indigo-600 mb-3">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="block text-xs font-semibold text-slate-400">Today's Appointments</span>
              <p className="text-2xl font-bold text-slate-950 mt-1 font-display">{metrics.todayAppointmentsCount}</p>
              <span className="text-[10px] text-indigo-600 font-medium">Live queues active</span>
            </div>

            {/* Cards 4: Cancellations */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-605 text-rose-600 mb-3">
                <CheckSquare className="w-5 h-5" />
              </div>
              <span className="block text-xs font-semibold text-slate-400">Cancellation Rate</span>
              <p className="text-2xl font-bold text-slate-950 mt-1 font-display">{metrics.cancellationRate}%</p>
              <span className="text-[10px] text-rose-600 font-semibold">Tuned to auto-waitlist triggers</span>
            </div>

          </div>
        )}

        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Clinician Utilizations graphs */}
            <div className="md:col-span-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 font-display">Doctor Capacity Utilization</h4>
              <div className="space-y-3">
                {metrics.doctorUtilization.map((doc, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{doc.doctorName}</span>
                      <span className="text-blue-700 font-bold">{doc.rate}% booked</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${doc.rate}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Busiest slots list */}
            <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 font-display">Peak Consulting Slots</h4>
              <div className="space-y-3">
                {metrics.busiestTimeSlots.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-1 border-b border-slate-100 text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-400 border rounded-full h-5 w-5 flex items-center justify-center text-[10px]">{index + 1}</span>
                      <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold">{item.slot}</span>
                    </div>
                    <span className="font-semibold text-slate-705 text-slate-700">{item.count} Scheduled</span>
                  </div>
                ))}
                {metrics.busiestTimeSlots.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">No data files compiled yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECTION: Live Consulting queue controls */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-950 rounded-2xl p-6 text-white shadow-lg border border-slate-800">
        <div className="max-w-xl">
          <h3 className="text-base font-bold flex items-center gap-2 font-display">
            <Sparkles className="w-5 h-5 text-blue-400" />
            Live Consulting Clinic Command Center
          </h3>
          <p className="text-xs text-slate-305 mt-1 mb-4 text-slate-300">Simulate advancing clinic queues in real-time. Consult the next booked patient or log completed profiles.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {doctors.map(doc => {
            const docTodayApts = appointments.filter(
              a => a.doctorId === doc.id && a.date === new Date().toISOString().split("T")[0] && a.status !== "Cancelled"
            );
            
            const inConsult = docTodayApts.find(a => a.queueStatus === "In Queue" && a.status !== "Completed");
            const waitingCount = docTodayApts.filter(a => a.queueStatus === "Booked" && a.status !== "Completed").length;

            return (
              <div key={doc.id} className="bg-white/10 rounded-xl p-4 border border-white/10 flex flex-col justify-between text-xs transition duration-200 hover:bg-white/15">
                <div>
                  <h4 className="font-bold text-white truncate font-display">{doc.name}</h4>
                  <p className="text-[10px] text-blue-300 font-semibold">{doc.specialization}</p>
                </div>

                <div className="mt-3 py-2 border-t border-white/5 space-y-1">
                  <span className="block text-[10px] text-slate-350 text-slate-300">
                    Active: {inConsult ? `Token #${inConsult.tokenNumber} (${inConsult.patientName})` : "None"}
                  </span>
                  <span className="block text-[10px] text-slate-355 text-slate-300">
                    Standby Queue: {waitingCount} Waiting
                  </span>
                </div>

                <button
                  onClick={() => handleAdvanceQueue(doc.id)}
                  className="mt-3 w-full rounded-lg bg-blue-500 py-1.5 text-center text-[11px] font-bold text-white hover:bg-blue-400 transition cursor-pointer"
                >
                  {inConsult ? "Complete Consult" : "Call Next Patient"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION: Operations list - Appointments queue control */}
      <section className="bg-white rounded-2xl border border-slate-205 border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-950 mb-4 font-display">Clinic Consultations Scheduler Panel</h3>

        {appointments.length === 0 ? (
          <p className="text-xs text-center text-gray-400 py-10">No consultations registered inside system data.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-2">Patient</th>
                  <th className="py-3 px-2">Doctor</th>
                  <th className="py-3 px-2">Schedules Slot</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  <th className="py-3 px-2 text-center">Live Queue</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-2">
                      <div className="font-bold text-slate-900">{apt.patientName}</div>
                      <span className="text-[10px] text-slate-400">ID: {apt.patientId}</span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="font-bold text-slate-900">{apt.doctorName}</div>
                      <span className="text-[10px] text-blue-600 font-semibold">{apt.doctorSpecialization}</span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="font-semibold text-slate-800">{apt.date}</div>
                      <span className="font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-bold">{apt.timeSlot}</span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-block rounded-full px-2 py-0.5 font-bold uppercase text-[9px] border ${
                        apt.status === "Completed" ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
                        apt.status === "Cancelled" ? "bg-rose-50 border-rose-200 text-rose-800" :
                        apt.status === "Confirmed" ? "bg-blue-50 border-blue-200 text-blue-800" :
                        "bg-yellow-50 border-yellow-200 text-yellow-800"
                      }`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-600 block w-max mx-auto">
                        {apt.queueStatus} (#{apt.tokenNumber})
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      {apt.status === "Pending" && (
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => handleConfirm(apt.id)}
                            className="rounded bg-blue-500 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-blue-600 transition cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleCancel(apt.id)}
                            className="rounded bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {apt.status === "Confirmed" && (
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => handleOpenComplete(apt)}
                            className="rounded bg-blue-650 bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-blue-700 transition cursor-pointer"
                          >
                            Close / Completed
                          </button>
                          <button
                            onClick={() => handleCancel(apt.id)}
                            className="rounded border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-500 hover:bg-slate-50 transition cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      {apt.status === "Completed" && (
                        <span className="text-[10px] text-emerald-700 font-semibold italic flex items-center gap-1 justify-end">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Consult Checked
                        </span>
                      )}

                      {apt.status === "Cancelled" && (
                        <span className="text-[10px] text-slate-400 italic">Dismissed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* SECTION: Clinician Directory and Management Panel */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-950 font-display">Specialists Directory Management</h3>
            <p className="text-xs text-slate-400">Total of {doctors.length} clinician records found.</p>
          </div>
          <button
            onClick={onOpenCreateDoctor}
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-md transition cursor-pointer font-display"
          >
            Add Doctor Record
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {doctors.map(doc => (
            <DoctorCard
              key={doc.id}
              doctor={doc}
              onBookSelected={() => {}}
              isAdmin={true}
              onStatusToggle={handleToggleDocStatus}
              onEditSelected={onEditDoctor}
              onDeleteSelected={handleDeleteDoc}
            />
          ))}
        </div>
      </section>

      {/* DRAWER MODAL: Completing Consultation with Treatment prescriptions input */}
      {completingApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h4 className="text-sm font-bold text-slate-900 font-display">Treatment Closure & Prescription</h4>
              <p className="text-[11px] text-slate-400">Patient candidate: {completingApt.patientName}</p>
            </div>

            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Prescription advice & Diagnosis *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Tab. Paracetamol 500mg - 1-0-1 after food for 3 days. Rest well, hydrate frequently."
                  value={prescriptionText}
                  onChange={(e) => setPrescriptionText(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-800 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setCompletingApt(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-md cursor-pointer font-display"
                >
                  Mark Completed & Dispatch Files
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
