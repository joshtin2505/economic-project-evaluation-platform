# Spec — Auditoría Financiera, Consolidación de Funciones y Rediseño Integral (Precision Financial Workbench)

> Spec generada tras auditoría de código (`ponytail-audit`), diseño (`design-taste-frontend`) y entrevista de decisiones (`/grill-me` + `brainstorming`).
> Plan derivado: [`../plans/2026-10-24-econolab-master-plan.md`](../plans/2026-10-24-econolab-master-plan.md).

- **Estado:** aprobada en `/grill-me`
- **Autor / fecha:** Antigravity + Usuario / 2026-10-24
- **Skills usadas:** `ponytail-audit`, `brainstorming`, `grill-me`, `design-taste-frontend`, `writing-plans`

---

## 1. Problema

EconoLab cuenta con motores financieros avanzados (VPN, TIR, B/C, Payback, WACC, Amortización, Depreciación, Pro-Forma FCFF/FCFE/BAUE, Escenarios y Sensibilidad 1D/2D), pero presenta cuatro brechas críticas:
1. **Riesgos de integridad financiera:** `fetchCashFlows` mezcla flujos `projected` y `actual` una vez que se usa el módulo de Control; las fórmulas de VPN/TIR/Payback/IR están duplicadas y divergen en 4 archivos; el `FCFF` parte de la Utilidad Neta (apalancada) en lugar de $\text{EBIT}(1-T)$ e ignora la recuperación del valor de salvamento en $t=n$; y el comparador de alternativas con distinta vida útil rellena con ceros en vez de decidir mediante `BAUE`.
2. **Funciones y tablas desconectadas:** Existen capacidades construidas pero sin conectar (`calculateNPVWithDisbursements`, `calculateIRRWithDisbursements`, `updateAsset`, `updateLoan`, `updateProjectGroup`, `project_snapshots`, `chart_of_accounts`, `projects.phase`, `/dashboard/tmar`) junto con código muerto (`routes.recurring*`, `generateAssetDepreciationSummary`, `calculateTotalActualInvestment`).
3. **Arquitectura de información fragmentada:** Los 7 módulos del ciclo de vida de un proyecto están escondidos dentro del menú `...` de la tabla de proyectos, sin un Workspace unificado en `/dashboard/projects/[id]`.
4. **Interfaz con patrones genéricos ("AI-slop") e i18n incompleto:** La Landing Page usa gradientes en títulos, esferas difuminadas (`blur-[120px]`) y barras estáticas falsas sin mostrar la verdadera potencia de EconoLab; el Dashboard repite la lista de proyectos dos veces en `/dashboard/projects`, grafica un `"Projected NPV"` ficticio (`runningTotal * 1.08`), y tiene textos hardcodeados en español en las 7 páginas avanzadas.

---

## 2. Alcance

### Entra (Plan Integral en 4 Fases):
- **Fase 1 (Core Financiero y Limpieza):**
  - Filtrar `flow_type = 'projected'` por defecto en `fetchCashFlows(projectId, flowType = 'projected')`.
  - Unificar todos los cálculos en `lib/engines/financial-engine.ts` eliminando las reimplementaciones manuales en `useProjectForm.ts`, `portfolio-analytics.ts` y `project-analytics.ts`.
  - Estandarizar `FCFF` desapalancado ($\text{EBIT}(1-T) + \text{Depreciación} - \text{CAPEX} - \Delta\text{WK} + \text{Salvamento}_n$), exponer ambos Paybacks (`simplePayback` y `discountedPayback`) e $\text{IR} = 1 + \frac{\text{VPN}}{I_0}$.
  - Conectar `calculateNPVWithDisbursements` y `calculateIRRWithDisbursements` cuando un proyecto tenga desembolsos CAPEX en $t < 0$ o $t > 0$.
  - Soportar selector de fuente de tasa de descuento del proyecto (`manual` | `tmar` | `wacc`) centralizado en `getEffectiveDiscountRate`.
  - Usar `BAUE` (`calculateEquivalentAnnualWorth`) como criterio ganador en `alternatives-analysis.ts` cuando los proyectos comparados tengan diferente horizonte `periods`.
  - Eliminar código muerto (`routes.recurring*`, `generateAssetDepreciationSummary`, `calculateTotalActualInvestment`).
