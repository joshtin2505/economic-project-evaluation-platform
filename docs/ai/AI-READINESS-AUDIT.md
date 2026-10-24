# Auditoría: ¿qué tan listo está el repo para desarrollar con IA?

Fecha: 2026-10-24 · Alcance: lectura de estructura, engines, services, migraciones, config de agentes y git.
No se ejecutó `pnpm build` ni se probó contra Supabase: los hallazgos son de lectura de código.

## Veredicto

| Eje | Nota | Resumen |
|---|---|---|
| Estructura / separación de capas | **Buena (7/10)** | `engines/` puros + `services/` con I/O es una base excelente para IA |
| Legibilidad de la lógica de negocio | **Media-buena (6/10)** | Engines bien comentados en español con fórmula; pero hay lógica duplicada y unidades ambiguas |
| Red de seguridad (tests, lint, CI) | **Crítica (1/10)** | 0 tests, sin runner, `eslint` no instalado, sin CI |
| Contexto para agentes | **Era baja (3/10) → ahora media-alta** | Había 34 skills pero ningún `AGENTS.md`, ni docs de dominio. Resuelto con este paquete |
| Confiabilidad de la documentación previa | **Baja (3/10)** | README desactualizado; el plan se declara "100 %" sin evidencia |
| Orquestación de skills | **Era nula → definida** | Sin reglas de precedencia ni mapa tarea→skill. Ver `SKILLS.md` |

**Lectura corta:** el diseño favorece a la IA (módulos pequeños, funciones puras con nombres claros), pero sin tests un agente
no puede saber si rompió una fórmula. **El mayor multiplicador de calidad con IA ahora mismo es instalar tests de engines.**

## Lo que ya está bien

- Separación `engines` (puro) / `services` (I/O) / `app` (composición).
- Comentarios con fórmula y parámetros en `financial-engine.ts` y `tmar.ts`.
- RLS habilitado en todas las tablas, con autorización en cascada por `projects.user_id`.
- Migraciones versionadas, `IF NOT EXISTS`, `CHECK` constraints para enumeraciones.
- `lib/routes.ts` como fuente única de URLs.
- `skills-lock.json` commiteado ⇒ skills reproducibles.
- `.env` fuera del repo.

## Hallazgos priorizados

### P0 — Bloquean el desarrollo confiable con IA

| # | Hallazgo | Evidencia | Acción |
|---|---|---|---|
| 1 | **No hay tests** | 0 archivos `*.test.*`. El plan cita `npx vitest run` pero `vitest` no está en `package.json` | Instalar `vitest`; escribir tests de oro para `financial-engine`, `amortization`, `depreciation`, `tmar` (ejemplo en `BUSINESS-LOGIC.md` §4) |
| 2 | **`pnpm lint` no funciona y `pnpm build` no tipa** | Script `eslint .` pero `eslint` no está en dependencias. Además `next.config.mjs` tiene `typescript.ignoreBuildErrors: true`; `node_modules` estaba vacío al auditar, así que **no se pudo medir cuántos errores de tipo ocultos hay** | Instalar `eslint` + `eslint-config-next`; añadir script `typecheck` (`tsc --noEmit`); corregir errores y **quitar `ignoreBuildErrors`** |
| 3 | **Trabajo grande sin commitear** | `git status`: engines, services, 6 páginas y 3 migraciones nuevas sin trackear; `implementation_plan.md` sin trackear | Commitear por sprint (4 commits) para que `git log` sea historia real |
| 4 | **El plan afirma "100 % completado" sin verificación** | Todo `[x]`, pero "Verification Plan" nunca se ejecutó (no hay tests, no hay `db push --dry-run`) | Tratar el plan como histórico; ejecutar verificación y registrar evidencia |
| 5 | **Lógica de dominio dudosa: "FCL/FCFF"** | `generateFreeCashFlowStatement` parte de utilidad neta (ya neta de intereses) | Validar con experto; documentar criterio (`BUSINESS-LOGIC.md` §12) |

### P1 — Riesgo de bugs silenciosos

| # | Hallazgo | Evidencia | Acción |
|---|---|---|---|
| 6 | **TIR devuelve un valor aunque no converja** | `calculateIRR`: al terminar el bucle retorna `rate` si es finito, sin comprobar convergencia | Devolver `null` si no convergió; probar con semillas múltiples o bisección |
| 7 | **Matemática duplicada (3 copias)** | (a) `lib/engines/financial-engine.ts`; (b) `project-analytics.ts` (`buildVpnSteps`, `buildNpvVsRateData`, `buildTirIterations`, `estimatePaybackPeriod`); (c) `lib/hooks/useProjectForm.ts` `calculations` (bisección propia, descuenta con `index + 1` en vez de `flow.period`) | Dejar solo lo pedagógico (pasos de iteración) y delegar el cálculo al engine; test de coherencia UI↔engine (`TESTING.md` §7) |
| 8 | **Payback inconsistente entre módulos** | `alternatives-analysis` usa payback **descontado**; `project-analytics.estimatePaybackPeriod` usa **simple** | Definir cuál se muestra y etiquetarlo en UI |
| 9 | **Unidades % vs decimal** | BD/UI en %, engines en decimal; existe `asDecimal()` para normalizar `results.irr`, señal de ambigüedad histórica | Convención nombrada (`...Percent`/`...Decimal`) + migrar `results` a una sola unidad |
| 10 | **Análisis incremental con limitaciones** | `alternatives-analysis.ts`: vidas desiguales rellenan con 0; no compara contra "no hacer nada"; usa TIR incremental con semilla única | Documentar y, si aplica, normalizar con BAUE (ya existe el engine) |
| 11 | **Filtro PostgREST con input del usuario** | `fetchProjectBySearchTerm`: `.or(\`name.ilike.%${term}%,…\`)` interpola `term` sin escapar | Sanear `,`, `(`, `)` o usar `.ilike` por separado |
| 12 | **`"use server"` en archivos de services** | 8 services lo declaran: cada export es un endpoint público | Aceptable **solo** porque hay RLS; para mutaciones, mover a `lib/actions/` con validación `zod` y auth explícita |
| 13 | **Brecha BD ↔ engine** | `units_of_production` permitido por `CHECK` pero sin función en `depreciation-engine` | Quitar del `CHECK` o implementarlo |

