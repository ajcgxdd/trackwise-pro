# Trackwise Pro - MongoDB Integration Learning Project

Trackwise Pro is a real-time logistics and fleet operational dashboard, originally built with mock in-memory data. **This project was specifically designed as a learning exercise to successfully integrate a MongoDB database into a fully working, complex frontend website.** 

The goal was to migrate the application's data layer from local JSON arrays to a robust **Express.js** + **MongoDB** REST API backend without breaking the existing UI, enabling persistent tracking of shipments, carriers, geofences, and audit logs.

This project is built with **React**, **Vite**, **Tailwind CSS**, and **Tanstack Router** for the frontend, and an **Express.js** + **MongoDB** backend API.

## Project Structure

- **`/` (Root)** - The frontend React/Vite application.
- **`/backend`** - The Express.js backend server and MongoDB Mongoose models.

## Pre-requisites
- Node.js (v18 or higher recommended)
- A MongoDB cluster (e.g., [MongoDB Atlas Free Tier](https://www.mongodb.com/cloud/atlas/register))

---

## 🛠️ Setup Instructions

### 1. Database Configuration
1. Navigate to the `backend` folder and create a copy of the example environment file:
   ```bash
   cd backend
   cp .env.example .env
   ```
2. Open `backend/.env` and replace the `MONGO_URI` placeholder with your actual MongoDB connection string.
   ```env
   # backend/.env 
   MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/trackwise?retryWrites=true&w=majority
   PORT=4000
   ```

*(Note: The `.env` files are ignored by Git so your database credentials remain safe).*

### 2. Backend Setup
In a new terminal window, install backend dependencies and start the server:
```bash
cd backend
npm install
npm run dev
```
*The backend should report "Connected to MongoDB" and run on `http://localhost:4000`.*

### 3. Frontend Setup
In a separate terminal window at the **root** of the project, install dependencies and start the Vite development server:
```bash
npm install
npm run dev
```
*The frontend will run on `http://localhost:5173`.*

### 4. Seeding the Database
Since your MongoDB database starts empty:
1. Open the frontend in your browser, on the MongoDB website.
2. Click the **SEED DATABASE** button located at the top-right of the Operations Dashboard.
3. This pushes the mock JSON data directly into your newly connected MongoDB collections (`shipments`, `carriers`, `geofences`).

---

## 🚀 Key Features

*   **Live Dashboard:** Real-time tracking of packages and transit progress.
*   **Geofence View:** Native map plotting of warehouses and hubs using Leaflet.
*   **Audit Logging:** Chronological auditing of every state change stored seamlessly on the MongoDB backend. 
*   **Carrier SLA Tracking:** View on-time delivery percentages and delay averages per carrier.

## Technologies Used
- Frontend: React 19, Vite, Tailwind CSS, Tanstack Router, React-Query, Lucide-React, Recharts, Leaflet.
- Backend: Node.js, Express.js, MongoDB, Mongoose, Cors.
