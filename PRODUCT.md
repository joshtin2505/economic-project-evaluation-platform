# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Professional and academic hybrid: Financial evaluators, project managers, corporate financial analysts, and engineering economics students & professors who require rigorous, verifiable mathematical project evaluation and clear executive reporting.

## Product Purpose
EconoLab is an engineering economics and investment project evaluation platform. It enables users to assess investment viability, compare mutually exclusive project alternatives, model risk scenarios and sensitivity, and track projects across their full lifecycle (preinversión, inversión, operación, liquidación) with auditable mathematical precision.

## Positioning
A pure-math, single-source-of-truth financial evaluation engine with auditable engineering economics formulas (NPV, IRR, B/C, Payback, TMAR/WACC, CAUE/BAUE, and pro-forma statements) coupled with multi-phase lifecycle tracking (CAPEX disbursements, actual vs. projected cash flows). Unlike generic spreadsheets or superficial budget trackers, EconoLab guarantees strict mathematical consistency, auditability, and full lifecycle tracking.

## Operating Context
- Web application used for project planning sessions, capital expenditure review meetings, financial thesis/coursework, and investment committee evaluations.
- Bilingual environment supporting both Spanish (`es`) and English (`en`) via `next-intl`.
- High-density data tables, financial charts (Recharts), and printable/exportable executive reports (PDF/Excel via jsPDF/html2canvas/xlsx).
- Multi-phase project lifecycle states: `preinversion`, `inversion`, `operacion`, and `liquidacion`.

## Capabilities and Constraints
- Mathematical purity: Calculation engines (`lib/engines/*`) are strictly decoupled from I/O, database, and UI logic.
- Input conventions: Rates are handled in percentages in DB/UI (`12` = 12%) and converted to decimals (`0.12`) strictly at the boundary of mathematical engines.
- Cash flow structure: Initial investment at `t=0`, operational cash flows `t>=1`, CAPEX investment disbursements allowed at `t<=0`.
- Data isolation: Full Row Level Security (RLS) on Postgres/Supabase tables cascaded via project ownership (`projects.user_id = auth.uid()`).
- Responsive web app built on Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui.

## Brand Commitments
- Name: **EconoLab**
- Brand Voice: Analytical, precise, trustworthy, professional, and accessible. No gimmicks, ungrounded buzzwords, or opaque calculations.
- Design Aesthetic: High-craft dashboard/data-tool aesthetic; clean typography, high legibility for numerical data, semantic financial color coding (positive/negative cash flows, risk grades).

## Evidence on Hand
- Canonical business logic specification: [`docs/domain/BUSINESS-LOGIC.md`](docs/domain/BUSINESS-LOGIC.md).
- System architecture & data model: [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md).
- Mathematical test fixtures and goldens: [`docs/ai/TESTING.md`](docs/ai/TESTING.md).

## Product Principles
1. **Mathematical Integrity First:** Results must match independent engineering economics benchmarks (Excel/hand calculation) to the penny. No ad-hoc formulas in UI components.
2. **Clarity Over Clutter:** Present complex financial metrics (IRR, NPV curves, sensitivity spiders, tornado charts) with immediate scanability and clear hierarchy.
3. **Full Lifecycle Continuity:** Projects evolve from evaluation to CAPEX disbursements to real-world operations; the interface supports comparing projected expectations against actuals.
4. **Accessible Rigor:** Sophisticated financial analysis made intuitive for both seasoned CFOs and engineering students without dumbing down the methodology.

## Accessibility & Inclusion
- WCAG 2.2 AA target compliance for all web interfaces.
- Keyboard accessible financial tables and modal dialogs.
- Clear color contrast and non-color-dependent indicators for financial variance (e.g., icons + text + semantic colors for positive/negative cash flows).
- Full bilingual parity across Spanish and English (no hardcoded strings).
