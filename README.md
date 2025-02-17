# stt_app_dev
=======
# Deployment Guide for Audio Transcriber & Content Generator App

This document provides complete instructions for deploying the Audio Transcriber & Content Generator App (both backend and frontend) on a remote server. Follow the steps below to set up your environment, configure your application, and launch the services.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
   - [Backend Environment Variables](#backend-environment-variables)
   - [Frontend Environment Variables](#frontend-environment-variables)
3. [Installation and Setup](#installation-and-setup)
   - [Backend Setup](#backend-setup)
   - [Frontend Setup](#frontend-setup)
4. [Database Setup and Migration](#database-setup-and-migration)
5. [Running the Application](#running-the-application)
   - [Running the Backend](#running-the-backend)
   - [Running the Frontend](#running-the-frontend)
6. [Reverse Proxy and Production Considerations](#reverse-proxy-and-production-considerations)
7. [Security and Monitoring](#security-and-monitoring)
8. [Clearing Job Queue on Logout/Session End](#clearing-job-queue-on-logoutsession-end)
9. [Troubleshooting Common Issues](#troubleshooting-common-issues)

---

## Prerequisites

- **Server:** A remote Linux server (e.g., Ubuntu 20.04+)
- **Python:** Version 3.8 or later
- **Node.js:** Latest LTS version
- **PostgreSQL:** Version 12+
- **Git:** Installed on the server
- **Virtual Environment:** (e.g., `venv` or `virtualenv`)
- **Uvicorn and Gunicorn:** For serving the FastAPI application (optional but recommended)
- **Nginx:** (optional) For reverse proxying both backend and frontend

---

## Environment Setup

### Backend Environment Variables

Create a `.env` file in the root of your **backend** project with the following content:

```env
OPENAI_API_KEY=your_openai_api_key
APP_HOST=0.0.0.0
APP_PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/your_database_name
```

Adjust the values as necessary.

### Frontend Environment Variables

In the frontend (Next.js) project, create a `.env.local` file with the following content:

```env
NEXT_PUBLIC_API_BASE_URL=http://your_server_ip:3000
```

Replace `your_server_ip` with the actual IP or domain of your server.

---

## Installation and Setup

### Backend Setup

1. Clone the Repository:

   ```bash
   git clone https://github.com/yourusername/your-repo.git
   cd your-repo/backend
   ```

2. Create and Activate a Virtual Environment:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install Python Dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Set Up the Database:

   - Ensure PostgreSQL is running.
   - Create a new database for the project.
   - Update the `DATABASE_URL` variable in your `.env` file accordingly.

5. Run Database Migrations with Alembic:
   ```bash
   alembic upgrade head
   ```

### Frontend Setup

1. Navigate to the Frontend Directory:

   ```bash
   cd your-repo/frontend
   ```

2. Install Node.js Dependencies:

   ```bash
   npm install
   ```

3. Set Up Frontend Environment Variables:
   - Create a `.env.local` file as described in the Frontend Environment Variables section.

---

## Running the Application

### Running the Backend

- **Development Mode:**

  ```bash
  uvicorn backend.main:app --host 0.0.0.0 --port 3000 --reload
  ```

- **Production Mode (Using Gunicorn):**
  ```bash
  gunicorn backend.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:3000
  ```

### Running the Frontend

- **Development Mode:**
  From the frontend directory, run:

  ```bash
  npm run dev
  ```

- **Production Mode:**
  ```bash
  npm run build
  npm start
  ```

---

## Reverse Proxy and Production Considerations

For a robust production deployment, consider using Nginx as a reverse proxy for both the backend and frontend. This provides benefits such as:

- **SSL Termination:** Secure your application with HTTPS.
- **Load Balancing:** Distribute incoming traffic across multiple backend instances.
- **Improved Security:** Filter and block malicious requests.

### Example Nginx Configuration

```nginx
server {
    listen 80;
    server_name your_domain.com;

    location / {
        proxy_pass http://127.0.0.1:3001; # Frontend (Next.js) server
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000; # Backend (FastAPI) server
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Adjust the ports and domain as necessary.

---

## Security and Monitoring

- **Environment Variables:** Keep your `.env` and `.env.local` files secure.
- **HTTPS:** Use SSL certificates (e.g., via Let’s Encrypt) for secure communication.
- **Logging:** Configure logging for both backend and frontend applications.
- **Monitoring:** Consider using tools like Prometheus, Grafana, or external services for application monitoring.

---

## Clearing Job Queue on Logout/Session End

The job queue is stored in `localStorage` and in-memory. To ensure that a new session starts with a fresh job queue, the following mechanism is implemented in `useJobs.js`:

- On mount, the job queue in `localStorage` is cleared.
- A polling effect checks for the presence of the authentication token. If the token is missing (indicating logout or session expiry), the job queue is cleared.

This ensures that when a user logs out or their session ends, previous tasks do not persist.

---

## Troubleshooting Common Issues

- **404 Errors on API Requests:**

  - Verify that the backend is running on the correct host and port.
  - Check the `NEXT_PUBLIC_API_BASE_URL` variable in your frontend `.env.local` file.

- **Database Connection Issues:**

  - Ensure that PostgreSQL is running and accessible.
  - Verify that `DATABASE_URL` in your `.env` file is correctly configured.

- **Job Queue Not Clearing:**

  - Confirm that the `useJobs.js` hook is properly checking for the authentication token and clearing `localStorage`.
  - Check browser console logs for any errors related to job management.

- **File Upload Issues:**
  - Ensure that the allowed file types (e.g., .mp3, .mp4, .wav, .webm) are adhered to.
  - Verify file size limits and adjust if necessary.

---

## Summary

This guide provides detailed steps to deploy the Audio Transcriber & Content Generator App on a remote server. By following these instructions, you can set up your environment, run both the backend and frontend applications, and ensure a secure and scalable deployment.

For further assistance, refer to your application logs and adjust configurations as needed.
>>>>>>> 5df0ea7 (Initial commit with .gitignore setup)
