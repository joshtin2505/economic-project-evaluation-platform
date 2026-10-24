# EconoLab

Plataforma para **evaluación de proyectos de inversión**: VPN, TIR, B/C, Payback, TMAR, comparación de alternativas excluyentes,
cronograma de inversión, control real vs proyectado, escenarios y sensibilidad, financiamiento, depreciación y estados pro-forma.

**Stack:** Next.js 16 · React 19 · TypeScript · Supabase (Auth, Postgres, RLS) · next-intl · Tailwind v4 · shadcn/ui · Recharts.

## Inicio rápido

```bash
pnpm install
cp .env.example .env.local     # completar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
pnpm dev
```

Base de datos: el esquema vive en `supabase/migrations/` (fuente de verdad). Aplícalo con la CLI de Supabase:

```bash
supabase link --project-ref <ref>
supabase db push
```

En *Authentication → Providers* habilita Email. Regístrate en `/auth`. El `dashboard` exige sesión (`proxy.ts`) y las tablas aíslan datos por usuario con RLS.

## Verificación

```bash
pnpm exec tsc --noEmit   # tipos reales
pnpm build               # compila (no tipa: next.config.mjs tiene ignoreBuildErrors)
```

Estrategia completa de pruebas (código → BD/RLS → navegador): [`docs/ai/TESTING.md`](docs/ai/TESTING.md).

## Arquitectura en una mirada

- `lib/engines/` — matemática financiera **pura** (sin I/O).
- `lib/services/` — acceso a Supabase; orquesta los engines.
- `app/` — páginas (composición). `components/` — UI.
- Idioma: cookie `locale` (ES/EN) vía `next-intl`; sin segmento `[locale]` en la URL.

## Documentación

Todo está indexado en [`docs/README.md`](docs/README.md):

- Lógica de negocio y fórmulas → [`docs/domain/BUSINESS-LOGIC.md`](docs/domain/BUSINESS-LOGIC.md)
- Arquitectura y datos → [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md)
- **Desarrollo con IA** (runbook de 0 a navegador, skills) → [`docs/ai/DEVELOPMENT-LIFECYCLE.md`](docs/ai/DEVELOPMENT-LIFECYCLE.md) y [`AGENTS.md`](AGENTS.md)
- Diagnóstico y deuda conocida → [`docs/ai/AI-READINESS-AUDIT.md`](docs/ai/AI-READINESS-AUDIT.md)
