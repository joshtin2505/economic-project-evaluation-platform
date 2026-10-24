# Spec — <nombre de la feature>

> Contenido mínimo de una spec. Guárdala en `docs/superpowers/specs/AAAA-MM-DD-<tema>-design.md` (ruta por defecto de `brainstorming`).
> El plan derivado va en `docs/superpowers/plans/`. Runbook: [`../ai/DEVELOPMENT-LIFECYCLE.md`](../ai/DEVELOPMENT-LIFECYCLE.md).

- **Estado:** borrador | aprobada | implementada
- **Autor / fecha:**
- **Skills usadas:** (brainstorming / grill-me / …)

## 1. Problema
¿Qué no puede hacer hoy el usuario y por qué importa? (2–4 líneas)

## 2. Alcance
**Entra:**
-

**NO entra:**
-

## 3. Reglas de dominio
Fórmulas con unidades explícitas (`%` vs decimal) y convención de periodos.

```
indicador = ...
```

### Ejemplo numérico resuelto a mano (obligatorio si hay cálculo)
| Entrada | Valor |
|---|---|
| | |

Resultado esperado: `...` (verificado con: Excel / calculadora / referencia)

### Casos borde
- Tasa 0 · flujos vacíos · TIR sin solución · periodos negativos · división por cero

## 4. Datos
Tablas/columnas nuevas o modificadas, RLS (cascada por `projects.user_id`), migración `YYYYMMDDHHMMSS_nombre.sql`.

## 5. Superficie
| Capa | Archivo(s) |
|---|---|
| Engine | `lib/engines/...` |
| Service | `lib/services/...` |
| Ruta | `app/dashboard/...` + `lib/routes.ts` + sidebar |
| i18n | `messages/es.json`, `messages/en.json` |

## 6. Criterios de aceptación (medibles)
- [ ] Dado ..., cuando ..., entonces ... (L1: valor del engine)
- [ ] Test de engine con el ejemplo de §3
- [ ] `pnpm exec tsc --noEmit` sin errores y `pnpm build` OK
- [ ] RLS verificado con dos usuarios
- [ ] `docs/domain/BUSINESS-LOGIC.md` actualizado

### Recorrido de navegador esperado (L4, obligatorio si hay UI)
| Paso | Acción del usuario | Valor/estado visible esperado (calculado a mano) |
|---|---|---|
| 1 | | |
| 2 | | |

Estados: vacío · cargando · error · con datos · ES y EN. Reutiliza/añade el recorrido `J…` en `docs/ai/TESTING.md`.

## 7. Plan (pasos pequeños, de adentro hacia afuera)
1. [ ] Test del engine (rojo)
2. [ ] Engine (verde)
3. [ ] Migración + RLS
4. [ ] Service
5. [ ] Página/componente
6. [ ] i18n
7. [ ] Docs
8. [ ] Verificación en navegador (recorridos `J…`) con evidencia

## 8. Preguntas abiertas
-
