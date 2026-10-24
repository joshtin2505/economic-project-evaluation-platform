# Catálogo y orquestación de skills

Fuente de verdad de lo instalado: [`skills-lock.json`](../../skills-lock.json) (**34 skills** en `.agents/skills/`).
Además existe el plugin global `superpowers` (`~/.gemini/config/plugins/superpowers`) y el plugin `chrome-devtools-plugin`, que **no viajan con el repo**.

## 0. Estado de instalación (verificado en disco)

| Estado | Significado |
|---|---|
| ✅ repo | En `.agents/skills/` y en `skills-lock.json`: reproducible para cualquiera que clone |
| 🌐 global | Solo en plugin del usuario: funciona en esta máquina, no en otra ni en otros agentes |
| ❌ falta | No existe en ningún lado |

**Skills clave ahora instaladas localmente en el repo (`.agents/skills/`):**
- ✅ `test-driven-development`
- ✅ `verification-before-completion`
- ✅ `using-git-worktrees`
- ✅ `finishing-a-development-branch`
- ✅ `dispatching-parallel-agents`

Del plugin `chrome-devtools-plugin` (🌐): `chrome-devtools`, `a11y-debugging`, `debug-optimize-lcp`, `cookie-debugging`, `memory-leak-debugging` — útiles en S7.

**Herramientas instaladas:**
- ✅ `vitest` (ejecutable con `pnpm test`)
- ✅ `agent-browser` (CLI global instalado `agent-browser --version`)
- ✅ `eslint` + `eslint-config-next` (ejecutable con `pnpm run lint`)
- ✅ Script `typecheck` (`tsc --noEmit`, ejecutable con `pnpm run typecheck`)


## 1. Clasificación por rol

### Núcleo (se usan en casi toda tarea)
| Skill | Fase | Para qué |
|---|---|---|
| `using-superpowers` | 0 | Regla meta: antes de actuar, ¿aplica alguna skill? |
| `brainstorming` | 1 | Diseño antes de construir |
| `grill-me` | 1 | Entrevista para resolver decisiones de diseño |
| `writing-plans` | 2 | Plan con pasos verificables |
| `test-driven-development` | 3 | Test primero (engines) |
| `systematic-debugging` | 3–4 | Causa raíz antes del parche |
| `verification-before-completion` | 4 | Evidencia antes de "listo" |
| `ponytail` | 3 | Cambio mínimo, respuesta breve |
| `code-review` / `ponytail-review` | 5 | Revisión de cambios |

### Dominio técnico (por capa)
| Skill | Capa |
|---|---|
| `supabase-postgres-best-practices` | Migraciones, RLS, índices, SQL |
| `nextjs-supabase-auth` | Sesión/auth |
| `nextjs-app-router-patterns`, `nextjs-best-practices` | Rutas, RSC, server actions |
| `shadcn` | Componentes UI |
| `design-taste-frontend`, `ui-ux-pro-max` | Diseño visual y UX |
| `tailwindcss-mobile-first` | Responsive |
| `accessibility` | WCAG |

### Herramientas
| Skill | Uso |
|---|---|
| `agent-browser` | Probar páginas en navegador real, capturas |
| `graphify` | Grafo de conocimiento del repo (aún no generado: no existe `graphify-out/`) |
| `find-skills` | Descubrir/instalar skills nuevas |
| `writing-skills` | Crear skills propias del proyecto |

### Mantenimiento periódico
`ponytail-audit`, `ponytail-debt`, `ponytail-gain`, `improve-codebase-architecture`, `codebase-design`, `diagnosing-superpowers`.

### Ejecución a escala
`subagent-driven-development`, `dispatching-parallel-agents`, `executing-plans`, `using-git-worktrees`, `finishing-a-development-branch`, `requesting-code-review`, `receiving-code-review`.

### Solo para marketing (acotadas a la landing)
`copywriting`, `seo-audit`. **No** aplicar a `app/dashboard/*`.

## 2. Matriz tarea → skills

| Quiero… | Invoca, en este orden |
|---|---|
| Añadir un indicador financiero | `grill-me` → `test-driven-development` → `verification-before-completion` |
| Añadir un módulo con tablas | `brainstorming` → `writing-plans` → `supabase-postgres-best-practices` → `test-driven-development` → `shadcn` → `verification-before-completion` |
| Nueva pantalla del dashboard | `brainstorming` → `shadcn` + `design-taste-frontend` → `accessibility` → `agent-browser` |
| Arreglar un bug | `systematic-debugging` → `test-driven-development` → `verification-before-completion` |
| Optimizar consultas lentas | `supabase-postgres-best-practices` |
| Revisar antes de merge | `ponytail-review` + `code-review` |
| Limpiar el repo | `ponytail-audit` → `ponytail-debt` → `improve-codebase-architecture` |
| Mejorar la landing | `design-taste-frontend` → `copywriting` → `seo-audit` → `accessibility` |
| Entender código desconocido | `codebase-memory-mcp` → `graphify` |

## 3. Conflictos y resolución

| Conflicto | Resolución |
|---|---|
| `using-superpowers` ("invoca skill ante cualquier duda") vs `ponytail` ("sé mínimo") | Aplican a ejes distintos. Process = superpowers; diff size = ponytail. No es excusa para saltarse verificación. |
| `brainstorming` (obligatorio antes de crear) vs cambios triviales | Se omite en typo/copy/estilo (ver *Atajos* en `WORKFLOW.md`). Obligatorio en features y fórmulas. |
| `brainstorming` vs `grill-me` | `brainstorming` explora el diseño; `grill-me` presiona decisiones concretas. Usa `grill-me` cuando ya hay una idea y quieres desafiarla. |
| `graphify` vs `codebase-memory-mcp` | Regla de usuario: **MCP primero**. `graphify` solo para vistas de arquitectura globales. |
| Skills duplicadas (locales vs plugin global `superpowers`) | Solo 10 de las 15 de superpowers están duplicadas en local; **5 existen únicamente en el plugin global** (ver §0). **No desactives el plugin** hasta instalar localmente `test-driven-development` y `verification-before-completion`. Después, la local manda (versionada ⇒ reproducible). |
| `design-taste-frontend` vs `ui-ux-pro-max` | Taste = dirección de arte y anti-slop; UX Pro = datos de estilos/paletas/UX. Taste decide, UX Pro aporta. En dashboards: densidad y claridad > espectáculo. |
| `agent-browser` vs herramientas de navegador nativas | Preferir `agent-browser` (indicación de la propia skill). |

## 4. Skills propias recomendadas (backlog)

Cuando algo se repita 3 veces, conviértelo en skill local (`writing-skills`):

| Skill propia | Contenido |
|---|---|
| `econolab-engine` | Receta: nuevo engine + test con caso resuelto + export + doc de dominio |
| `econolab-migration` | Receta: migración + RLS en cascada + verificación con 2 usuarios |
| `econolab-feature-page` | Receta: página `projects/[id]/<modulo>` + ruta en `lib/routes.ts` + i18n + sidebar |

## 5. Higiene

- Tras instalar/actualizar skills: `skills-lock.json` debe quedar commiteado.
- No instalar skills "por si acaso": cada skill añade ruido a la descripción que el agente lee. Revisa trimestralmente con `find-skills` y elimina las que no se usen.
- `copywriting`, `seo-audit` y similares pueden desinstalarse si la landing no es prioridad.
