# Estrategia de pruebas — EconoLab

De la función pura al clic en el navegador. Complementa la etapa **S6/S7** de [`DEVELOPMENT-LIFECYCLE.md`](DEVELOPMENT-LIFECYCLE.md).
Principio: **cada valor se compara contra un número calculado a mano, nunca contra el propio sistema.**

## 1. Pirámide y estado actual

| Nivel | Qué prueba | Dónde | Estado hoy |
|---|---|---|---|
| **L0** Estático | Tipos, lint | `tsc --noEmit`, `eslint` | ⚠️ `typecheck` no existe; `eslint` no instalado; `next build` **ignora** errores de tipo |
| **L1** Unitario | Engines puros (`lib/engines/*`, `lib/utils/tmar.ts`) | `vitest` | ❌ sin runner, 0 tests |
| **L2** Datos / RLS | Migraciones, aislamiento por usuario | Supabase CLI / pgTAP / script con 2 sesiones | ❌ no automatizado |
| **L3** Integración | Service + engine + BD de pruebas; coherencia UI↔engine | `vitest` | ❌ |
| **L4** Navegador | Recorridos de usuario con valores visibles | `agent-browser` (guiado) · Playwright (CI) | ❌ CLI no instalado |
| **L5** No funcional | Consola, red, a11y, rendimiento, i18n | `chrome-devtools`, `a11y-debugging`, `debug-optimize-lcp` | 🌐 plugin global disponible |

Cuánto de cada nivel: **muchos L1** (baratos, deterministas), pocos L3, **recorridos L4 solo de los flujos críticos**.
Un bug se cubre con un test en el **nivel más bajo que pueda detectarlo**.

## 2. Convenciones de test

- Ubicación: junto al código (`lib/engines/financial-engine.test.ts`).
- Nombre: `describe('calculateNPV')` → `it('1000 y 3×500 al 10 % ⇒ 243.43')`.
- Cada test numérico cita su **fuente de verdad** (Excel, calculadora, referencia) en un comentario de una línea.
- Tolerancia: `toBeCloseTo(valor, 2)` para dinero, `toBeCloseTo(valor, 4)` para tasas decimales.
- Los tests de engines **no** mockean nada (son puros). Si necesitas un mock, la lógica está en la capa equivocada.

## 3. Valores de oro (reutilízalos en L1, L3 y L4)

### 3.1 Proyecto dorado `P-ORO`

Datos: inversión `1000`, 3 periodos, flujo neto `500` en `t=1..3` (inflow 500, outflow 0), tasa de descuento `10 %`.

| Indicador | Valor |
|---|---|
| VPN | **243.43** |
| TIR | **23.38 %** |
| B/C | **1.2434** (VP beneficios 1243.43 / costos 1000) |
| Índice de rentabilidad | **1.2434** |
| Payback simple | **2.0** |

Cálculo: `500·(1/1.1 + 1/1.1² + 1/1.1³) = 500·2.486852 = 1243.43`.

### 3.2 Alternativas excluyentes (`P-ORO` vs `P-ALT`)

`P-ALT`: inversión `1500`, flujo neto `750` en `t=1..3`.

| Tasa del grupo | VPN `P-ORO` | VPN `P-ALT` | ΔVPN (ALT − ORO) | Recomendada |
|---|---|---|---|---|
| 10 % | 243.43 | 365.14 | **121.71** | `P-ALT` |
| 12 % (por defecto del grupo) | 200.92 | 301.37 | **100.46** | `P-ALT` |

ΔInversión = 500; ΔTIR = 23.38 %.

### 3.3 Otros valores de referencia

| Módulo | Entrada | Resultado esperado |
|---|---|---|
| Amortización francesa | 100 000 · 12 % · 5 años | Cuota **27 740.97**; año 1: interés 12 000, capital 15 740.97 |
| Amortización alemana | 100 000 · 12 % · 5 años | Capital fijo 20 000; cuotas 32 000 → 22 400 (decreciente) |
| Amortización americana | 100 000 · 12 % · 5 años | Intereses 12 000/año; capital 100 000 en el último periodo |
| Depreciación línea recta | costo 100 000 · salvamento 10 000 · vida 5 | **18 000**/año; valor en libros final 10 000 |
| Suma de dígitos | mismos datos | Año 1 = 90 000·5/15 = **30 000** |
| TMAR simple | inflación 5 % · riesgo 4 % | `0.05 + 0.04 + 0.002 =` **9.20 %** |
| TMAR mixta | 40 %×15 + 45 %×10 + 15 %×12 | `6 + 4.5 + 1.8 =` **12.30 %** |
| VPN esperado | VPN 100/200/300 con prob. 25/50/25 | **200** |
| BAUE | VPN 243.43 · 10 % · 3 periodos | `243.43·0.402115 =` **97.89** |

### 3.4 Casos borde (obligatorios en cada engine)

