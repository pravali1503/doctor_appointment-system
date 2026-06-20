/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { X, Download, FileText, Code, Settings, Server, Database, Sparkles, Layers } from "lucide-react";
import { jsPDF } from "jspdf";

interface SystemDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SystemDocsModal({ isOpen, onClose }: SystemDocsModalProps) {
  const [activeTab, setActiveTab] = useState<"specs" | "logic" | "endpoints">("specs");
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const generatePDFVersion = () => {
    setDownloading(true);
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      let pageNum = 1;

      // Helper function to draw Footer with Page Number
      const drawFooterHelper = () => {
        doc.setFont("Helvetica", "oblique");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text("CareSync Systems, Inc. — Official System Blueprint Guide", 20, 287);
        doc.text(`Page ${pageNum}`, 190, 287, { align: "right" });
      };

      // Helper function to draw Header border
      const drawHeaderHelper = (title: string) => {
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(59, 130, 246); // blue-500
        doc.text("TECHNICAL SPECIFICATIONS PORTAL", 20, 15);
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(title, 190, 15, { align: "right" });
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(0.3);
        doc.line(20, 18, 190, 18);
      };

      // ==========================================
      // PAGE 1: TITLE PAGE & EXEC SUMMARY
      // ==========================================
      drawHeaderHelper("SYSTEM INTRODUCTION");
      
      // Page Title
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("CareSync Platform", 20, 45);
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(59, 130, 246); // blue-500
      doc.text("Smart Clinic Scheduler & Standby Queue Optimizer", 20, 52);

      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(1.5);
      doc.line(20, 57, 100, 57);

      // Metadata information
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("Classification: Confident / Developer Blueprint Manual", 20, 67);
      doc.text("Compiled for: 4-Day Application Showcase & Evaluation", 20, 72);
      doc.text("Release Year: 2026", 20, 77);
      doc.text("Database Status: File-based JSON Transaction Isolated Active", 20, 82);

      // Divider line
      doc.setDrawColor(241, 245, 249); // slate-100
      doc.setLineWidth(0.5);
      doc.line(20, 90, 190, 90);

      // Executive summary
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("1. Executive Technical Summary", 20, 100);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85); // slate-700
      
      const p1Text = [
        "CareSync is a highly integrated full-stack clinic scheduling and consultation workspace designed to eliminate coordination bottlenecks typical of community health environments. It implements explicit, real-time guards against patient booking conflicts, automates specialist clinic capacity management, and provides immediate, SMS-style on-platform standby alerts to waiting patients in response to late cancellations.",
        "",
        "The platform utilizes state-of-the-art styling cues: fluid responsiveness tailored to clinical monitors, clean visual status tracking timelines, and native layout motion animations. To ensure an exceptionally intuitive evaluation workspace, CareSync offers direct single-tap demonstration credentials ('Admin Cockpit' vs 'Patient Hub') and mock role-toggling features that preserve active data states across session swaps."
      ];

      let currentY = 107;
      p1Text.forEach(line => {
        if (line === "") {
          currentY += 4;
        } else {
          const splitLines = doc.splitTextToSize(line, 170);
          doc.text(splitLines, 20, currentY);
          currentY += (splitLines.length * 4.5);
        }
      });