- **Fase 2 (Arquitectura de Información y Workspace Unificado):**
  - Crear el **Project Workspace** en `/dashboard/projects/[id]` con encabezado de ciclo de vida (selector de `phase` y `lifecycle_status`, KPIs en vivo, fuente de tasa) y navegación por pestañas hacia todos los módulos del proyecto (`Resumen`, `Flujos & CAPEX`, `Activos`, `Financiamiento & WACC`, `Pro-Forma`, `Escenarios & Sensibilidad`, `Control & Snapshots`).
  - Reestructurar `components/dashboard/app-sidebar.tsx` en dos niveles: *Portafolio* (`Resumen`, `Proyectos`, `Alternativas`, `Reportes`), *Proyecto Activo* (contextual cuando se navega en `/dashboard/projects/[id]/**`) y sección colapsable *Laboratorio Pedagógico* (`VPN`, `TIR`, `TMAR`, `Costo-Beneficio`, `Flujo de Caja`).
- **Fase 3 (Rediseño Visual "Precision Financial Workbench" + i18n 100 %):**
  - Rediseñar la Landing Page (`app/page.tsx`, `components/landing/*`) bajo dirección **Precision Financial Workbench**: tipografía técnica y editorial sin gradientes ni blobs, **Simulador Financiero Interactivo en vivo en el Hero** (conectado directamente a `lib/engines/financial-engine.ts` con sliders de Tasa/WACC, Variación de Ingresos y CAPEX), y vitrina interactiva de módulos reales (Pro-Forma FCFF/FCFE, Tornado 1D, Matriz de Sensibilidad 2D y WACC).
  - Rediseñar el Dashboard bajo el paradigma **Framed Sheet** (`references/app-screens.md`): barra lateral sobre lienzo sutil, hoja de contenido enmarcada con bordes `1px`, tipografía monoespaciada `tabular-nums` en todas las cifras monetarias/porcentuales, eliminación de la vista duplicada en `/dashboard/projects` (conmutador limpio Tabla / Tarjetas), eliminación de la serie falsa `runningTotal * 1.08`, y traducción completa en `messages/es.json` y `messages/en.json`.
- **Fase 4 (Conexión de Funcionalidades Huérfanas de Alto Valor):**
  - Conectar en la UI los modales de edición para `updateAsset` (`/assets`), `updateLoan` (`/financing`) y `updateProjectGroup` (`/alternatives`).
  - Conectar el catálogo `chart_of_accounts` mediante un selector buscable de cuentas PUC en desembolsos, activos y préstamos.
  - Conectar `project_snapshots` (`lib/services/snapshots.ts` + UI en `/control` y Workspace) para crear instantáneas inmutables ("Congelar Línea Base") y compararlas contra el estado actual.

### NO entra:
- Depreciación por unidades de producción (`units_of_production`) al requerir tablas adicionales de telemetría física de unidades por periodo (se limpia del union type hasta que exista requerimiento).
- Persistencia fila por fila en `scenario_cash_flows` y `sensitivity_variables` (el motor funcional paramétrico en `scenarios.parameters` es más limpio, rápido y sin desincronización; se documentan como tablas deprecadas).

---

## 3. Reglas de Dominio

Todas las tasas en Base de Datos y formularios se expresan en **porcentaje** (`12` = 12 %) y se convierten en el borde con `percentToDecimal` (`0.12`) antes de entrar a `lib/engines/*`.

### 3.1. Flujo de Caja Libre de la Firma (`FCFF`) y del Accionista (`FCFE`)
Para cada periodo operativo $t \in \{1, \dots, n\}$:

$$
\text{NOPAT}_t = \text{EBIT}_t - \text{Tax}_t^{\text{unlevered}}, \quad \text{donde } \text{Tax}_t^{\text{unlevered}} = \max(0, \text{EBIT}_t \cdot \tau)
$$