### P2 — Deuda de mantenibilidad

| # | Hallazgo | Acción |
|---|---|---|
| 14 | `any` en `createProjectWithFlows`, `updateProjectWithFlows`, `funding_sources?: any[]`, mapeos `(f: any)` | Tipar con interfaces + `zod` |
| 15 | `console.log` en `projects.ts` (imprime payload y resultados de búsqueda) | Eliminar |
| 16 | `fetchProjectById` con fallback por error `42703` (columna inexistente) | Señal de drift de esquema: eliminar fallback ahora que la migración existe |
| 17 | N+1: `analyzeAlternativesInGroup` llama `fetchCashFlows` en bucles, repitiendo consultas | Cargar todos los flujos una vez (`in('project_id', ids)`) |
| 18 | `lib/routes.ts` conserva rutas `recurring*` de una feature eliminada | Borrar (código muerto engaña a la IA) |
| 19 | `README.md` desactualizado: menciona `supabase/schema.sql` (no existe; ahora son migraciones) y "lógica por endurecer" | Reescrito en este paquete |
| 20 | `package.json` `"name": "my-project"` | Renombrar a `econolab` |
| 21 | Sin CI | GitHub Action: `pnpm install` → `typecheck` → `lint` → `test` → `build` |
| 22 | `tsconfig.tsbuildinfo` versionado | Añadir a `.gitignore` |
| 23 | Plan dice "cálculos pesados en Server Actions/Edge, nunca en cliente"; el hook `useProjectForm` y el preview calculan en cliente | Decidir criterio: indicadores livianos en cliente están bien; lote (360 cuotas × N) en servidor |

| 24 | **Seed no determinista** | `20260613191410_seed_data.sql` usa el primer `user_profiles` (`LIMIT 1`) | No usarlo como fixture de pruebas; crear datos de recorrido por UI o script propio |
| 25 | **Skills clave solo en plugin global** | `test-driven-development`, `verification-before-completion`, `using-git-worktrees`, `finishing-a-development-branch`, `dispatching-parallel-agents` no están en `.agents/skills/` | Instalarlas localmente (`DEVELOPMENT-LIFECYCLE.md` §Qué instalar) |
| 26 | **`agent-browser` sin CLI** | La skill está instalada; el comando `agent-browser` no existe en el PATH | `npm i -g agent-browser && agent-browser install` |

## Riesgos específicos de IA (qué suele salir mal aquí)

1. **Confundir 12 con 0.12.** Mitigación: nombres con unidad + tests.
2. **Inventar una fórmula en lugar de reutilizar la del engine.** Mitigación: regla 4 de `AGENTS.md` + `search_graph` en Fase 0.
3. **Declarar "hecho" por confiar en el plan.** Mitigación: Definición de Hecho con evidencia.
4. **Elegir skill equivocada** entre 36 (y duplicadas con el plugin global). Mitigación: `SKILLS.md`.
5. **Editar una migración aplicada.** Mitigación: regla 8.

## Plan de adopción (orden sugerido, ~1 día)

| Paso | Esfuerzo | Efecto |
|---|---|---|
| 1. Commitear lo pendiente + este paquete de docs | 15 min | Historia limpia, contexto disponible |
| 2. Instalar `vitest` + `eslint` + script `typecheck`; medir y corregir errores de tipo; quitar `ignoreBuildErrors` | 30 min + corrección | Red de seguridad real |
| 3. Tests de oro: financial-engine, tmar, amortization, depreciation | 2–3 h | Un agente ya puede refactorizar sin miedo |
| 4. Corregir #6 (TIR) y #15–#18 (limpieza rápida) | 1 h | Menos ruido y bugs |
| 5. Resolver #5 (FCL) con criterio financiero y actualizar docs | variable | Corrección de dominio |
| 6. CI mínimo | 30 min | Cierra el ciclo de verificación |
| 7. Generar `graphify` y registrar el MCP de grafo | 15 min | Orientación más rápida (Fase 0) |
| 8. Instalar `agent-browser` (CLI) y las skills P0 locales; ejecutar J1–J3 de `TESTING.md` | 30 min | Verificación en navegador habilitada |

## Qué NO se tocó

No se modificó código de aplicación ni dependencias. Solo se añadieron/actualizaron documentos. Las correcciones de arriba son recomendaciones para ejecutar con la metodología de `WORKFLOW.md`.
