# Portfolio

A modern full-stack developer portfolio built with **React 19**, **Vite 8**, and an **Express** backend.

## Overview

This repository includes:

- `frontend/` — React application with portfolio pages, contact form, admin panel, and chatbot widget
- `backend/` — Express API server for contact submissions and admin tools
- `frontend/src/data.js` — central portfolio data source for profile, projects, skills, and education

## Tech Stack

- React 19
- Vite 8
- Express 4
- ES Modules (`type: module`)
- CSS styles in `frontend/src/styles.css`

## Project Structure

```
frontend/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── App.jsx
│   ├── data.js
│   ├── index.css
│   ├── main.jsx
│   ├── styles.css
│   └── components/
│       ├── About.jsx
│       ├── AdminPanel.jsx
│       ├── ChatbotWidget.jsx
│       ├── Contact.jsx
│       ├── Education.jsx
│       ├── ErrorBoundary.jsx
│       ├── Footer.jsx
│       ├── Header.jsx
│       ├── Hero.jsx
│       ├── Projects.jsx
│       └── Skills.jsx
├── index.html
├── package.json
├── package-lock.json
└── vite.config.js
backend/
├── server.js
├── package.json
└── package-lock.json
```

## Getting Started

Install dependencies and run the frontend and backend separately.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm start
```

Then open the portfolio at:

```text
http://localhost:5173
```

## Production Build

Build the frontend and then run the backend server.

```bash
cd frontend
npm run build
```

Then start the backend:

```bash
cd backend
npm start
```

The backend listens on port `5000` by default.

## API Endpoints

The backend exposes the following API routes:

- `POST /api/contact` — submit a contact message
- `POST /api/admin/auth` — verify admin credentials
- `POST /api/admin/change-password` — update admin password
- `GET /api/admin/messages` — list saved contact messages
- `DELETE /api/admin/messages/:id` — remove a saved message

## Configuration

Create a `.env` file in `backend/` to override defaults.

Supported variables:

- `PORT` — backend server port (default: `5000`)
- `ADMIN_PASSWORD` — admin password in .env file
- `GEMINI_API_KEY` — optional AI/chat integration key (commented in `server.js`)

## Customize Content

Update `frontend/src/data.js` to change displayed portfolio content.

- `profile` — name, title, bio, contact links, location
- `projects` — project cards, descriptions, links, tags
- `skills` — skill categories and proficiency values
- `education` — timeline entries and credentials

## Notes for Developers

- Frontend is built with Vite and React 19.
- Backend uses Express and is configured for CORS from the frontend origin.
- The contact form data is stored in memory while the server is running.
- The admin panel uses a simple password-based auth flow.

## License

This repository is available under the terms of the license in `LICENSE`.