| Caso | Esperado |
|---|---|
| Tasa `0` | VPN = suma simple; BAUE = VPN/n; sin NaN |
| Flujos vacíos | VPN = −inversión; TIR `null`; payback `null` |
| TIR sin solución (todos los flujos negativos) | `null`, no un número |
| Tasa ≤ −1 | Lanza error (ya implementado en `calculateNPV`) |
| Inversión 0 | Índice de rentabilidad 0, sin división por cero |
| Periodos negativos (desembolsos) | `calculateNPVWithDisbursements` capitaliza `t<0` |
| Flujos con cambio de signo múltiple | TIR no única: documentar qué devuelve |

## 4. L0 — Estático

```bash
pnpm typecheck     # tsc --noEmit  (crear script; hoy no existe)
pnpm lint          # eslint . (instalar eslint)
```

Mientras exista `ignoreBuildErrors: true`, **`pnpm build` no es evidencia de tipos correctos**.
Plan: ejecutar `tsc --noEmit`, corregir los errores y quitar el flag de `next.config.mjs`.

## 5. L1 — Unitario (engines)

```bash
pnpm test                  # vitest run
pnpm test -- financial     # filtrar
```

Orden de prioridad para la primera tanda de tests (más riesgo / más usado primero):

1. `financial-engine`: VPN, TIR, B/C, payback, IR, BAUE, pro-forma.
2. `lib/utils/tmar.ts`: ambos métodos y `resolveProjectTmarPercent`.
3. `amortization-engine`: francés, alemán, americano, con y sin gracia.
4. `depreciation-engine`: los tres métodos.
5. `scenario-engine` y `sensitivity-engine`: VPN esperado, CV, punto de equilibrio.
6. `wacc-engine`.

**Test de caracterización antes de refactorizar:** si vas a unificar `project-analytics.ts` / `useProjectForm.ts` con el engine, primero fija con tests el resultado actual del engine y de la copia; luego la copia debe dar lo mismo.

## 6. L2 — Datos y RLS

### Migración
```bash
supabase db push --dry-run
```
Reglas: archivo nuevo e inmutable, `IF NOT EXISTS`, `CHECK` para enumeraciones, índice en cada FK, RLS habilitado.

### Aislamiento entre usuarios (obligatorio por tabla nueva)

Procedimiento mínimo (manual o automatizable con dos sesiones de `supabase-js`):

1. Usuario **A** crea un proyecto con datos en la tabla nueva.
2. Usuario **B** (sesión distinta) intenta: `select` de esa fila, `update`, `delete` e `insert` con el `project_id` de A.
3. Esperado: `select` vacío; `update/delete` afectan 0 filas; `insert` rechazado por la política.
4. Para tablas hijas profundas (`loan_amortization`, `asset_depreciation`, `scenario_cash_flows`) repetir con el id del hijo.

Automatizado: `supabase test db` (pgTAP) con `set local role authenticated` + `request.jwt.claims` por usuario.

### Datos de prueba
- Dos usuarios fijos `test-a@…` y `test-b@…` en el proyecto Supabase **de pruebas**.
- ⚠️ `20260613191410_seed_data.sql` toma **el primer `user_profiles`** que encuentra; no es determinista. No lo uses como fixture de pruebas: crea los datos del recorrido por UI o con un script propio.
- Nunca ejecutar pruebas contra producción.

## 7. L3 — Integración

- Services (`lib/services/*`) contra la BD de pruebas con sesión de un usuario de prueba.
- **Coherencia UI↔engine:** hoy la vista previa del formulario (`useProjectForm.ts`, bisección con `index+1`) y `project-analytics.ts` reimplementan VPN/TIR. Test: para `P-ORO` los tres caminos (engine, preview, analytics) devuelven VPN 243 y TIR 23.38 %. Si difieren, gana el engine.
- `syncProjectInitialInvestment`: `projects.initial_investment` = suma de `planned_amount` de desembolsos.
- `flow_type`: ninguna consulta de proyectado mezcla flujos `actual`.

## 8. L4 — Recorridos en navegador

Preparación: `pnpm dev` con `.env.local` de pruebas. Con `agent-browser`: `agent-browser skills get core` (flujo base) y `agent-browser skills get dogfood` (exploración/QA).

> **Antigravity en Windows:** un servidor iniciado dentro del sandbox solo es alcanzable desde el mismo comando. Para que el navegador lo vea, levanta `pnpm dev` como proceso en segundo plano **fuera** del sandbox (o arranca servidor y prueba en un único comando).

Cada recorrido se ejecuta en **ES y EN**. Marca ✔/✘ y adjunta captura del paso decisivo.

### Catálogo