$$
\text{FCFF}_t = \text{NOPAT}_t + \text{Dep}_t - \text{CAPEX}_t - \Delta\text{WK}_t + \text{Salvamento}_t
$$

Donde $\text{Salvamento}_t$ es la suma de `salvage_value` de los activos fijos cuya vida útil termina o se liquida en $t = n$.
Para el accionista (`FCFE`), partiendo de la utilidad neta apalancada $\text{NetIncome}_t = \text{EBT}_t - \max(0, \text{EBT}_t \cdot \tau)$:

$$
\text{FCFE}_t = \text{NetIncome}_t + \text{Dep}_t - \text{CAPEX}_t - \Delta\text{WK}_t + \text{ Salvamento}_t - \text{PrincipalPagado}_t + \text{NuevaDeuda}_t
$$

### 3.2. Ejemplo numérico resuelto a mano (Golden Value para test de `FCFF` y `FCFE`)
| Entrada | Valor |
|---|---|
| Periodo $t = 1$ (último periodo $n = 1$) | Ingresos = `1000`, Costos = `400`, Depreciación = `100` |
| Intereses deuda (`interestExpense`) | `50` |
| Amortización principal (`principalPayment`) | `80` |
| Tasa impositiva $\tau$ (`taxRateDecimal`) | `0.30` (30 %) |
| CAPEX en $t = 1$ | `0`, $\Delta\text{WK}_1 = 0$, Valor de salvamento en $t = 1$ = `40` |

**Cálculo manual esperado:**
- $\text{EBITDA}_1 = 1000 - 400 = 600$
- $\text{EBIT}_1 = 600 - 100 = 500$
- $\text{NOPAT}_1 = 500 - (500 \times 0.30) = 350$
- $\text{FCFF}_1 = 350 + 100 - 0 - 0 + 40 = 490$
- $\text{EBT}_1 = 500 - 50 = 450 \implies \text{Impuesto Apalancado}_1 = 450 \times 0.30 = 135 \implies \text{NetIncome}_1 = 315$
- $\text{FCFE}_1 = 315 + 100 - 0 - 0 + 40 - 80 + 0 = 375$
*(Verificación de consistencia financiera: $\text{FCFF}_1 - \text{FCFE}_1 = 490 - 375 = 115 = \text{Intereses}(1 - \tau) + \text{Principal} = 50(0.70) + 80 = 35 + 80 = 115$. Exacto.)*

### 3.3. Ambos Paybacks e Índice de Rentabilidad (IR)
- **Payback Simple (`calculateSimplePayback`):** Primer periodo fraccionario donde $\sum_{t=1}^k F_t \ge I_0$ sin descontar.
- **Payback Descontado (`calculatePayback`):** Primer periodo fraccionario donde $\sum_{t=1}^k \frac{F_t}{(1+r)^t} \ge I_0$.
- **Índice de Rentabilidad (`calculateProfitabilityIndex`):**
  $$\text{IR} = 1 + \frac{\text{VPN}}{I_0} = \frac{\text{VP}(\text{Flujos Netos})}{I_0}$$

### 3.4. Comparación de Alternativas con Vida Útil Desigual
- Si todos los proyectos del grupo tienen igual `periods`, el criterio de decisión primario es $\text{VPN}$ validado con el análisis incremental $\Delta\text{VPN}$ y $\Delta\text{TIR}$ par a par.
- Si los proyectos tienen distinto `periods` (`hasUnequalLifespans = true`), el comparador evalúa cada proyecto con su horizonte original y selecciona la alternativa ganadora por mayor **BAUE** (`calculateEquivalentAnnualWorth(npv, commonRateDecimal, project.periods)`), mostrando explícitamente en la UI la advertencia metodológica de vidas desiguales.

### 3.5. Casos borde obligatorios
- $r = 0$: `calculateEquivalentAnnualWorth(npv, 0, n)` retorna `npv / n`; `calculateNPV` suma flujos sin descontar.
- $I_0 = 0$: `calculateProfitabilityIndex` retorna `0` (evita `Infinity` / `NaN`).
- Flujos sin cambio de signo: `calculateIRR` y `calculateIRRWithDisbursements` retornan `{ irr: 0, converged: false }`.
- $\text{EBIT}_t < 0$: Impuesto desapalancado es `0` (sin crédito fiscal instantáneo salvo pérdida operativa neta explícita).

