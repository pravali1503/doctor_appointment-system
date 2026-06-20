/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Star, GraduationCap, DollarSign, Calendar, Clock, Sparkles } from "lucide-react";
import { Doctor } from "../types";

interface DoctorCardProps {
  key?: any;
  doctor: Doctor;
  onBookSelected: (doc: Doctor) => void;
  isAdmin: boolean;
  onStatusToggle?: (id: string, current: boolean) => void;
  onEditSelected?: (doc: Doctor) => void;
  onDeleteSelected?: (id: string) => void;
}

export default function DoctorCard({
  doctor,
  onBookSelected,
  isAdmin,
  onStatusToggle,
  onEditSelected,
  onDeleteSelected
}: DoctorCardProps) {
  return (
    <div className={`relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${doctor.active ? "border-slate-200" : "border-rose-100 bg-rose-50/10"}`}>
      
      {/* Top Details */}
      <div className="flex gap-4">
        
        {/* Profile Picture */}
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-50 border border-slate-200">
          <img 
            src={doctor.photoUrl} 
            alt={doctor.name} 
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
          {doctor.experience >= 10 && (
            <div className="absolute bottom-0 right-0 left-0 bg-yellow-500 text-[8px] text-white text-center font-bold py-0.5 shadow-xs flex items-center justify-center gap-0.5">
              <Sparkles className="w-2 h-2 shrink-0" />
              <span>EXPERT</span>
            </div>
          )}
        </div>

        {/* Credentials */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900 truncate font-display">{doctor.name}</h4>
            <span className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium tracking-wide ${doctor.active ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"}`}>
              {doctor.active ? "Active Now" : "Inactive"}
            </span>
          </div>
          
          <p className="text-xs font-bold text-blue-600">{doctor.specialization}</p>
          
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{doctor.qualification}</span>
          </div>
        </div>

      </div>

      {/* Info Stats Row */}
      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50/60 p-3 text-center border border-slate-100">
        <div>
          <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Experience</span>
          <span className="text-xs font-bold text-slate-800">{doctor.experience} Years</span>
        </div>
        <div>
          <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Consult Fee</span>
          <span className="text-xs font-bold text-slate-800">${doctor.consultationFee}</span>
        </div>
        <div>
          <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Buffer time</span>
          <span className="text-xs font-bold text-slate-800">{doctor.bufferTime} Min</span>
        </div>
      </div>

      {/* Days & Hours summary */}
      <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-dashed border-slate-200 pt-3 flex-1">
        <div className="flex items-start gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-800">Days: </span>
            <span className="text-slate-500">{doctor.availableDays.join(", ")}</span>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-800">Slots Available: </span>
            <p className="text-[10px] font-mono text-blue-600 mt-1 max-h-12 overflow-y-auto">
              {doctor.availableSlots.join(" | ")}
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons (Changes according to Auth Roles) */}
      <div className="mt-5 border-t border-slate-100 pt-3">
        {isAdmin ? (
          <div className="flex items-center gap-1.5 justify-between">
            {onStatusToggle && (
              <button
                onClick={() => onStatusToggle(doctor.id, doctor.active)}
                className={`rounded px-2.5 py-1 text-[11px] font-bold border cursor-pointer transition-colors ${doctor.active ? "bg-white border-yellow-200 text-yellow-700 hover:bg-yellow-50" : "bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600"}`}
              >
                {doctor.active ? "Deactivate" : "Activate"}
              </button>
            )}

            <div className="flex gap-1">
              {onEditSelected && (
                <button
                  onClick={() => onEditSelected(doctor)}
                  className="rounded px-2.5 py-1 text-[11px] font-bold border bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Edit
                </button>
              )}
              {onDeleteSelected && (
                <button
                  onClick={() => onDeleteSelected(doctor.id)}
                  className="rounded px-2.5 py-1 text-[11px] font-bold border bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 cursor-pointer"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={() => onBookSelected(doctor)}
            disabled={!doctor.active}
            className={`w-full rounded-xl py-2 text-center text-xs font-bold transition shadow-xs cursor-pointer ${doctor.active ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
          >
            {doctor.active ? "Schedule Consultation" : "Doctor Currently Leave / Away"}
          </button>
        )}
      </div>

    </div>
  );
}
