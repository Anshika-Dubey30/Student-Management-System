# Student Management System - Full-Stack App

Welcome to the **Student Management System**! This is a comprehensive, enterprise-grade web application designed to manage student records, track academic performance, and handle profile images securely.

## Tech Stack Used
* **Frontend:** Angular, HTML, CSS, Bootstrap
* **Backend:** Node.js, Express.js
* **Database:** MariaDB / MySQL
* **File Handling:** Multer (for secure profile image uploads)

## Key Features Built
* **CRUD Operations:** Seamlessly Add, View, Edit, and Delete student records.
* **Smart Age Calculation:** Real-time, accurate age calculation based on Date of Birth.
* **Image Uploads:** Handled via backend `Multer` middleware with strict file validation.
* **Academic Reports:** Specialized modules to add marks (DBMS, Java, Python) and automatically generate percentage/pass-fail reports using SQL `INNER JOIN`.
* **Data Security:** Implemented `.env` to keep database credentials hidden and secure.

## How to Run Locally

### 1. Backend Setup
* Navigate to the `backend` folder and run `npm install`.
* Create a `.env` file and add your database password: `DB_PASSWORD=your_password`
* Run `node server.js` to start the backend server (Runs on Port 4000).

### 2. Frontend Setup
* Navigate to the `frontend` folder and run `npm install`.
* Run `ng serve` to launch the Angular application.
* Open your browser and go to `http://localhost:4200`.

---
Developed by Anshika Dubey