| ID | Recorrido | Ruta(s) | Pasos clave | Resultado esperado (valor visible) |
|---|---|---|---|---|
| **J1** | Sesión y protección | `/dashboard`, `/auth` | Sin sesión abrir `/dashboard` → registrarse/iniciar sesión → cerrar sesión | Redirige a `/auth`; tras login llega a `/dashboard`; con sesión `/auth` redirige a `/dashboard` |
| **J2** | Crear proyecto dorado | `/dashboard/projects/new` | Nombre `P-ORO`, inversión 1000, 3 periodos, tasa 10 %, inflow 500 en t=1..3, guardar | Vista previa: VPN **243**, TIR **23,38 %**, "viable"; aparece en `/dashboard/projects` |
| **J3** | Indicadores del proyecto | `/dashboard/vpn`, `/tir`, `/benefit-cost`, `/cash-flow` | Seleccionar `P-ORO` | VPN 243 · TIR 23,38 % · B/C 1,24 · acumulado cruza 0 en t=2 |
| **J4** | Editar y recalcular | `/dashboard/projects/[id]/edit` | Cambiar tasa a 12 % y guardar | VPN **200,92**; los demás indicadores cambian coherentemente |
| **J5** | TMAR como tasa | `/dashboard/tmar`, formulario | Método simple: inflación 5 %, riesgo 4 %; activar "usar TMAR como tasa" | TMAR **9,20 %**; el VPN usa 9,20 % y no la tasa manual |
| **J6** | Alternativas | `/dashboard/alternatives`, `/[groupId]` | Crear `P-ALT` (1500; 750×3), grupo con ambos, tasa del grupo 12 % | Recomendada `P-ALT`; ΔVPN **100,46**; paso incremental "cambiar a P-ALT" |
| **J7** | Inversión por cronograma | `/dashboard/projects/[id]/investment` | Dos desembolsos planificados 600 y 400 | Total planificado **1000**; `initial_investment` del proyecto = 1000; % avance acorde a lo ejecutado |
| **J8** | Real vs proyectado | `/dashboard/projects/[id]/control` | Registrar flujo real t=1 = 400 (proyectado 500) | Varianza de magnitud 100 y **20 %**; alerta si supera el umbral |
| **J9** | Escenarios y sensibilidad | `/dashboard/projects/[id]/scenarios` | Crear optimista/pesimista/esperado con probabilidades que sumen 100 | VPN esperado = Σ p·VPN verificado a mano; tornado y mapa de calor renderizan |
| **J10** | Financiamiento | `/dashboard/projects/[id]/financing` | Crédito 100 000 · 12 % · 5 periodos · francés | Cuota **27 740,97**; interés año 1 **12 000**; saldo final 0 |
| **J11** | Activos y depreciación | `/dashboard/projects/[id]/assets` | Activo 100 000 · salv. 10 000 · vida 5 · línea recta | **18 000**/año; valor en libros final **10 000** |
| **J12** | Pro-forma | `/dashboard/projects/[id]/pro-forma` | Con ingresos, costos, depreciación e interés conocidos | EBITDA→EBIT→EBT→impuesto 35 %→utilidad neta cuadran a mano; alternar con/sin financiamiento |
| **J13** | Aislamiento | URL directa | Con sesión de **B**, abrir `/dashboard/projects/<id de A>/edit` | No muestra datos de A (vacío/404/error controlado) |
| **J14** | Idioma | cualquier página | Cambiar ES↔EN con el selector; recargar | Textos traducidos, sin claves crudas (`preview.npv`), el idioma persiste (cookie `locale`) |

**Humo mínimo en toda feature:** J1 + J2 + J3 + el recorrido propio de la feature.
**Mínimo para automatizar primero con Playwright:** J1, J2, J3.

### Verificaciones transversales en cada recorrido (L5)

| Chequeo | Criterio |
|---|---|
| Consola | 0 errores y 0 *warnings* de React (hidratación, keys) |
| Red | Sin 4xx/5xx inesperados; sin llamadas duplicadas en bucle |
| Estados | Vacío, cargando, error y con datos son visibles y comprensibles |
| Formato | Moneda y porcentajes con el formato de `lib/utils/currency-format.ts`; sin `NaN`, `Infinity` ni `undefined` |
| Teclado | Se puede completar el formulario sin ratón; foco visible |
| Responsive | Utilizable a 375 px de ancho |
| Accesibilidad | `a11y-debugging` / `accessibility` sin hallazgos críticos; gráficos con alternativa textual |
| Rendimiento | LCP de la página nueva < 2,5 s (`debug-optimize-lcp`) |

## 9. Cuando algo falla

```
Fallo visto  →  reproducir  →  causa raíz (systematic-debugging)
             →  test de regresión en el nivel más bajo posible
             →  fix mínimo
             →  escalera L0→L3 completa  →  repetir el recorrido
```

Prohibido: cambiar el valor esperado para que el test pase sin entender la diferencia.

## 10. Mantener este documento

- ¿Feature con ruta nueva? Añade un recorrido `J…` con valores calculados a mano.
- ¿Cambió una fórmula? Actualiza los valores de oro de §3 y `BUSINESS-LOGIC.md` en el mismo commit.
- Cuando existan los runners, cambia el estado de §1 de ❌ a ✅ con el comando real.
