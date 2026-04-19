# Logivision AI

**Logivision** is a full-stack AI-powered platform designed to [Insert Brief Purpose, e.g., analyze images/text or provide logical insights]. This project demonstrates a secure, scalable architecture using a React frontend and a Node.js backend.

##  Live Demo
- **Frontend:** [https://logivison-3eav.vercel.app/](https://logivison-3eav.vercel.app/)
- **Backend API:** [https://logivison.onrender.com/api/health](https://logivison.onrender.com/api/health)

##  Tech Stack
- **Frontend:** React, Vite, Framer Motion (Animations), Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas
- **Authentication:** JWT (JSON Web Tokens)
- **Deployment:** Vercel (Frontend) & Render (Backend)

##  Key Features
- **User Authentication:** Secure Sign-up and Login with password hashing.
- **AI Integration:** [Mention specific AI functionality you used, e.g., Gemini API].
- **Security:** Implemented Rate Limiting to prevent brute-force attacks.
- **Responsive UI:** Sleek dark-mode interface with glassmorphism effects.

##  Architecture & Deployment
This project uses a **Monorepo** structure. 
- **The Challenge:** Connecting a Vercel-hosted frontend to a Render-hosted backend while avoiding CORS issues.
- **The Solution:** Implemented a **Vercel Reverse Proxy** using `vercel.json` to route all `/api` requests to the Render instance seamlessly.