---

## 4. Datos y Migraciones

Nueva migración no destructiva: `supabase/migrations/20261024140000_discount_rate_source_and_cleanup.sql`:
1. Añadir columna `discount_rate_source TEXT NOT NULL DEFAULT 'manual' CHECK (discount_rate_source IN ('manual', 'tmar', 'wacc'))` a `public.projects` (manteniendo compatibilidad con `use_tmar_as_discount_rate`).
2. Asegurar políticas RLS de lectura/escritura en `public.project_snapshots` y lectura autenticada en `public.chart_of_accounts`.

---

## 5. Superficie

| Capa | Archivo(s) |
|---|---|
| Engines | `lib/engines/financial-engine.ts`, `lib/engines/depreciation-engine.ts` + tests `lib/engines/*.test.ts` |
| Services | `lib/services/projects.ts`, `lib/services/project-analytics.ts`, `lib/services/portfolio-analytics.ts`, `lib/services/pro-forma.ts`, `lib/services/alternatives-analysis.ts`, `lib/services/disbursements.ts`, `lib/services/snapshots.ts` (nuevo), `lib/services/chart-of-accounts.ts` (nuevo) |
| Hooks / Utils | `lib/hooks/useProjectForm.ts`, `lib/routes.ts`, `lib/utils/get-breadcrumbs.ts` |
| Workspace & UI | `app/dashboard/projects/[id]/layout.tsx` (nuevo), `app/dashboard/projects/[id]/page.tsx` (nuevo), `components/dashboard/project-workspace-header.tsx` (nuevo), `components/dashboard/app-sidebar.tsx`, `app/dashboard/page.tsx`, `app/dashboard/projects/page.tsx`, `app/page.tsx`, `components/landing/*` |
| i18n | `messages/es.json`, `messages/en.json` |

---

## 6. Criterios de Aceptación (Medibles)

- [ ] **L1 (Engines):** Todos los tests en `pnpm test` (`vitest`) pasan incluyendo el caso dorado de `FCFF = 490` / `FCFE = 375`, `calculateSimplePayback`, `calculateNPVWithDisbursements` y `BAUE` en vidas desiguales.
- [ ] **L2 (Servicios e Integridad):** Registrar un flujo `actual` en `/control` no altera el VPN proyectado ni duplica periodos en `/pro-forma`, `/scenarios` ni `/dashboard/projects/[id]/edit`.
- [ ] **L3 (Tipos y Build):** `pnpm exec tsc --noEmit` con 0 errores y `pnpm build` exitoso.
- [ ] **L4 (UI e i18n):** Cero textos hardcodeados en español en páginas del dashboard; cambio de idioma `ES ↔ EN` traduce tanto la Landing (incluyendo el simulador interactivo) como el Project Workspace y sus 7 pestañas.

### Recorrido de navegador esperado (L4)
| Paso | Acción del usuario | Valor/estado visible esperado |
|---|---|---|
| 1 | Abrir `/` (Landing Page) y mover el slider de Tasa de Descuento en el Hero de `10 %` a `15 %` | El VPN, el gráfico de flujo acumulado y la tabla resumida se actualizan instantáneamente con `tabular-nums` sin recargar |
| 2 | Entrar a `/dashboard/projects` y hacer clic en un proyecto | Navega al nuevo Workspace `/dashboard/projects/[id]` con encabezado de ciclo de vida, selector de fase, fuente de tasa (`Manual / TMAR / WACC`) y barra de pestañas |
| 3 | Ir a la pestaña `Activos` o `Financiamiento` y hacer clic en `Editar` sobre un registro existente | Abre el modal precargado, guarda cambios vía `updateAsset` / `updateLoan` y recalcula depreciación/WACC |
| 4 | Ir a `Control & Snapshots` y pulsar `"Congelar Línea Base"` | Crea un registro en `project_snapshots` y muestra la comparativa entre la línea base congelada y los indicadores actuales |
