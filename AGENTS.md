# AGENTS.md — EconoLab

> Punto de entrada para cualquier agente de IA (Antigravity, Claude Code, Cursor, Codex…).
> Léelo completo antes de tocar código. Es corto a propósito; el detalle vive en `docs/`.

## 1. Qué es esto

Plataforma web para **evaluar proyectos de inversión** (VPN, TIR, B/C, Payback, TMAR, escenarios, sensibilidad,
financiamiento, depreciación, estados pro-forma, comparación de alternativas excluyentes).
Dominio: **ingeniería económica / evaluación financiera de proyectos**. Idioma de producto: ES + EN.

Stack: Next.js 16 (App Router) · React 19 · TypeScript · Supabase (Auth + Postgres + RLS) · next-intl · Tailwind v4 · shadcn/ui · Recharts · pnpm.

## 2. Mapa de lectura (orden obligatorio según la tarea)

| Si vas a… | Lee primero |
|---|---|
| Tocar **cualquier fórmula o cálculo** | [`docs/domain/BUSINESS-LOGIC.md`](docs/domain/BUSINESS-LOGIC.md) |
| Entender capas, datos, seguridad | [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md) |
| Desarrollar algo **de punto 0 a navegador** (runbook paso a paso) | [`docs/ai/DEVELOPMENT-LIFECYCLE.md`](docs/ai/DEVELOPMENT-LIFECYCLE.md) |
| **Probar** (código → BD/RLS → navegador), valores de oro, recorridos | [`docs/ai/TESTING.md`](docs/ai/TESTING.md) |
| Resumen corto de la metodología | [`docs/ai/WORKFLOW.md`](docs/ai/WORKFLOW.md) |
| Elegir qué skill invocar | [`docs/ai/SKILLS.md`](docs/ai/SKILLS.md) |
| Ver deuda conocida / riesgos | [`docs/ai/AI-READINESS-AUDIT.md`](docs/ai/AI-READINESS-AUDIT.md) |
| Crear una feature nueva | [`docs/templates/feature-spec.md`](docs/templates/feature-spec.md) |

Descubrimiento de código: usa primero el grafo (`codebase-memory-mcp`: `search_graph`, `trace_path`, `get_code_snippet`);
cae a grep solo para strings literales, config o archivos no-código.

## 3. Reglas de arquitectura (no negociables)

1. **`lib/engines/*` = matemática pura.** Sin I/O, sin Supabase, sin `Date.now()`, sin React. Entrada → salida. Toda fórmula nueva va aquí.
2. **`lib/services/*` = I/O con Supabase.** Aquí se leen/escriben datos y se **llaman** los engines. Nunca reimplementes una fórmula en un service o componente.
3. **`app/**/page.tsx` compone**; no calcula. La UI solo formatea y presenta.
4. **Una sola fuente de verdad por concepto.** Antes de escribir VPN/TIR/Payback, busca en `lib/engines/financial-engine.ts`.
5. **Unidades** (la causa nº1 de bugs): en BD y formularios las tasas están en **porcentaje** (`12` = 12 %); los engines reciben **decimales** (`0.12`).
   Convierte en el borde con `percentToDecimal` / `decimalToPercent` (`lib/utils/tmar.ts`). Nómbralo en el identificador (`ratePercent`, `rateDecimal`).
6. **Convención de periodos:** `t = 0` es la inversión inicial; los flujos operativos empiezan en `t = 1`; los desembolsos de inversión pueden ser `t < 0`.
7. **Seguridad:** toda tabla nueva lleva **RLS** con autorización en cascada vía `projects.user_id = auth.uid()`. Sin excepciones.
8. **Migraciones:** archivos nuevos e inmutables en `supabase/migrations/` (`YYYYMMDDHHMMSS_nombre.sql`). Nunca edites una migración ya aplicada. Cambios no destructivos.
9. **i18n:** ningún texto visible hardcodeado; claves en `messages/es.json` **y** `messages/en.json`.
10. **Tipos:** prohibido `any` en código nuevo; `zod` para validar entradas de mutaciones.
11. **Sin `console.log`** en código que se commitea.

## 4. Comandos

```bash
pnpm install
pnpm dev                    # servidor local
pnpm exec tsc --noEmit      # ← ÚNICA comprobación real de tipos hoy
pnpm build                  # compila; NO tipa (next.config.mjs: typescript.ignoreBuildErrors = true)
pnpm lint                   # no funciona aún: eslint no está instalado (ver AI-READINESS-AUDIT)
```

⚠️ `pnpm build` verde **no** prueba que los tipos estén bien. Hasta quitar `ignoreBuildErrors`, la evidencia de tipos es `tsc --noEmit`.
Tests y recorridos de navegador: [`docs/ai/TESTING.md`](docs/ai/TESTING.md). Si un runner aún no existe, **no declares "verificado"** sin evidencia (ver §6).

## 5. Flujo de trabajo (resumen de una línea por fase)

`Orientar → Especificar → Planear → Construir → Verificar → Revisar → Documentar`.
Detalle, skills por fase y criterios de salida en [`docs/ai/WORKFLOW.md`](docs/ai/WORKFLOW.md).

Reglas de oro de proceso:
- **Cambios pequeños y reversibles.** El *proceso* lo marcan las skills de `superpowers`; el *tamaño del diff* lo marca `ponytail`.
- **Preguntar > suponer** cuando la regla financiera es ambigua. No inventes criterios de ingeniería económica.
- **TDD para engines**: primero el test con un caso resuelto a mano, después el código.
- **No marques nada como hecho sin evidencia** (salida de `pnpm build`, tests, o verificación manual descrita).

## 6. Definición de "Hecho"

- [ ] `pnpm exec tsc --noEmit` sin errores **y** `pnpm build` OK (el build solo no tipa).
- [ ] Si tocaste UI o flujo: recorrido(s) de `docs/ai/TESTING.md` §8 ejecutados en navegador, ES y EN, con evidencia.
- [ ] Si tocaste un engine: test(s) con valor esperado calculado independientemente (calculadora/Excel) y casos borde (tasa 0, flujos vacíos, TIR sin solución).
- [ ] Si tocaste BD: migración nueva + RLS + probado que otro usuario no ve los datos.
- [ ] Textos en `es.json` y `en.json`.
- [ ] `docs/domain/BUSINESS-LOGIC.md` actualizado si cambió una regla o fórmula.
- [ ] Sin `any`, sin `console.log`, sin lógica duplicada.
- [ ] Mensaje de commit convencional (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`).

## 7. Cosas que un agente suele hacer mal aquí

- Pasar `12` a un engine que espera `0.12`.
- Calcular VPN "rápido" dentro de un componente en vez de importar el engine.
- Asumir que `projects.initial_investment` es la fuente de verdad del CAPEX: es un **resumen**; la fuente son `investment_disbursements`.
- Olvidar que `cash_flows` mezcla `flow_type = 'projected' | 'actual'`; filtra siempre.
- Creer lo que dice `implementation_plan.md` ("100 % completado") sin verificar: es un plan histórico, no evidencia.
- Dar por buena la UI porque `pnpm build` pasó: el build ignora errores de tipo y nada prueba el flujo en el navegador.
- Comparar un valor de pantalla contra el propio sistema en vez de contra un número calculado a mano (valores de oro en `TESTING.md` §3).
- Usar la **TMAR** y la **tasa de descuento** como sinónimos: el proyecto puede usar una u otra (`use_tmar_as_discount_rate`).
