# AgentsKaro: Comprehensive Project Report & Technical Documentation

## 1. Executive Summary
**AgentsKaro** (formerly known as Job Apply Automator) is an advanced, AI-powered job application automation framework designed to streamline the tedious process of job hunting. The platform provides a modern, premium user interface for orchestrating intelligent bots capable of navigating, scraping, and applying to jobs across multiple platforms like Internshala, Naukri, and Indeed. With a robust FastAPI backend, a dynamic React/Vite frontend, and resilient automation engines, AgentsKaro represents the bleeding edge of workflow automation.

This document serves as a comprehensive technical footprint of the platform, detailing its architecture, technical stack, automation strategies, and the roadmap toward an Agentic Reinforcement Learning (RL) framework.

---

## 2. Project Vision & Brand Identity
The platform recently underwent a comprehensive rebranding to **AgentsKaro**, positioning itself as a legally smart, premium automation suite for professionals. 

- **Primary Color Palette:** Navy Blue (`#1C4670`) and Vibrant Orange (`#FFA229`).
- **Design Philosophy:** Premium, high-performance, dark/light mode adaptable, incorporating modern floating aesthetics, glassmorphism, and smooth micro-animations.
- **Core Mantra:** "Legally Smart Automation."

---

## 3. High-Level System Architecture
AgentsKaro employs a decoupled, highly scalable architecture combining modern web paradigms with heavy-duty background processing capabilities.

### 3.1. Technical Stack
- **Frontend Layer:** React.js, Vite, TypeScript, Tailwind CSS v4, Framer Motion (for animations), React Router, Lucide React (icons).
- **Backend Layer:** Python, FastAPI, Uvicorn, Pydantic, WebSockets (for live streaming).
- **Automation / Bot Layer:** Selenium, `undetected-chromedriver`, Subprocess Management.
- **Database / Storage layer:** Supabase (PostgreSQL), previously MongoDB. Local storage for immediate session logs and artifacts.
- **AI / NLP Layer:** NLTK (Natural Language Toolkit) for local resume keyword extraction and processing.

---

## 4. Frontend Architecture (React + Vite)
The frontend serves as the control center, communicating with the FastAPI layer via secure RESTful endpoints and managing live session data.

### 4.1. Core Modules and Pages
- **`Dashboard.tsx`:** The nerve center displaying high-level bot execution states, system pulses, and active module status.
- **`BotControl.tsx`:** A reusable, highly dynamic interface to control individual bots (Internshala, Naukri, Indeed, Company Crawler). Manages real-time log streaming and execution commands.
- **`AIJobSearch.tsx`:** Leverages RAG (Retrieval-Augmented Generation) and RLAIF principles to parse user resumes and search corresponding jobs.
- **`DataViewer.tsx`:** An integrated spreadsheet/table view displaying successfully applied jobs, scraping timestamps, and export functionality (to XLSX).
- **`Settings.tsx`:** Profile and environment management, storing platform credentials safely and syncing with the backend database.
- **`Browser.tsx`:** A live viewer component providing real-time visual feedback ("live view") from the headless/invisible bot browsers.

### 4.2. State & Authentication
Authentication is strictly enforced using JWT/Session-based approaches connected to Supabase.
- **Local Identity Portal:** Handles standard email/password logins with hashing (`argon2`).
- **OAuth Integration:** Secure "GitHub Passport" and Google Workspaces login integration for seamless identity federation.
- **Guest Mode:** An observational mode allowing users to explore the UI before registering or purchasing a subscription.

---

## 5. Backend Architecture (FastAPI)
The backend orchestration is handled by `backend/main.py`, functioning as an API gateway, session manager, and subprocess runner.

### 5.1. Key Microservices
- **Authentication & User Management:** Generates user identities, handles password hashing via `passlib`, and provisions Supabase entries.
- **Payment Gateway Integration:** Razorpay integration allowing tier-based subscriptions (Free, Monthly, Yearly, Lifetime).
- **Bot Subprocess Orchestrator (`BotRunner`):** A custom threading mechanism that safely encapsulates Selenium automation scripts.
- **Data Synchronization:** Real-time persistence of `Applied Jobs` via the `/api/notify-apply` internal webhook hook.

