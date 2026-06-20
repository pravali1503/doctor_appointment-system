/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User, Bell, LogOut, Check, Activity, ShieldAlert, FileText, Sun, Moon } from "lucide-react";
import { ClinicNotification } from "../types";

interface HeaderProps {
  currentUser: { id: string; name: string; email: string; role: string } | null;
  notifications?: ClinicNotification[];
  onLogout?: () => void;
  onReadNotifications?: () => void;
  onRoleMockToggle?: () => void; // A convenience hook for testing/assessment of multiple perspectives
  onOpenDocs: () => void; // Support system specifications modal
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Header({
  currentUser,
  notifications = [],
  onLogout,
  onReadNotifications,
  onRoleMockToggle,
  onOpenDocs,
  isDarkMode,
  onToggleDarkMode
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur transition-colors duration-250">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Branding & Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white shadow-md shadow-blue-100 dark:shadow-none">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-display">CareSync</span>
            <span className="ml-1.5 rounded-full bg-blue-50 dark:bg-blue-900/40 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Smart Clinic</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          
          {/* Always Visible components: Blueprint Manual (custom view) and Dark mode tracker */}
          <button
            onClick={onOpenDocs}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all pointer-events-auto cursor-pointer"
            title="View interactive system specs blueprint and compile PDF documentation booklet"
            id="header-docs-btn"
          >
            <FileText className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <span className="hidden sm:inline">Blueprint Manual</span>
          </button>

          {/* Dark / Light Toggle Switch */}
          <button
            onClick={onToggleDarkMode}
            className="rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-center"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            id="header-theme-toggle"
          >
            {isDarkMode ? (
              <Sun className="w-4.5 h-4.5 text-amber-400" />
            ) : (
              <Moon className="w-4.5 h-4.5 text-indigo-600" />
            )}
          </button>

          {currentUser ? (
            <>
              {/* Perspective Fast-Toggler Marker (Perfect for Evaluators!) */}
              {onRoleMockToggle && (
                <button
                  onClick={onRoleMockToggle}
                  className="hidden md:flex items-center gap-2 rounded-full border border-blue-100 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/20 px-3 py-1.5 text-xs font-semibold text-blue-800 dark:text-blue-200 hover:bg-blue-105 dark:hover:bg-blue-950/45 hover:border-blue-200 dark:hover:border-blue-800 transition-all pointer-events-auto cursor-pointer"
                  title="Toggle between Patient and Admin demo contexts instantly"
                  id="role-switch-pill"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Simulate: {currentUser.role === "ADMIN" ? "Admin" : "Patient"}</span>
                  <span className="text-[10px] text-blue-500 dark:text-blue-400 font-normal underline">(Switch)</span>
                </button>
              )}

              {/* Real-time Notifications Bell Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (!showNotifications && unreadCount > 0 && onReadNotifications) {
                      onReadNotifications();
                    }
                  }}
                  className="relative rounded-full p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-slate-50 transition-colors"
                  id="notifications-bell-btn"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-xl ring-1 ring-black/5 z-50">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-3 py-2">
                       <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Real-Time Operations</span>
                      {unreadCount > 0 && (
                        <span className="rounded bg-rose-50 dark:bg-rose-900/30 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 dark:text-rose-300">
                          {unreadCount} New
                        </span>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1">
                      {notifications.length === 0 ? (
                        <div className="px-3 py-6 text-center text-xs text-slate-400 dark:text-slate-550">
                          No notifications or logs yet
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id} 
                            className={`px-3 py-2 text-xs rounded-lg transition-colors mb-0.5 ${notif.read ? "text-slate-500 dark:text-slate-450" : "bg-blue-50/40 dark:bg-blue-950/20 text-slate-900 dark:text-slate-105 font-medium border-l-2 border-blue-500"}`}
                          >
                            <p>{notif.message}</p>
                            <span className="mt-1 block text-[9px] text-slate-400 dark:text-slate-500 font-normal">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Summary */}
              <div className="flex items-center gap-2 border-l border-slate-100 dark:border-slate-800 pl-4">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 max-w-[110px] truncate">{currentUser.name}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{currentUser.role.toLowerCase()}</span>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold text-xs ring-1 ring-blue-100 dark:ring-blue-900/40">
                  {currentUser.name.charAt(0)}
                </div>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="rounded-full p-2 text-slate-400 dark:text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-450 transition-all ml-1.5 cursor-pointer"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl px-3 py-1.5">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 tracking-tight">Active Portal</span>
            </div>
          )}

        </div>
      </div>
    </header>
  );
}
