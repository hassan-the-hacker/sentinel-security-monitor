# Sentinel – Cybersecurity Health Monitor

![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)
![Next.js](https://img.shields.io/badge/Next.js-14.2-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-cyan.svg)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20RLS-3ecf8e.svg)
![Tests](https://img.shields.io/badge/Tests-25%20Passed%20(Vitest)-10b981.svg)
![Deployment](https://img.shields.io/badge/Vercel-Production%20Ready-black.svg)

**Sentinel** is an enterprise-grade, open-source cybersecurity SaaS web application that provides continuous external posture assessment, SSL/TLS cryptographic verification, HTTP security header analysis, and DNS/email hygiene monitoring without expensive subscriptions or intrusive port scanning.

---

## 🎯 Problem Statement

Modern organizations deploy web applications across complex multi-cloud and CDN environments. Misconfigurations in SSL certificates, missing security headers (like Content-Security-Policy and HSTS), weak email authentication policies (SPF and DMARC), and server banner version leaks leave organizations vulnerable to:
1. **Man-in-the-Middle (MitM) Attacks** via unencrypted HTTP and expired or misconfigured SSL certificates.
2. **Cross-Site Scripting (XSS) and Clickjacking** due to omitted CSP and X-Frame-Options headers.
3. **Business Email Compromise (BEC) and Phishing** resulting from missing or permissive SPF records and weak DMARC policies.
4. **Targeted Exploitation** enabled by disclosed server runtime banners and technology signatures.

Commercial security posture management platforms charge hundreds to thousands of dollars per month. **Sentinel was architected to solve this with a ₹0 / $0 development budget using 100% free, open-source technologies, zero paid APIs, and zero fake statistics.**

---

## ✨ Features & Capabilities

- 🛡️ **Cryptographic SSL/TLS Deep Dive**:
  - Live socket handshake via Node.js native `tls` module with SNI support.
  - Certificate validity check, expiration countdown, and early expiration warning thresholds (< 30 days).
  - Subject Alternative Names (SAN), Issuer CA validation, and cipher suite strength analysis.
  - TLS 1.2 and TLS 1.3 protocol verification.

- 🔒 **HTTP Security Header Audit**:
  - Strict compliance checks for **Content-Security-Policy (CSP)**, **Strict-Transport-Security (HSTS)**, **X-Content-Type-Options**, **X-Frame-Options**, **Referrer-Policy**, and **Permissions-Policy**.
  - Identification of software version disclosures (`Server` and `X-Powered-By` leakage).
  - Copy-paste remediation configuration blocks for Nginx, Apache, Cloudflare, and Next.js.

- 🌐 **DNS & Anti-Spoofing Hygiene**:
  - Apex domain and subdomain DNS record resolution (A, AAAA for IPv6 readiness, MX, NS, CAA).
  - Strict **SPF (Sender Policy Framework)** record evaluation (`-all` vs `~all` vs dangerous `+all`).
  - **DMARC policy analysis** (`p=reject`, `p=quarantine`, `p=none`).
  - Cryptographic **DNSSEC status verification** using DNS-over-HTTPS (DoH) Authenticated Data (`AD`) flag inspection.

- 🚀 **100-Point Deterministic Security Scoring**:
  - Transparent point allocation:
    - **SSL/TLS Encryption**: 25 Points
    - **HTTP Security Headers**: 30 Points
    - **DNS & Email Hygiene**: 25 Points
    - **HTTPS Redirection & Routing**: 20 Points
  - Grade mapping: **A+ (95–100)**, **A (85–94)**, **B (70–84)**, **C (55–69)**, **D (40–54)**, **F (< 40)**.
  - Categorized findings: Critical, High, Medium, Low, and Safe (Passed).

- 📄 **Executive PDF Security Reports**:
  - Instant client/server-side generation of high-resolution, executive audit reports using `jspdf` and `jspdf-autotable`.
  - Zero heavy Chromium/Puppeteer binary dependencies, ensuring flawless serverless execution on Vercel's free tier.

- 🛡️ **Military-Grade SSRF Defense**:
  - Pre-flight DNS resolution before opening any socket connection.
  - Rejection of loopback (`127.0.0.0/8`, `::1`), RFC 1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), Link-local (`169.254.0.0/16`), Carrier-grade NAT (`100.64.0.0/10`), Cloud Metadata endpoints (`169.254.169.254`), and IPv6 equivalents.
  - Protection against DNS rebinding and redirect-based SSRF.

---

## 🏗️ Architecture & Technology Stack

```
   ┌─────────────────────────────────────────────────────────────┐
   │                       BROWSER CLIENT                        │
   │   Next.js 14 App Router • Tailwind CSS • Recharts • Lucide  │
   └──────────────────────────────┬──────────────────────────────┘
                                  │ HTTPS
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │                 SENTINEL BACKEND ENGINE                     │
   │  Next.js Serverless Route Handlers (Node.js 20+ Runtime)    │
   │                                                             │
   │  ┌─────────────────┐  ┌──────────────────────────────────┐  │
   │  │   SSRF Guard    │  │        Concurrent Probes         │  │
   │  │ Pre-flight DNS  │  │  ├─ TLS Socket Handshake (tls)   │  │
   │  │ RFC 1918 Filter │  │  ├─ HTTP Headers & Redirection   │  │
   │  │ Cloud Meta Gate │  │  ├─ DNS Records, SPF & DMARC     │  │
   │  └────────┬────────┘  │  └─ DNSSEC Authentication (DoH)  │  │
   │           │           └────────────────┬─────────────────┘  │
   │           ▼                            ▼                    │
   │  ┌───────────────────────────────────────────────────────┐  │
   │  │             100-Point Scoring Engine                  │  │
   │  │    SSL (25) + Headers (30) + DNS (25) + HTTPS (20)    │  │
   │  └──────────────────────────┬────────────────────────────┘  │
   └─────────────────────────────┼───────────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
   ┌───────────────────────────┐   ┌───────────────────────────┐
   │    SUPABASE POSTGRESQL    │   │   PDF GENERATION ENGINE   │
   │ Row Level Security (RLS)  │   │  jspdf + jspdf-autotable  │
   │ Scans & Results Tables    │   │  Confidential Exec Report │
   └───────────────────────────┘   └───────────────────────────┘
```

| Layer | Technologies | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS | High-performance, responsive dark-navy UI |
| **Data Viz** | Recharts, Lucide Icons | Posture progression, donut severity charts |
| **Backend** | Node.js native `tls`, `dns/promises`, `http` | Passive network inspections with 0 paid APIs |
| **Database** | Supabase (PostgreSQL free tier) | Audit logging with strict Row Level Security |
| **Auth** | Supabase Authentication / JWT | User sessions and private scan history |
| **SSRF Guard** | Custom CIDR / IP range validator | Total rejection of internal/private targets |
| **Reporting** | jsPDF, jspdf-autotable | High-res downloadable PDF executive reports |
| **Testing** | Vitest (25 Unit & Integration tests) | Strict test-driven verification |
| **Deployment**| Vercel | Instant global edge serverless deployment |

---

## 🚀 Getting Started

### Prerequisites

- Node.js `20.x` or `22.x` installed
- Git
- Free Supabase account ([supabase.com](https://supabase.com))

### 1. Clone the Repository

```bash
git clone https://github.com/hassan-the-hacker/sentinel-cybersecurity-health-monitor.git
cd sentinel-cybersecurity-health-monitor
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment template:

```bash
cp .env.example .env.local
```

Populate your `.env.local` credentials:

```ini
# Supabase Configuration (Free Tier: https://supabase.com)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

> **Note**: If Supabase keys are left blank during local evaluation, Sentinel operates in demonstration/offline mode using local browser storage and in-memory fallbacks, allowing recruiters and reviewers to test the complete application immediately!

### 4. Database Setup (Supabase SQL)

1. Open your Supabase project dashboard.
2. Navigate to **SQL Editor**.
3. Copy the contents of [`database/migrations/001_initial_schema.sql`](database/migrations/001_initial_schema.sql).
4. Run the script. It automatically provisions:
   - `users`, `scans`, and `scan_results` tables.
   - Performance indexes on `user_id`, `domain`, and `created_at`.
   - Full **Row Level Security (RLS)** policies.
   - Automatic user creation trigger from `auth.users`.

### 5. Run the Local Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Automated Testing

Sentinel includes a full test suite built with **Vitest** covering SSRF defense, 100-point scoring algorithm, DNS parsers, and HTTP security headers.

To execute all tests:

```bash
npm test
```

Test coverage includes:
- ✅ Private IPv4 / IPv6 range rejection (127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.169.254, Carrier-Grade NAT, Multicast).
- ✅ Hostname validation and DNS pre-resolution.
- ✅ Grading criteria (A+, A, B, C, D, F).
- ✅ 100-point boundary rules and negative deduction capping.
- ✅ SPF qualifier parsing (`-all`, `~all`, `+all`).
- ✅ DMARC policy parsing (`reject`, `quarantine`, `none`).
- ✅ Server banner version leakage identification.

---

## 🌐 Deploying to Vercel

Sentinel is designed for seamless deployment on Vercel's free hobby tier:

1. Push your repository to GitHub.
2. Log in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your `sentinel-cybersecurity-health-monitor` repository.
4. Add the environment variables from `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**. Vercel will build the Next.js application and deploy the serverless routes globally.

---

## 🔒 Security & Safe Scanning Policy

Sentinel performs **only passive, non-destructive, non-invasive security checks**.
- It does **not** perform intrusive port scanning.
- It does **not** execute fuzzing, brute force, or exploit payloads.
- It requires users to confirm explicit legal authorization before initiating any assessment.
- All outbound requests enforce short socket timeouts (8s) and strict redirect limits (5 hops).

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

