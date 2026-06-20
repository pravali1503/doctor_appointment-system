/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { X, Save, Clock, Check } from "lucide-react";
import { Doctor } from "../types";

interface DoctorRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (docData: Omit<Doctor, "id" | "active" | "softDeleted"> & { id?: string }) => void;
  doctorToEdit?: Doctor | null;
}

const WEEDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIMEPICKERS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30"
];

// Presets of beautiful medical headshot photos to choose from
const PHOTO_PRESETS = [
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300",
  "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300",
  "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300",
  "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300",
  "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300",
  "https://images.unsplash.com/photo-1623854767648-e7bb8c69445d?auto=format&fit=crop&q=80&w=300"
];

export default function DoctorRegisterModal({
  isOpen,
  onClose,
  onSave,
  doctorToEdit
}: DoctorRegisterModalProps) {
  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("General Medicine");
  const [experience, setExperience] = useState(5);
  const [qualification, setQualification] = useState("");
  const [consultationFee, setConsultationFee] = useState(100);
  const [availableDays, setAvailableDays] = useState<string[]>(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
  const [availableSlots, setAvailableSlots] = useState<string[]>(["09:00", "10:00", "11:00", "14:00", "15:00"]);
  const [bufferTime, setBufferTime] = useState(5);
  const [maxDailyAppointments, setMaxDailyAppointments] = useState(8);
  const [photoUrl, setPhotoUrl] = useState(PHOTO_PRESETS[0]);

  // Load defaults or edit fields
  useEffect(() => {
    if (doctorToEdit) {
      setName(doctorToEdit.name);
      setSpecialization(doctorToEdit.specialization);
      setExperience(doctorToEdit.experience);
      setQualification(doctorToEdit.qualification);
      setConsultationFee(doctorToEdit.consultationFee);
      setAvailableDays(doctorToEdit.availableDays);
      setAvailableSlots(doctorToEdit.availableSlots);
      setBufferTime(doctorToEdit.bufferTime);
      setMaxDailyAppointments(doctorToEdit.maxDailyAppointments);
      setPhotoUrl(doctorToEdit.photoUrl);
    } else {
      // Clear for registration
      setName("");
      setSpecialization("General Medicine");
      setExperience(5);
      setQualification("");
      setConsultationFee(100);
      setAvailableDays(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
      setAvailableSlots(["09:00", "10:00", "11:00", "14:00", "15:00"]);
      setBufferTime(5);
      setMaxDailyAppointments(8);
      setPhotoUrl(PHOTO_PRESETS[Math.floor(Math.random() * PHOTO_PRESETS.length)]);
    }
  }, [doctorToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleDay = (day: string) => {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleSlot = (slot: string) => {
    setAvailableSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot].sort()
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !qualification.trim()) {
      return;
    }
    if (availableDays.length === 0) {
      alert("Please select at least one available consult day.");
      return;
    }
    if (availableSlots.length === 0) {
      alert("Please select at least one available timing slot.");
      return;
    }

    onSave({
      id: doctorToEdit?.id,
      name: name.trim(),
      specialization,
      experience: Number(experience),
      qualification: qualification.trim(),
      consultationFee: Number(consultationFee),
      availableDays,
      availableSlots,
      bufferTime: Number(bufferTime),
      maxDailyAppointments: Number(maxDailyAppointments),
      photoUrl
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 border border-slate-150">
        
        {/* Header Column */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-display">
              {doctorToEdit ? "Update Doctor Profile" : "Register a New Doctor Profile"}
            </h3>
            <p className="text-xs text-slate-500">Configure schedule slots, buffer fees, and maximum counts.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-705 text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Form content */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Doctor Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Arthur Pendragon"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-slate-800"
              />
            </div>

            {/* Speciality Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Specialization *</label>
              <select
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-slate-800"
              >
                <option value="General Medicine">General Medicine</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Neurology">Neurology</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Orthopedics">Orthopedics</option>
              </select>
            </div>

            {/* Qualifications */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Qualifications *</label>
              <input
                type="text"
                required
                placeholder="e.g. MD, MBBS, FACC (Harvard)"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-slate-800"
              />
            </div>

            {/* Consultation Fee */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Consultation Fee ($ USD) *</label>
              <input
                type="number"
                required
                min="10"
                max="1000"
                value={consultationFee}
                onChange={(e) => setConsultationFee(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-slate-800"
              />
            </div>

            {/* Medical Experience */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Experience (Years) *</label>
              <input
                type="number"
                required
                min="0"
                max="60"
                value={experience}
                onChange={(e) => setExperience(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-slate-800"
              />
            </div>

            {/* Maximum daily limit */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max Daily Appointments *</label>
              <input
                type="number"
                required
                min="1"
                max="50"
                value={maxDailyAppointments}
                onChange={(e) => setMaxDailyAppointments(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-slate-800"
              />
            </div>

            {/* Buffer time */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Slot Buffer Intervals (Minutes)</label>
              <select
                value={bufferTime}
                onChange={(e) => setBufferTime(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-slate-800"
              >
                <option value="0">0 Minutes</option>
                <option value="5">5 Minutes</option>
                <option value="10">10 Minutes</option>
                <option value="15">15 Minutes</option>
                <option value="20">20 Minutes</option>
              </select>
            </div>

            {/* Photo preset picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Professional Avatar Presets</label>
              <div className="flex gap-2 items-center overflow-x-auto py-1">
                {PHOTO_PRESETS.map((preset, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setPhotoUrl(preset)}
                    className={`relative w-10 h-10 rounded-full overflow-hidden shrink-0 ring-offset-2 transition-all cursor-pointer ${photoUrl === preset ? "ring-2 ring-blue-500" : "opacity-60 hover:opacity-100"}`}
                  >
                    <img src={preset} alt="Headshot" className="w-full h-full object-cover" />
                    {photoUrl === preset && (
                      <div className="absolute inset-0 bg-blue-500/30 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white font-bold" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Consultation Days selection (Checkboxes) */}
          <div className="border-t border-slate-100 pt-3">
            <label className="block text-xs font-bold text-slate-800 mb-2">Configure Consultation Days</label>
            <div className="flex flex-wrap gap-2">
              {WEEDAYS.map((day) => {
                const isSelected = availableDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium border cursor-pointer transition-colors ${isSelected ? "bg-blue-500 border-blue-500 text-white shadow-sm font-semibold" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Consultation Slots selection (Grid check) */}
          <div className="border-t border-slate-100 pt-3">
            <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1 font-display">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Select Available Consulting Slots
            </label>
            <p className="text-[10px] text-slate-400 mb-2">Patients will only see these options when scheduling bookings.</p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-36 overflow-y-auto p-1.5 border border-slate-200 rounded-lg bg-slate-50/50">
              {TIMEPICKERS.map((slot) => {
                const isSelected = availableSlots.includes(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => toggleSlot(slot)}
                    className={`rounded-md p-1.5 text-center text-xs font-mono border cursor-pointer transition-all ${isSelected ? "bg-blue-600 border-blue-600 text-white font-semibold" : "bg-white border-slate-200 text-slate-500 hover:bg-blue-50"}`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-md transition cursor-pointer font-display"
            >
              <Save className="w-4 h-4" />
              <span>{doctorToEdit ? "Save Updates" : "Create Profile"}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