      // Section 1.1: Core Design Goals
      currentY += 4;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("1.1 Core Engineering Mandates", 20, currentY);
      currentY += 6;

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9.5);
      const mandates = [
        "• Strict Double-Booking Elimination: Complete exclusion of concurrent booking requests (per Specialist, per Date, per Hour Segment).",
        "• Automated Standby Reservoirs: Instant, transactional notification of standby patient lists when active appointments are cancelled.",
        "• Responsive Queue Schedulers: Active clinical progress map displaying stages from booking to treatment closure.",
        "• Direct Evaluation Aids: In-place account quick-swapping widgets ensuring zero-configuration inspection workflows."
      ];

      mandates.forEach(m => {
        const splitM = doc.splitTextToSize(m, 170);
        doc.text(splitM, 20, currentY);
        currentY += (splitM.length * 5);
      });

      drawFooterHelper();

      // ==========================================
      // PAGE 2: ARCHITECTURE & PORTAL FLOW
      // ==========================================
      doc.addPage();
      pageNum++;
      currentY = 30;
      drawHeaderHelper("SYSTEM BLUEPRINT");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("2. Technical Architecture Blueprint", 20, currentY);
      currentY += 7;

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      const archIntro = "The CareSync software architecture represents a strict modular client-server structure. It ensures full sandboxing stability without relying on resource-intensive database agents. Instead, transactional filesystem structures handle high-availability mocks beautifully.";
      const splitIntro = doc.splitTextToSize(archIntro, 170);
      doc.text(splitIntro, 20, currentY);
      currentY += (splitIntro.length * 5) + 3;

      // Tech Stack Breakdown Table-styled Blocks
      const stack = [
        { layer: "Presentation Frame:", desc: "Single-Page Application (SPA) compiled through React 19, TSX, and Tailwind CSS." },
        { layer: "Gateway Service:", desc: "Express.js REST APIs with JWT custom sign/verification handlers running on Cloud Run." },
        { layer: "Database Storage:", desc: "State-isolated transactional JSON engine (/db-data/clinic_db.json) with auto disk writes." },
        { layer: "Operational Assets:", desc: "Unsplash API for clinician vector mock-shots, Lucide React for pixel-perfect icons." }
      ];

      stack.forEach(s => {
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(s.layer, 20, currentY);
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        const splitD = doc.splitTextToSize(s.desc, 125);
        doc.text(splitD, 65, currentY);
        currentY += Math.max(5, splitD.length * 4.5) + 2;
      });

      currentY += 4;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("2.1 Transaction Isolation & Write-Through Safety", 20, currentY);
      currentY += 6;

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9.5);
      const writeSafety = "To resolve data corruption or race conditions typical of concurrent appathons, CareSync features a single monolithic Store manager inside \"/src/db/store.ts\". When any scheduling transaction occurs: \n\n1. Lock check constraints evaluate parameters.\n2. State modifications complete inside server-side memory.\n3. The updated store object gets serialized and flushed atomically to disk using fs.writeFileSync() synchronously.\n4. Response signals transmit back to client portals with updated telemetry.";
      const splitSafety = doc.splitTextToSize(writeSafety, 170);
      doc.text(splitSafety, 20, currentY);
      currentY += (splitSafety.length * 4.5);

      drawFooterHelper();

      // ==========================================
      // PAGE 3: FEATURE MECHANICS
      // ==========================================
      doc.addPage();
      pageNum++;
      currentY = 30;
      drawHeaderHelper("CORE ALGORITHMS & LOGIC");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("3. Core Logic Schedulers & Guardrails", 20, currentY);
      currentY += 7;

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(59, 130, 246);
      doc.text("3.1 DOUBLE BOOKING ELIMINATION SCHEDULER", 20, currentY);
      currentY += 5;

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      const doubleBookingP = "Prior to allocating any slot, the Store engine runs a strict logical validation query: \n  • hasDoubleBook = store.getAppointments().some(\n      (a) => a.doctorId === doctorId && a.date === date && a.timeSlot === slot && a.status !== 'Cancelled'\n    );\nIf hasDoubleBook evaluates to true, the request is safely denied. Instead of displaying a blunt error message, the user is offered to be placed on a priority standby queue.";
      const splitDB = doc.splitTextToSize(doubleBookingP, 170);
      doc.text(splitDB, 20, currentY);
      currentY += (splitDB.length * 4.5) + 5;

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(59, 130, 246);
      doc.text("3.2 DAILY BOOKING CAPS & OVERLAPS PROTECTION", 20, currentY);
      currentY += 5;

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9.5);
      const limitsP = "CareSync protects specialists from clinical burn-out by applying maxDailyAppointments checks: \n  • currentDailyBookingsCount >= doctor.maxDailyAppointments\nAdditionally, to safeguard patients from self-conflicting consultation assignments, patientOverlap validation ensures a user cannot schedule two different specialist reviews inside the exact same hour block on any given day, preventing overlapping attendance constraints.";
      const splitLim = doc.splitTextToSize(limitsP, 170);
      doc.text(splitLim, 20, currentY);
      currentY += (splitLim.length * 4.5) + 5;

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(59, 130, 246);
      doc.text("3.3 DYNAMIC PRIORITY WAITLISTS & ALERT DISTRIBUTOR", 20, currentY);
      currentY += 5;

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9.5);
      const waitlistP = "When an appointment is cancelled, the scheduling manager instantly launches a search on the standby lists matching the exact doctor, date, and hour slot. \n  • Match index: waitlist.findIndex((item) => item.status === 'Active')\nIf found, the selected candidate's waitlist registration state advances dynamically of 'Notified', reserving the slot exclusively, and triggering an immediate live system notice so the patient can log in and finalize booking.";
      const splitWL = doc.splitTextToSize(waitlistP, 170);
      doc.text(splitWL, 20, currentY);
      currentY += (splitWL.length * 4.5);

      drawFooterHelper();

      // ==========================================
      // PAGE 4: API ENDPOINTS & SCHEMAS
      // ==========================================
      doc.addPage();
      pageNum++;
      currentY = 30;
      drawHeaderHelper("API & DATABASES REFERENCE");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("4. REST Api Handlers & Data Schemas", 20, currentY);
      currentY += 7;

      // Database structures
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text("4.1 System Database Entity Schema (TypeScript Models)", 20, currentY);
      currentY += 5;

      doc.setFont("courier", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59); // slate-800
      
      const schemaLines = [
        "interface Doctor {",
        "  id: string; name: string; specialization: string; experience: number;",
        "  consultationFee: number; availableDays: string[]; availableSlots: string[];",
        "  active: boolean; softDeleted: boolean; maxDailyAppointments: number;",
        "}",
        "",
        "interface Appointment {",
        "  id: string; doctorId: string; doctorName: string; patientId: string;",
        "  patientName: string; date: string; timeSlot: string;",
        "  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';",
        "  queueStatus: 'Booked' | 'Confirmed' | 'In Queue' | 'Completed';",
        "  tokenNumber: number; prescription?: string | null;",
        "}"
      ];

      schemaLines.forEach(ln => {
        doc.text(ln, 22, currentY);
        currentY += 4.2;
      });

      // API Endpoints list
      currentY += 4;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("4.2 Primary System HTTP Controllers", 20, currentY);
      currentY += 6;

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);

      const endpointsTable = [
        { method: "POST", route: "/api/auth/login", desc: "Verifies profile matching & returns HMAC sign token." },
        { method: "POST", route: "/api/auth/register", desc: "Creates patient profiles or administrative credentials." },
        { method: "GET", route: "/api/doctors", desc: "Lists all actively consulting specialists." },
        { method: "POST", route: "/api/appointments", desc: "Validates double booking, overlap, and registers appointments." },
        { method: "PATCH", route: "/api/appointments/:id/cancel", desc: "Cancels bookings and triggers automatic waitlist alerts." },
        { method: "PATCH", route: "/api/appointments/:id/complete", desc: "Admin logs clinical prescription advice. Closes queue." },
        { method: "GET", route: "/api/analytics", desc: "Administrative dashboard telemetry: busy slots, specialists load." }
      ];

      endpointsTable.forEach(ep => {
        doc.setFont("courier", "bold");
        doc.setTextColor(16, 185, 129); // green-500
        if (ep.method === "POST") doc.setTextColor(59, 130, 246);
        if (ep.method === "PATCH") doc.setTextColor(245, 158, 11);
        doc.text(ep.method, 20, currentY);
        
        doc.setFont("courier", "normal");
        doc.setTextColor(15, 23, 42);
        doc.text(ep.route, 42, currentY);

        doc.setFont("Helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        const splitEpDesc = doc.splitTextToSize(ep.desc, 80);
        doc.text(splitEpDesc, 110, currentY);
        
        currentY += Math.max(5, splitEpDesc.length * 4) + 1;
      });

      drawFooterHelper();

      // Save the generated document
      doc.save("CareSync_Operational_Documentation.pdf");
      addNotificationToast();
    } catch (err: any) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const addNotificationToast = () => {
    // Notify in some standard UI way
    alert("System Blueprint PDF document has been compiled and downloaded successfully!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 border border-slate-205 border-slate-200">
        
        {/* Modal Toolbar Title */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">System Blueprint & Developer Manual</h3>
              <p className="text-xs text-slate-400">Complete architectural breakdown, schema guide, and logic overview.</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-705 text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 mb-6 gap-2">
          <button
            onClick={() => setActiveTab("specs")}
            className={`pb-2.5 px-1.5 text-xs font-bold border-b-2 transition ${activeTab === "specs" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-800"}`}
          >
            <span className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5" />
              Platform Blueprint
            </span>
          </button>
          <button
            onClick={() => setActiveTab("logic")}
            className={`pb-2.5 px-1.5 text-xs font-bold border-b-2 transition ${activeTab === "logic" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-800"}`}
          >
            <span className="flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5" />
              Core Algorithms & Guardrails
            </span>
          </button>
          <button
            onClick={() => setActiveTab("endpoints")}
            className={`pb-2.5 px-1.5 text-xs font-bold border-b-2 transition ${activeTab === "endpoints" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-800"}`}
          >
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              Database Schemas & APIs
            </span>
          </button>

          {/* Download Action Trigger */}
          <button
            onClick={generatePDFVersion}
            disabled={downloading}
            className="ml-auto mb-2 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 text-xs font-bold transition-all shadow-md shadow-blue-100 disabled:opacity-50 cursor-pointer font-display"
          >
            <Download className={`w-3.5 h-3.5 ${downloading ? 'animate-bounce' : ''}`} />
            <span>{downloading ? "Compiling PDF..." : "Download Documentation PDF"}</span>
          </button>
        </div>

        {/* Dynamic Display */}
        <div className="space-y-6 text-sm text-slate-700 leading-relaxed max-h-[50vh] overflow-y-auto px-1">
          {activeTab === "specs" && (
            <div className="space-y-6">
              <div className="border-l-4 border-blue-500 bg-blue-50/50 p-4 rounded-r-xl">
                <span className="block font-bold text-slate-900 mb-1 font-display">Executive System Summary</span>
                <p className="text-xs text-slate-700">
                  CareSync is a smart clinic scheduling platform built for full multi-tier role coordination. 
                  It eliminates client-side scheduling conflicts, tracks active queues, handles specialist daily capacities, 
                  and notifies standbys instantly. 
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5 mb-2 font-display">
                    <Server className="w-4 h-4 text-slate-600" />
                    Technology Stack
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600 listing-square">
                    <li><strong>Frontend React Frame:</strong> React 19 SPA, Vite compilation, Tailwind CSS responsive classes.</li>
                    <li><strong>Backend Gateway:</strong> Express.js Node endpoints with native HTTP request processing.</li>
                    <li><strong>Session Cryptography:</strong> SHA-256 password hashes & custom JWT verified against server secrets.</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5 mb-2 font-display">
                    <Database className="w-4 h-4 text-slate-600" />
                    Isolated Persistent Storage
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600 listing-square">
                    <li><strong>Active Database File:</strong> Managed atomically inside <code>db-data/clinic_db.json</code>.</li>
                    <li><strong>Synchronous Flushes:</strong> Every state update commits synchronously using write-through file locks.</li>
                    <li><strong>Automatic Seeding:</strong> Bootstraps 4 default clinical specialists and test accounts on first launch.</li>
                  </ul>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                <h4 className="font-bold text-slate-900 font-display">Multi-Role Testing Context & Demos Swappers</h4>
                <p className="text-xs text-slate-605">
                  To assist administrators and evaluators examining the CareSync platform, we provided direct demo channels with bypass login triggers. 
                  A quick context-swapper button is integrated directly into the Header. Clicking it switches your authenticated role instantly (e.g. from Patient to Administrative) 
                  while preserving all scheduling logs so the evaluation stays completely fluid.
                </p>
              </div>
            </div>
          )}

          {activeTab === "logic" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 font-display flex items-center gap-1.5">
                  <Sparkles className="w-4.5 h-4.5 text-blue-500 animate-pulse" />
                  Double-Booking Elimination Engine
                </h4>
                <p className="text-xs text-slate-600">
                  CareSync guarantees that a doctor/date/time-slot coordinates uniquely to a single patient booking. 
                  When scheduling requests are submitted from patient boards, the store manager runs a query on existing entries:
                </p>
                <pre className="rounded-lg bg-slate-900 p-3.5 text-xs font-mono text-blue-400 overflow-x-auto">
{`const hasDoubleBook = this.getAppointments().some(
  a => a.doctorId === doctorId && 
       a.date === date && 
       a.timeSlot === timeSlot && 
       a.status !== "Cancelled"
);`}
                </pre>
                <p className="text-xs text-slate-500">
                  If <code>hasDoubleBook</code> returns true, the booking fails validation. 
                  Instead of dismissing the request, the platform offers the patient an automated standby option.
                </p>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-5">
                <h4 className="font-bold text-slate-900 font-display">Automated Waitlist Standby Reserve Alerts</h4>
                <p className="text-xs text-slate-600">
                  Late cancellations often result in unutilized specialist slots. CareSync automates standby allocations. 
                  When an administrator or patient cancels a confirmed consultation:
                </p>
                <pre className="rounded-lg bg-slate-900 p-3.5 text-xs font-mono text-blue-400 overflow-x-auto">
{`// Inside updateAppointmentStatus("Cancelled") trigger
const nextCandidateIdx = this.data.waitlist.findIndex(
  w => w.doctorId === currentApt.doctorId && 
       w.date === currentApt.date && 
       w.timeSlot === currentApt.timeSlot && 
       w.status === "Active"
);

if (nextCandidateIdx !== -1) {
  this.data.waitlist[nextCandidateIdx].status = "Notified";
  this.createNotification(candidateId, "EXCLUSIVE OPENING: The slot is now open!");
}`}
                </pre>
                <p className="text-xs text-slate-505 text-slate-600">
                  The first active patient on the matching standby list stands notified instantly, changing their queue block status to 'Notified' 
                  and dispatching live, highlighted clinical notices directly to their portal dashboard.
                </p>
              </div>
            </div>
          )}

          {activeTab === "endpoints" && (
            <div className="space-y-6">
              <h4 className="font-bold text-slate-900 font-display">Comprehensive REST HTTP Controller Reference</h4>
              
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div className="grid grid-cols-12 bg-slate-50 p-2.5 font-bold border-b border-slate-200">
                  <div className="col-span-2">Method</div>
                  <div className="col-span-4">API Route Route</div>
                  <div className="col-span-6">Handler Description</div>
                </div>
                
                <div className="divide-y divide-slate-100">
                  <div className="grid grid-cols-12 p-2.5 items-center">
                    <div className="col-span-2 font-mono text-blue-600 font-bold bg-blue-50 px-1 py-0.5 rounded w-max">POST</div>
                    <div className="col-span-4 font-mono text-slate-900 font-semibold">/api/auth/register</div>
                    <div className="col-span-6 text-slate-600">Registers new patient or admin secure files.</div>
                  </div>
                  <div className="grid grid-cols-12 p-2.5 items-center">
                    <div className="col-span-2 font-mono text-blue-600 font-bold bg-blue-50 px-1 py-0.5 rounded w-max">POST</div>
                    <div className="col-span-4 font-mono text-slate-900 font-semibold">/api/auth/login</div>
                    <div className="col-span-6 text-slate-600">Compares password SHA-256 hash against store list.</div>
                  </div>
                  <div className="grid grid-cols-12 p-2.5 items-center">
                    <div className="col-span-2 font-mono text-emerald-600 font-bold bg-emerald-50 px-1 py-0.5 rounded w-max">GET</div>
                    <div className="col-span-4 font-mono text-slate-900 font-semibold">/api/doctors</div>
                    <div className="col-span-6 text-slate-600">Lists specialists profiles, experience ratios, and hourly fees.</div>
                  </div>
                  <div className="grid grid-cols-12 p-2.5 items-center">
                    <div className="col-span-2 font-mono text-blue-600 font-bold bg-blue-50 px-1 py-0.5 rounded w-max">POST</div>
                    <div className="col-span-4 font-mono text-slate-900 font-semibold">/api/appointments</div>
                    <div className="col-span-6 text-slate-600">Schedules a new booking, checks capacity caps, overlapping patient checks, or adds to waitlist automatically.</div>
                  </div>
                  <div className="grid grid-cols-12 p-2.5 items-center">
                    <div className="col-span-2 font-mono text-amber-600 font-bold bg-amber-50 px-1 py-0.5 rounded w-max">PATCH</div>
                    <div className="col-span-4 font-mono text-slate-900 font-semibold">/api/appointments/:id/cancel</div>
                    <div className="col-span-6 text-slate-600">Cancels consultation. Triggers database lookup for matching standby patients.</div>
                  </div>
                  <div className="grid grid-cols-12 p-2.5 items-center">
                    <div className="col-span-2 font-mono text-purple-600 font-bold bg-purple-50 px-1 py-0.5 rounded w-max">GET</div>
                    <div className="col-span-4 font-mono text-slate-900 font-semibold">/api/analytics</div>
                    <div className="col-span-6 text-slate-600">Calculates statistics, busiest slots, and specialist booking loads.</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info segment */}
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer transition"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
}
