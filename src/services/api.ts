/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Helper to standardise Fetch API interactions 

let token: string | null = localStorage.getItem("care_sync_token");

export const apiService = {
  setToken(newToken: string | null) {
    token = newToken;
    if (newToken) {
      localStorage.setItem("care_sync_token", newToken);
    } else {
      localStorage.removeItem("care_sync_token");
    }
  },

  getToken() {
    return token;
  },

  async request(endpoint: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers || {});
    
    // Auto insert bearer tokens
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    
    // Auto JSON content type
    if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(endpoint, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Auto logout on authentication expirations
      if (response.status === 401 || response.status === 403) {
        if (token) {
          this.setToken(null);
          window.dispatchEvent(new Event("auth-expired"));
        }
      }
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  },

  // Auth Operations
  async register(body: any) {
    const data = await this.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body)
    });
    if (data.token) this.setToken(data.token);
    return data;
  },

  async login(body: any) {
    const data = await this.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body)
    });
    if (data.token) this.setToken(data.token);
    return data;
  },

  async getMe() {
    return this.request("/api/auth/me");
  },

  // Doctor Operations
  async getDoctors() {
    return this.request("/api/doctors");
  },

  async createDoctor(body: any) {
    return this.request("/api/doctors", {
      method: "POST",
      body: JSON.stringify(body)
    });
  },

  async updateDoctor(id: string, body: any) {
    return this.request(`/api/doctors/${id}`, {
      method: "PUT",
      body: JSON.stringify(body)
    });
  },

  async toggleDoctorStatus(id: string, active: boolean) {
    return this.request(`/api/doctors/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ active })
    });
  },

  async deleteDoctor(id: string) {
    return this.request(`/api/doctors/${id}`, {
      method: "DELETE"
    });
  },

  // Appointment Operations
  async getAppointments() {
    return this.request("/api/appointments");
  },

  async bookAppointment(body: { doctorId: string; date: string; timeSlot: string }) {
    return this.request("/api/appointments", {
      method: "POST",
      body: JSON.stringify(body)
    });
  },

  async cancelAppointment(id: string) {
    return this.request(`/api/appointments/${id}/cancel`, {
      method: "PATCH"
    });
  },

  async confirmAppointment(id: string) {
    return this.request(`/api/appointments/${id}/confirm`, {
      method: "PATCH"
    });
  },

  async completeAppointment(id: string, treatment: { prescription?: string; queueStatus?: string }) {
    return this.request(`/api/appointments/${id}/complete`, {
      method: "PATCH",
      body: JSON.stringify(treatment)
    });
  },

  async rescheduleAppointment(id: string, body: { date: string; timeSlot: string }) {
    return this.request(`/api/appointments/${id}/reschedule`, {
      method: "PATCH",
      body: JSON.stringify(body)
    });
  },

  // Waitlist Operations
  async getWaitlist() {
    return this.request("/api/waitlist");
  },

  async joinWaitlist(body: { doctorId: string; date: string; timeSlot: string }) {
    return this.request("/api/waitlist", {
      method: "POST",
      body: JSON.stringify(body)
    });
  },

  // Notifications Operations
  async getNotifications() {
    return this.request("/api/notifications");
  },

  async markNotificationsRead() {
    return this.request("/api/notifications/read", {
      method: "POST"
    });
  },

  // Analytics Operations
  async getAnalytics() {
    return this.request("/api/analytics");
  }
};
