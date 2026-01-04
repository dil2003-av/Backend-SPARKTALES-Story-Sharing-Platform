# SparkTales Backend - Full Stack Story Sharing Platform

The **backend** of SparkTales provides a **RESTful API** to support the frontend web application. It is built using **Node.js, Express, TypeScript, and MongoDB** and implements secure authentication, role-based access, and advanced features like JWT refresh tokens and AI content generation.

---

## 🌟 Project Overview

This backend serves as the core of the **SparkTales platform**, managing users, stories, reviews, notifications, and admin functionalities. It is designed with **scalability, security, and maintainability** in mind.

**Learning Outcomes:**

* Build a RESTful API using Node.js, Express, and TypeScript.
* Implement secure authentication & authorization with JWT and bcryptjs.
* Manage data with MongoDB Atlas and Mongoose schemas.
* Apply proper folder structure and middleware for maintainable backend architecture.

**Professional Relevance:**
Prepares for roles such as:

* Backend Developer (Node.js + Express + MongoDB)
* Full Stack Developer (MERN + TypeScript)
* Software Engineer specializing in API design & secure web services

---

## 🛠️ Technologies & Tools

**Backend:**

* Node.js + Express.js + TypeScript
* MongoDB Atlas + Mongoose for database modeling
* JWT & bcryptjs for authentication and security
* dotenv for environment variables

**Other Tools & Services:**

* Nodemailer for sending emails
* Cloudinary for image management
* Vercel / Railway / Render deployment
* Swagger / Postman for API testing

---

## 📐 System Architecture

* **Client-Server Architecture:** Frontend communicates with backend via RESTful API endpoints.
* **Database:** MongoDB Atlas with Mongoose validation and indexing.
* **Authentication:** JWT-based with role-based access (Admin, Author, User).
* **Folder Structure Example:**

```text
backend/
├── controllers/       # API logic
├── middleware/        # Auth, roles, validation
├── models/            # Mongoose schemas
├── routes/            # API routes
├── utils/             # Helper functions
├── config/            # DB connection, environment
└── index.ts           # Server entry point
```

---

## 🔑 Features

**User Features:**

* Registration & login with encrypted passwords
* Role-based access control
* CRUD operations on personal stories
* ReadFun section for short stories
* Reviews & notifications

**Admin Features:**

* Dashboard with analytics (users, posts, reviews)
* Manage users, posts, reviews, and notifications
* Protected routes & role-based authorization

**Advanced Features:**

* AI API integration (story/content generation)
* Cloudinary image upload & management
* JWT token refresh system for secure authentication

---

## 🚀 Live Deployment

* **Frontend:** [https://frontend-sparktales-story-sharing-p-psi.vercel.app/](https://frontend-sparktales-story-sharing-p-psi.vercel.app/)
* **Backend:** [https://backend-sparktales-story-sharing-pl-sigma.vercel.app/](https://backend-sparktales-story-sharing-pl-sigma.vercel.app/)

---

## 💻 Setup & Installation

```bash
# Clone backend repository
git clone https://github.com/dil2003-av/Backend-SPARKTALES-Story-Sharing-Platform.git
cd backend

# Install dependencies
npm install

# Create .env file with:
# MONGO_URI=<your-mongodb-atlas-uri>
# JWT_SECRET=<your-jwt-secret>
# FRONTEND_URL=<frontend-url>

# Start development server
npm run dev
```

---

## 📝 API Endpoints Overview

**Auth**

* POST `/api/v1/auth/register` - Register a new user
* POST `/api/v1/auth/login` - Login and receive JWT
* POST `/api/v1/auth/refresh` - Refresh access token
* GET `/api/v1/auth/me` - Get current user details

**Posts**

* GET `/api/v1/post` - Get all posts
* POST `/api/v1/post` - Create post
* PUT `/api/v1/post/:id` - Update post
* DELETE `/api/v1/post/:id` - Delete post

**Reviews**

* POST `/api/v1/review` - Add review
* GET `/api/v1/review` - List reviews

**Admin**

* GET `/api/v1/admin/users` - List all users
* PUT `/api/v1/admin/user/:id` - Update user roles
* DELETE `/api/v1/admin/user/:id` - Delete user

**Notifications**

* GET `/api/v1/notifications` - Fetch notifications
* POST `/api/v1/notifications` - Create notification

---

## ⚡ Version Control

* GitHub repository maintained with clear, progressive commits
* Backend is in a separate repository for clean separation

**Repository:** [https://github.com/dil2003-av/Backend-SPARKTALES-Story-Sharing-Platform](https://github.com/dil2003-av/Backend-SPARKTALES-Story-Sharing-Platform)

---

## 🎯 Next Steps / Improvements

* Add analytics dashboard for users and posts
* Enhance AI-powered content generation
* Multi-language support for global users
* Email notification automation

---

✅ **Backend is fully functional and ready for production deployment.**

---
