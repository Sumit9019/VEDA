# VedaAI Smart Assessment Creator Pro

VedaAI is a full-stack AI assessment generation platform for teachers. It lets an educator create an assignment, generate a structured question paper with AI, review and edit the output, and export the final paper in multiple formats.

## Demo Scope

- Create assignments with validation
- Extract reference text from PDF/TXT uploads
- Generate structured question papers with AI
- Track progress in real time through WebSockets
- Edit, reorder, delete, and regenerate questions before export
- Download question paper PDF, answer key PDF, and DOCX

## Architecture Overview

### Frontend

- Next.js App Router
- TypeScript
- Tailwind CSS
- Zustand for app state
- React Hook Form + Zod for form validation
- Socket.IO client for real-time generation updates

### Backend

- Node.js + Express + TypeScript
- MongoDB for assignments and generated results
- Redis for cache and queue state
- BullMQ for background generation and export jobs
- Socket.IO for pushing progress updates to the client
- Puppeteer for PDF generation
- `html-to-docx` for DOCX export

### AI Layer

- OpenAI-compatible SDK integration
- NVIDIA-hosted model support
- Structured prompt building
- Strict response parsing into app-owned JSON shape
- Local fallback generator for offline/demo-safe behavior

## High-Level Flow

1. Teacher fills the assignment creation form on the frontend.
2. Backend validates input and stores the assignment in MongoDB.
3. A BullMQ generation job is queued.
4. Worker checks Redis cache for an equivalent request.
5. If not cached, the AI generation service builds a structured paper.
6. Parsed sections/questions are stored in MongoDB.
7. WebSocket events notify the frontend about progress and completion.
8. PDF and DOCX exports are generated in the background.
9. Teacher can review, edit, regenerate, and export the paper.

## Approach

The implementation was designed around one core principle: do not trust raw LLM output as final UI. The backend converts assignment input into a controlled prompt, parses the response into a strict internal structure, stores only normalized data, and lets the frontend render from that structured result.

The system is split so that the user-facing API remains responsive while heavy work happens in background workers. BullMQ handles generation and export jobs, Redis supports both caching and queue coordination, and WebSockets keep the teacher informed in real time without polling loops.

On top of the base assignment requirements, the product was extended with practical teacher-facing workflows: question-level regeneration, section regeneration, edit-before-export, answer key export, and DOCX export. These make the project feel closer to a usable product rather than only an assignment demo.

## Repository Structure

```text
.
├── backend
│   ├── src
│   │   ├── controllers
│   │   ├── models
│   │   ├── queues
│   │   ├── routes
│   │   ├── services
│   │   ├── sockets
│   │   └── workers
├── frontend
│   ├── app
│   ├── components
│   └── lib
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js 20.9+ recommended for the frontend build
- npm
- MongoDB
- Redis

### Backend Environment

Create `backend/.env`:

```env
NVIDIA_API_KEY=your_nvidia_api_key
MONGODB_URI=your_mongodb_cluster_uri
REDIS_URL=redis://localhost:6379
PORT=4000
USE_REMOTE_AI=true
NVIDIA_GENERATION_MODEL=meta/llama3-70b-instruct
FRONTEND_URL=http://localhost:3000
```

If you want to run without remote AI, set:

```env
USE_REMOTE_AI=false
```

### Install Dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### Run Locally

Start Redis first:

```bash
redis-server --daemonize yes
```

Start backend:

```bash
cd backend
npm run dev
```

Start frontend:

```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:3000` and backend runs on `http://localhost:4000`.

## Deployment

### Backend Deployment Notes

The backend uses Puppeteer for PDF generation and `poppler-utils` for text extraction from PDF references. Deploying with a generic auto-detected Node builder can fail while installing these system dependencies. A production-ready Docker setup is included in `backend/Dockerfile` that installs Chromium and `poppler-utils`.

If you are deploying the backend on Railway:

1. Create a separate backend service from this repository.
2. Set the service root directory to `backend`.
3. Let Railway build from the included `Dockerfile`.
4. Add environment variables:
   - `PORT=4000`
   - `MONGODB_URI=...`
   - `REDIS_URL=...`
   - `NVIDIA_API_KEY=...`
   - `USE_REMOTE_AI=true`
   - `FRONTEND_URL=https://your-frontend-domain.vercel.app` *(Crucial for CORS; do NOT include trailing slashes or subpaths)*
5. Expose port `4000`.

This avoids the common Puppeteer image-build failure from auto-installing browser dependencies through the default buildpacks path.

## Key Features

- Assignment creation with validation
- PDF/TXT reference extraction
- Queue-based AI generation
- Redis caching for repeated generation requests
- Real-time progress via WebSocket
- Structured question paper rendering
- Inline edit before export
- Question and section regeneration
- Question paper PDF export
- Answer key PDF export
- DOCX export

## Verification Notes

- Backend TypeScript build passes with `npm run build`
- Frontend lint runs successfully with only unrelated existing warnings in `frontend/app/dashboard/page.tsx`
- Frontend production build requires Node.js `>=20.9.0`

## Submission Notes

- Keep `backend/.env` private and do not commit secrets
- Install dependencies locally after cloning
- Ensure MongoDB and Redis are running before testing the full workflow
