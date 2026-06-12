# MediGuardian AI — System Architecture

> An AI-powered healthcare platform combining symptom analysis, medical report interpretation, health tracking, emergency support, and specialist recommendations into a unified ecosystem.

---

## Table of Contents

1. [High-Level Overview](#1-high-level-overview)
2. [Layer 1 — Client / Frontend](#2-layer-1--client--frontend)
3. [Layer 2 — API Gateway & Auth](#3-layer-2--api-gateway--auth)
4. [Layer 3 — Backend Microservices](#4-layer-3--backend-microservices)
5. [Layer 4 — AI / ML Engine](#5-layer-4--ai--ml-engine)
6. [Layer 5 — Data & Storage](#6-layer-5--data--storage)
7. [Layer 6 — External Integrations](#7-layer-6--external-integrations)
8. [Layer 7 — Cross-Cutting Concerns](#8-layer-7--cross-cutting-concerns)
9. [Layer 8 — DevOps / Infra](#9-layer-8--devops--infra)
10. [Data Flow — End-to-End](#10-data-flow--end-to-end)
11. [Technology Stack Summary](#11-technology-stack-summary)
12. [Security Architecture](#12-security-architecture)
13. [Scalability Strategy](#13-scalability-strategy)
14. [Directory Structure](#14-directory-structure)

---

## 1. High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (Browser / Mobile)          │
│         Next.js · React · TypeScript · Tailwind CSS         │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────┐
│              API GATEWAY  (Rate limit · JWT · CORS)         │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│           BACKEND MICROSERVICES  (FastAPI / Python)         │
│  Symptom · Report · Chatbot · Risk · Hospital · First-Aid   │
└────────┬──────────────────────────────────────┬────────────┘
         │                                      │
┌────────▼────────┐                  ┌──────────▼──────────┐
│   AI / ML ENGINE│                  │   DATA LAYER        │
│  Transformers   │                  │  PostgreSQL · Redis  │
│  LangChain      │                  │  AWS S3             │
│  XGBoost · OCR  │                  └─────────────────────┘
└─────────────────┘
         │
┌────────▼──────────────────────────────────────────────────┐
│              EXTERNAL INTEGRATIONS                        │
│   Google Maps · OAuth · SMS Gateway · Email Service       │
└───────────────────────────────────────────────────────────┘
```

---

## 2. Layer 1 — Client / Frontend

**Stack:** Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · ShadCN UI

### Pages / Modules

| Module | Route | Description |
|---|---|---|
| Dashboard | `/dashboard` | Health summary, risk scores, recent activity |
| Symptom Analyzer | `/symptoms` | NLP input form, condition results, severity badge |
| Report Uploader | `/reports/upload` | Drag-and-drop PDF/JPG/PNG, OCR progress |
| Report Viewer | `/reports/:id` | Highlighted values, normal range comparison |
| AI Chatbot | `/chat` | Real-time streaming chat with health assistant |
| First-Aid Guide | `/first-aid` | Emergency categories, step-by-step instructions |
| Hospital Finder | `/hospitals` | Map view, distance, ratings, navigation |
| Health Tracker | `/tracker` | Charts for blood sugar, Hb, cholesterol, BP |
| Risk Predictor | `/risk` | Disease risk gauges with preventive suggestions |
| Profile | `/profile` | User info, medical history, preferences |
| Admin Panel | `/admin` | User management, AI analytics, system health |
| Auth | `/login`, `/register` | Email, Google OAuth, OTP |

### Frontend Architecture

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Login, Register, OTP
│   ├── (dashboard)/        # Protected routes
│   │   ├── dashboard/
│   │   ├── symptoms/
│   │   ├── reports/
│   │   ├── chat/
│   │   ├── first-aid/
│   │   ├── hospitals/
│   │   ├── tracker/
│   │   └── risk/
│   └── admin/
├── components/
│   ├── ui/                 # ShadCN base components
│   ├── charts/             # Recharts wrappers
│   ├── symptom/            # Symptom form + result cards
│   ├── report/             # Upload + parsed value display
│   ├── chat/               # Chat bubble, streaming renderer
│   └── map/                # Google Maps integration
├── hooks/                  # Custom React hooks
├── lib/                    # API client, utils, validators
├── stores/                 # Zustand global state
├── i18n/                   # Translation files (6 languages)
└── types/                  # Shared TypeScript interfaces
```

### Key Frontend Features

- **Dark/Light mode** via Tailwind CSS class strategy
- **Multilingual** using `next-intl` (EN, HI, BN, TA, TE, MR)
- **Streaming AI responses** via Server-Sent Events (SSE)
- **Interactive charts** via Recharts (blood markers over time)
- **PWA support** for mobile-first offline access
- **Accessibility** — WCAG 2.1 AA, ARIA roles, keyboard navigation

---

## 3. Layer 2 — API Gateway & Auth

**Stack:** Nginx / Kong Gateway · FastAPI middleware

### Responsibilities

- TLS termination (HTTPS enforced)
- JWT validation on every protected route
- Rate limiting per user and per IP
- CORS policy enforcement
- Request logging and tracing (trace-ID header)
- Route dispatch to backend microservices

### Auth Service

```
Authentication flows:
  Email + Password  →  bcrypt hash  →  JWT access + refresh tokens
  Google OAuth 2.0  →  ID token verification  →  JWT issuance
  OTP (SMS/Email)   →  6-digit code  →  Redis TTL validation  →  JWT
```

**Token strategy:**
- Access token: 15-minute expiry, signed RS256
- Refresh token: 7-day expiry, stored in HttpOnly cookie
- Token rotation on every refresh

---

## 4. Layer 3 — Backend Microservices

**Stack:** FastAPI · Python 3.11 · Pydantic v2 · SQLAlchemy · Celery

Each service is an independent FastAPI application, containerised with Docker, and communicates via REST internally (with an option to move to gRPC for hot paths).

### Services

#### 4.1 Symptom Service
- Accepts natural-language symptom description
- Calls NLP model (see AI layer) for condition inference
- Returns: possible conditions, confidence scores, severity level, recommended specialist
- Triggers emergency alert if severity = `EMERGENCY`

#### 4.2 Report Service
- Receives uploaded file (PDF/JPG/PNG) from S3 pre-signed URL
- Runs OCR pipeline to extract text and values
- Detects report type (CBC, lipid, thyroid, LFT, KFT, blood sugar)
- Compares extracted values against normal ranges
- Classifies each value: `NORMAL` / `MILD_ABNORMAL` / `CRITICAL`
- Returns structured JSON with highlighted findings

#### 4.3 Chatbot Service
- Manages conversation sessions (stored in Redis, TTL 24h)
- Calls LangChain pipeline with retrieved medical context (RAG)
- Streams response tokens back to frontend via SSE
- Maintains conversation history across turns

#### 4.4 Risk Prediction Service
- Accepts structured health inputs (age, weight, lab values, lifestyle)
- Runs XGBoost models for diabetes, CVD, hypertension, thyroid, anemia
- Returns risk percentage, risk level, and preventive advice

#### 4.5 Hospital Service
- Accepts user coordinates (lat/lng)
- Queries Google Maps Places API for nearby hospitals/clinics
- Enriches results with ratings, contact info, and navigation links
- Returns ranked list with specialty filters

#### 4.6 First-Aid Service
- Keyword/category lookup against curated first-aid knowledge base
- Returns step-by-step instructions with emergency severity flag

#### 4.7 History Service
- CRUD for user health timeline (symptoms, reports, diagnoses)
- Aggregates time-series data for chart endpoints
- Generates health summary for dashboard

#### 4.8 Notification Service
- Sends email alerts (SendGrid / AWS SES)
- Sends SMS/OTP (Twilio / Firebase)
- Pushes in-app notifications via WebSocket

---

## 5. Layer 4 — AI / ML Engine

**Stack:** Python · HuggingFace Transformers · LangChain · XGBoost · Scikit-learn · Tesseract OCR · EasyOCR

### 5.1 NLP Symptom Model

```
Input:  "I have fever, cough, headache, and fatigue"
         │
         ▼
  Tokenisation (HuggingFace tokenizer)
         │
         ▼
  Bio-BERT / ClinicalBERT fine-tuned on symptom-condition dataset
         │
         ▼
  Multi-label classifier
         │
         ▼
Output: [
  { condition: "Influenza",    confidence: 0.82, severity: "MEDIUM" },
  { condition: "Viral Fever",  confidence: 0.74, severity: "MEDIUM" },
  { condition: "Common Cold",  confidence: 0.61, severity: "LOW"    }
]
```

**Severity levels:**

| Level | Criteria |
|---|---|
| LOW | Common, self-limiting conditions |
| MEDIUM | Requires monitoring or OPD visit |
| HIGH | Needs prompt medical attention |
| EMERGENCY | Life-threatening — trigger alert immediately |

### 5.2 OCR Pipeline

```
Uploaded file (PDF / JPG / PNG)
       │
       ▼
Pre-processing  →  deskew · denoise · binarise
       │
       ▼
OCR Engine  →  Tesseract (primary) + EasyOCR (fallback for handwriting)
       │
       ▼
Value extraction  →  regex patterns per report type
       │
       ▼
Normal-range comparison  →  curated medical reference table
       │
       ▼
Structured output  →  { parameter, value, unit, status, explanation }
```

### 5.3 AI Explanation Engine

Converts raw medical values into plain-language explanations using a prompted LLM:

```
Input:  { parameter: "Hemoglobin", value: 9.8, unit: "g/dL", status: "CRITICAL" }
Output: "Your hemoglobin level is below the normal range of 12–17 g/dL.
         This may indicate anemia. Please consult a physician promptly."
```

### 5.4 LangChain Chatbot Pipeline

```
User message
     │
     ▼
Query embedding (text-embedding-ada-002 / local model)
     │
     ▼
Vector similarity search (FAISS / pgvector)  →  retrieve top-k medical docs
     │
     ▼
Prompt assembly:  system prompt + retrieved context + conversation history + user query
     │
     ▼
LLM (GPT-4 / Llama-3 fine-tuned on medical Q&A)
     │
     ▼
Streamed response  →  SSE to frontend
```

### 5.5 Risk Prediction Models

| Disease | Model | Input Features |
|---|---|---|
| Diabetes | XGBoost | Glucose, BMI, age, insulin, family history |
| Heart Disease | XGBoost + Logistic Regression | Cholesterol, BP, ECG, age, smoking |
| Hypertension | Random Forest | Systolic/diastolic BP, sodium intake, BMI |
| Thyroid Disorder | SVM | TSH, T3, T4, symptoms |
| Anemia | Decision Tree | Hemoglobin, RBC, MCV, MCH |

### 5.6 Emergency Detection System

Rule-based layer that runs in parallel with ML inference:

```python
EMERGENCY_RULES = [
    { symptom_keywords: ["chest pain", "crushing", "radiating arm"], severity: "EMERGENCY" },
    { symptom_keywords: ["can't breathe", "no oxygen"], severity: "EMERGENCY" },
    { lab_param: "blood_glucose", threshold: ">600 mg/dL", severity: "EMERGENCY" },
    { lab_param: "SpO2", threshold: "<85%", severity: "EMERGENCY" },
]
```

On match: block normal response, return emergency card with 112/ambulance prompt.

---

## 6. Layer 5 — Data & Storage

### 6.1 PostgreSQL (Primary Database)

```sql
Core tables:
  users               -- profile, preferences, auth credentials
  health_records      -- symptoms, diagnoses, AI recommendations
  medical_reports     -- metadata, S3 key, OCR results (JSONB)
  report_values       -- extracted lab values (indexed for charting)
  risk_assessments    -- ML model outputs per user per date
  appointments        -- upcoming consultations
  audit_logs          -- HIPAA-compliant action trail
```

- All PHI columns encrypted at rest (pgcrypto AES-256)
- Row-level security (RLS) ensures users access only their own data
- Read replica for analytics and reporting queries

### 6.2 Redis

| Key pattern | Usage | TTL |
|---|---|---|
| `session:{userId}` | JWT refresh token store | 7 days |
| `chat:{sessionId}` | Conversation history | 24 hours |
| `otp:{phone}` | OTP code | 10 minutes |
| `rate:{ip}` | Rate limit counter | 1 minute |
| `cache:risk:{userId}` | Risk score cache | 6 hours |

### 6.3 AWS S3 / Firebase Storage

- Raw report uploads stored in `mediguardian-reports/{userId}/{reportId}`
- Pre-signed URLs for direct browser upload (files never pass through the API server)
- Server-side encryption (SSE-S3)
- Lifecycle policy: archive to Glacier after 12 months

### 6.4 Vector Store (FAISS / pgvector)

- Medical knowledge base embeddings for chatbot RAG
- ~50k medical Q&A pairs, drug info, disease encyclopaedia
- Updated monthly via automated ingestion pipeline

---

## 7. Layer 6 — External Integrations

| Service | Provider | Purpose |
|---|---|---|
| Maps & Places | Google Maps API | Hospital/clinic finder, navigation |
| Social Login | Google OAuth 2.0 | One-click authentication |
| SMS / OTP | Twilio or Firebase Auth | OTP delivery |
| Transactional Email | SendGrid / AWS SES | Alerts, reports, onboarding |
| LLM API | OpenAI GPT-4 / Groq | Chatbot and explanation engine |
| Push Notifications | Firebase Cloud Messaging | Mobile app alerts |

---

## 8. Layer 7 — Cross-Cutting Concerns

### Internationalisation (i18n)

Supported languages: **English · Hindi · Bengali · Tamil · Telugu · Marathi**

- Implemented via `next-intl` on the frontend
- All AI responses pass through a translation post-processor when the user's locale is non-English
- Language preference stored in user profile and synced across devices

### Observability

```
Logging    →  structured JSON logs  →  AWS CloudWatch / ELK Stack
Metrics    →  Prometheus + Grafana  (API latency, error rate, model inference time)
Tracing    →  OpenTelemetry + Jaeger (distributed trace per request)
Alerting   →  PagerDuty / Slack webhooks on P1 incidents
```

### Security

- **Encryption in transit:** TLS 1.3 on all endpoints
- **Encryption at rest:** AES-256 for database PHI fields, S3 SSE
- **HIPAA compliance:** audit logs for every PHI access, data retention policy
- **OWASP Top 10:** input sanitisation, parameterised queries, CSP headers
- **Dependency scanning:** Dependabot + Snyk in CI pipeline

### Accessibility

- WCAG 2.1 AA compliance
- Screen-reader support via semantic HTML and ARIA
- Keyboard navigation throughout
- Minimum 4.5:1 colour contrast ratio

---

## 9. Layer 8 — DevOps / Infra

**Stack:** Docker · Kubernetes (EKS) · GitHub Actions · Terraform · AWS

### CI/CD Pipeline

```
Push to feature branch
        │
        ▼
GitHub Actions CI:
  ├── Lint (ESLint, Ruff)
  ├── Type check (tsc, mypy)
  ├── Unit tests (Jest, Pytest)
  ├── Security scan (Snyk, Trivy)
  └── Build Docker images
        │
        ▼
Pull Request → Code review → Merge to main
        │
        ▼
GitHub Actions CD:
  ├── Build & push to ECR
  ├── Terraform plan
  └── Deploy to EKS (rolling update)
        │
        ▼
Post-deploy:
  ├── Smoke tests
  ├── Synthetic monitoring
  └── Rollback on failure
```

### Kubernetes Deployment

```yaml
# Each microservice runs as a Deployment with:
replicas: 2                      # minimum; HPA scales up to 10
resources:
  requests: { cpu: 250m, memory: 512Mi }
  limits:   { cpu: 1000m, memory: 2Gi }
readinessProbe: /health
livenessProbe:  /health
```

### Infrastructure (Terraform-managed)

- **EKS cluster** — managed Kubernetes on AWS
- **RDS PostgreSQL** — Multi-AZ, automated backups
- **ElastiCache Redis** — cluster mode
- **ALB** — Application Load Balancer with WAF
- **CloudFront CDN** — static assets and Next.js edge caching
- **Route 53** — DNS with health checks

---

## 10. Data Flow — End-to-End

### Symptom Analysis Flow

```
1. User types symptoms in the browser
2. Frontend sends POST /api/symptoms with symptom text
3. API Gateway validates JWT, forwards to Symptom Service
4. Symptom Service calls NLP model (Bio-BERT)
5. Model returns conditions + confidence + severity
6. If severity = EMERGENCY → Emergency Service triggers alert
7. Specialist Recommendation Engine maps conditions → doctor type
8. Response persisted to health_records table
9. JSON response returned to frontend
10. Frontend renders condition cards with severity badge and specialist CTA
```

### Medical Report Analysis Flow

```
1. User selects file in Report Uploader component
2. Frontend requests pre-signed S3 URL from Report Service
3. File uploaded directly to S3 (bypasses API server)
4. S3 triggers Lambda → notifies Report Service
5. Report Service downloads file from S3
6. OCR pipeline extracts text and values
7. Values compared against normal-range reference table
8. AI Explanation Engine generates plain-language summaries
9. Results stored in medical_reports + report_values tables
10. Frontend polls /api/reports/:id until status = COMPLETE
11. Viewer renders highlighted value grid with colour-coded status
```

---

## 11. Technology Stack Summary

| Layer | Technology |
|---|---|
| Frontend framework | Next.js 14 + React 18 + TypeScript |
| UI components | Tailwind CSS + ShadCN UI |
| Charts | Recharts |
| State management | Zustand |
| Backend framework | FastAPI (Python 3.11) |
| Task queue | Celery + Redis |
| Primary database | PostgreSQL 15 |
| Cache | Redis 7 |
| File storage | AWS S3 |
| ORM | SQLAlchemy 2 + Alembic |
| NLP model | HuggingFace Transformers (Bio-BERT / ClinicalBERT) |
| Risk models | XGBoost + Scikit-learn |
| Chatbot orchestration | LangChain |
| OCR | Tesseract OCR + EasyOCR |
| Vector search | FAISS / pgvector |
| Auth | JWT (RS256) + OAuth 2.0 |
| Maps | Google Maps Platform |
| Containerisation | Docker + Docker Compose |
| Orchestration | Kubernetes (AWS EKS) |
| IaC | Terraform |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus + Grafana + Sentry |
| CDN | CloudFront |

---

## 12. Security Architecture

```
Internet
   │
   ▼
CloudFront (WAF + DDoS protection)
   │
   ▼
ALB (TLS 1.3 termination)
   │
   ▼
API Gateway (JWT validation, rate limiting)
   │
   ▼
Microservices (internal mTLS between pods)
   │
   ├── PostgreSQL (VPC private subnet, encrypted at rest)
   ├── Redis      (VPC private subnet, AUTH required)
   └── S3         (bucket policy: no public access, SSE-S3)
```

**PHI protection checklist:**
- All PHI fields encrypted with pgcrypto before storage
- Audit log written on every read/write of PHI
- Data never logged in application logs
- Right-to-erasure workflow for GDPR/DPDP compliance
- Penetration testing quarterly

---

## 13. Scalability Strategy

| Bottleneck | Strategy |
|---|---|
| High AI inference latency | Model served via dedicated GPU pods; async job queue for non-real-time inference |
| Database read load | Read replica for analytics; Redis cache for frequent queries |
| Report OCR processing | Celery worker pool; S3 + Lambda async trigger |
| Chatbot concurrency | Horizontal pod autoscaling; SSE connection pooling |
| File uploads | Direct-to-S3 via pre-signed URLs; no bandwidth cost on API servers |
| Cold start (ML models) | Models pre-loaded in memory on pod startup; warm-up probes |

---

## 14. Directory Structure

```
mediguardian/
├── frontend/                   # Next.js application
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── stores/
│   │   ├── i18n/
│   │   └── types/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── gateway/                # API Gateway + auth middleware
│   ├── services/
│   │   ├── symptom/
│   │   ├── report/
│   │   ├── chatbot/
│   │   ├── risk/
│   │   ├── hospital/
│   │   ├── first_aid/
│   │   ├── history/
│   │   └── notification/
│   └── shared/                 # Common models, utils, DB client
│
├── ai/
│   ├── nlp/                    # Symptom NLP model + training
│   ├── ocr/                    # OCR pipeline
│   ├── risk_models/            # XGBoost training + inference
│   ├── chatbot/                # LangChain chains + RAG setup
│   └── explanation/            # Plain-language generator
│
├── infra/
│   ├── terraform/              # AWS resource definitions
│   ├── k8s/                    # Kubernetes manifests
│   └── docker/                 # Dockerfiles per service
│
├── .github/
│   └── workflows/              # CI/CD pipelines
│
└── docs/                       # Architecture diagrams, ADRs
```

---

*MediGuardian AI — Architecture Document v1.0*
