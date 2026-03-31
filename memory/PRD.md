# TrustFhone Delhi - Product Requirements Document

## Original Problem Statement
Build a complete production-ready full-stack web application called "TrustFhone Delhi" — a premium, AI-powered mobile phone marketplace with strict trust verification.

## User Personas
- **Sellers**: List phones with IMEI, condition, images, and bill for AI verification
- **Buyers**: Browse verified phone listings, contact sellers via WhatsApp
- **Admin**: Review listings, manage users, approve/reject listings

## Core Requirements
- Backend: Node.js + Express (NOT FastAPI)
- Frontend: React + Tailwind CSS + Framer Motion
- Database: MongoDB
- JWT Auth with roles (Buyer, Seller, Admin)
- Mobile Listing System (IMEI, condition, bill image required)
- AI Fraud Detection: IMEI validation (Luhn), duplicate detection, bill OCR, fraud score
- Premium dark mode UI with glassmorphism
- WhatsApp Community integration

## Tech Stack
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT, Multer
- **Frontend**: React, Tailwind CSS, Framer Motion, Shadcn UI
- **AI**: OpenAI GPT-4o via emergentintegrations (Python helper)
- **Images**: Cloudinary (LIVE - configured with real keys)

## What's Been Implemented (as of 2026-03-31)
- [x] Node.js + Express backend (port 8001)
- [x] MongoDB schemas (User, Listing, FraudReport, AdminLog)
- [x] JWT Auth with roles (Buyer, Seller, Admin)
- [x] Admin seeding (admin@trustfhone.com / admin123)
- [x] React Frontend with Tailwind & Framer Motion
- [x] Admin, Seller, and Buyer Marketplace dashboards
- [x] AI Fraud Detection (IMEI Luhn, duplicates, image quality, user behavior)
- [x] Real AI Bill OCR via emergentintegrations Python helper (GPT-4o Vision)
- [x] **Cloudinary Integration LIVE** - Images upload to cloud storage
- [x] Local image upload fallback (if Cloudinary fails)
- [x] WhatsApp direct chat and Community integration
- [x] "Made with Emergent" watermark removed
- [x] Page title and meta updated to TrustFhone Delhi
- [x] Input validation in fraud detection middleware

## API Endpoints
- `POST /api/auth/signup` - Register
- `POST /api/auth/login` - Login
- `GET /api/health` - Health check
- `POST /api/listings` - Create listing (seller)
- `GET /api/listings` - Public marketplace
- `GET /api/listings/:id` - Single listing
- `GET /api/listings/my/listings` - Seller's listings
- `DELETE /api/listings/:id` - Delete listing
- `POST /api/cloudinary/upload` - Image upload (Cloudinary)
- `GET /api/cloudinary/signature` - Cloudinary signed upload
- Admin routes for listing management

## Prioritized Backlog
### P2
- Production deployment optimizations
- Advanced fraud detection improvements
- Rate limiting and security hardening
- Email notifications for listing status changes

### P3
- Buyer favorites/wishlist
- Seller ratings and reviews
- Chat between buyer and seller (in-app)
- Push notifications
