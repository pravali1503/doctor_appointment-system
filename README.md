# CareSync - Smart Clinic Management & Priority Queue Scheduler

A modern, highly responsive real-time clinic scheduling system designed to eliminate double-bookings, automate standby waitlists, and streamline consultation timelines.

---

## 🛠️ Technology Stack

The application has been successfully implemented using the following specific technologies:

### **Frontend**
*   **React.js** (Mandatory)
*   **Tailwind CSS** (for precise utility-based responsive layout & styling)
*   **Lucide React** (icons library)
*   **Motion** (for modern, lightweight transitions & interface animations)

### **Backend**
*   **Node.js (Express.js)**
*   Provides fully structured REST APIs with authentication, priority waitlist sorting, and patient dashboards.
*   Authenticates users with standard SHA-256 hashed password configurations and native cryptographic HMAC-signed JWT tokens.

### **Database**
*   **PostgreSQL**
*   Robust schema migrations executed automatically at startup.
*   *Note: Includes a local JSON-file Database Fallback Engine (re-routed dynamically if PostgreSQL configurations are not supplied or unreachable) to guarantee seamless offline-first operations.*

---

## 🚀 Key Features

1.  **Dynamic Scheduling Shield**: Prevents double-bookings and prevents overlapping patient schedules in real-time.
2.  **Automated Standby Waitlist**: If a doctor's consultation time slot gets fully booked, subsequent requests automatically fall back to an active Standby Waitlist. If a booked patient cancels, the system automatically tags the next standby patient with an *EXCLUSIVE OPENING* notification.
3.  **Live Queue Consultations**: Real-time status changes for patients (*Booked* ➡️ *In Queue* ➡️ *Completed* ➡️ *Cancelled*).
4.  **Doctor Management Control**: Interactive dashboards for Admins to add specialists, define daily booking caps, set consultation fee rates, and specify buffer times.
5.  **Secure Multi-Role Access**: Dedicated views and dashboard features tailored dynamically for system **Administrators**, clinic **Doctors**, and **Patients**.

---

## ⚙️ Configuration & Database Setup

The backend connects to PostgreSQL using standard credentials and environmental configurations.

### **1. Configure Environment Variables**
Copy or rename `.env.example` to `.env` and fill in your connection details:

```env
# Server Configuration
NODE_ENV=production
APP_URL=http://localhost:3000

# PostgreSQL Connection Configuration
# (You can configure either via DATABASE_URL or using individual params)
DATABASE_URL=postgresql://username:password@localhost:5432/caresync_db

# Or individual parameters:
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_secure_password
PGDATABASE=caresync_db
```

### **2. Development Mode**
To compile the TypeScript server dynamically and boot both front & backend processes:
```bash
npm run dev
```

### **3. Production Build and Start**
Compile and bundle React files and Node server code:
```bash
npm run build
npm run start
```
This bundles the backend into optimized CommonJS (`dist/server.cjs`) using `esbuild` for maximum container performance.