### 5.2. Database Schema (Supabase)
Migrated from MongoDB Atlas to robust PostgreSQL structure for transactional integrity.
- **`users` Table:** Stores standard user credentials, identities, password hashes, and active subscription states.
- **`settings` Table:** A JSONB oriented table containing encrypted (or securely stored) automation credentials (Internshala credentials, Naukri credentials, etc.).
- **`usage` Table:** Rate limiting and tracking to enforce free-tier limitations (e.g., maximum 10 applies).
- **`applications` Table:** A comprehensive log of every job successfully applied to, tracking the `Platform`, `Job Role`, `Company`, and `Timestamp`.

---

## 6. Core Automation Engines
The raw power of AgentsKaro lies in its independent crawler and interaction engines located in the `engines/` directory.

### 6.1. The `BotRunner` Execution Model (`bot_runner.py`)
To prevent the FastAPI event loop from blocking and to ensure maximum stability, individual bots are executed as detached `subprocess.Popen` entities. 
- Python code execution is piped dynamically via `stdin` to avoid writing temporary scripts to the disk.
- Standard Out (`stdout`) from the subprocesses is caught via a dedicated background thread, safely placed into a FIFO Queue, and streamed to the frontend for a "console-like" live terminal experience.

### 6.2. Available Bot Engines
1. **Internshala Bot:** Automates the complete application loop (Login -> Search -> Filter -> Cover Letter -> Apply).
2. **Naukri Scraper & Applier:** Bypasses Naukri's complex anti-bot capabilities using `undetected-chromedriver`. Understands pagination and complex DOM structures.
3. **Indeed Bot:** Focuses on high-volume aggregations and "Easy Apply" mechanisms.
4. **Company Crawler (Premium Feature):** Dynamically targets specific company domain career pages to scrape proprietary job listings.

### 6.3. NLP & Resume Processing (`resume_processor.py`)
Upload an incoming PDF/DOCX file, parse out text streams, and utilize NLTK (custom locally downloaded corpora) to perform named-entity extraction, extracting core technical skills to auto-feed the search engines.

---

## 7. Next-Generation Agentic RL Architecture (The Future)
AgentsKaro is not just a hard-coded scraper; it is the foundation for an **Agentic Web Navigation Model (RL + LMM)**.

### 7.1. The "Learning from Demonstration" Objective
Current systems run via brittle XPaths. The next-generation framework replaces this with Vision-Language Models (VLM) mapped with Reinforcement Learning (RL).
- **Phase 1: Observation Mode:** A user manually applies to a job while a Playwright watcher records DOM State, Accessibility Trees (AXTree), and Visual Snapshots alongside a JSON Action Trace.
- **Phase 2: Agentic Generalization:** Utilizing LMMs (like Claude 3.5 Sonnet / LLaVA), the agent evaluates the visual layout of a new website, infers the semantics regardless of class names, and dynamically predicts the next best action (e.g., identifying a green button as an apply button despite it being named arbitrarily).
- **Phase 3: Execution Loop:** The model feeds the exact JSON command -> Playwright clicks -> Model captures resulting state.
- **Phase 4: RL Optimization:** Applying Proximal Policy Optimization (PPO) algorithms where successful applications reward the bot (+50), and stuck loops penalize (-10), training a fully autonomous "Web Navigation Agent."

---

## 8. Development & Deployment Operations
- **Containerization Readiness:** Equipped with `Dockerfile` and `render.yaml` configurations.
- **Continuous Integration:** Environment is configured to deploy the FastAPI array and React compilation seamlessly to Render.
- **Setup Tooling:** Automated `setup.bat` and `run.bat` scripts manage environment virtual setups, NLTK caching, and parallel Node.js module bootstrapping for the Windows environment.

---

## 9. Limitations & Ethical Considerations
AgentsKaro strictly advocates for ethical scraping. 
- Execution throttling and random traversal delays are injected dynamically.
- "Headless" and graphical mode options exist so users can physically monitor applications.
- Credential processing ensures local-first priority, mapping `.env` data securely without logging external passwords unencrypted.

---

## 10. Conclusion
AgentsKaro sits uniquely at the intersection of modern Full-Stack Engineering, intelligent web scraping, and evolving LLM capabilities. By establishing a robust system connecting isolated Selenium micro-processors with an ultra-responsive React dashboard and solid Supabase persistence, it handles today's automation needs while paving the direct path for tomorrow's Reinforcement Learning Web Agents.
