# EconoLab

Plataforma para evaluación de proyectos económicos y financieros construida con Next.js, TypeScript, `next-intl`, Tailwind y componentes reutilizables.

## Arquitectura actual

La aplicación usa una sola árbol de rutas activo en `app/`.

- `app/page.tsx`: landing page.
- `app/dashboard/*`: panel principal y módulos de análisis.
- `app/layout.tsx`: carga el locale desde la cookie `locale` y entrega `messages` a `NextIntlClientProvider`.
- `proxy.ts`: passthrough mínimo para compatibilidad con Next 16.

La carpeta localizada `app/[locale]` fue eliminada para evitar duplicación de UI y de navegación.

## Persistencia de idioma

El idioma ya no depende de segmentos dinámicos en la URL.

- El selector de idioma escribe la cookie `locale`.
- El layout raíz lee esa cookie en el servidor.
- `next-intl` recibe el locale y los mensajes correctos sin cambiar la ruta.

## Estructura recomendada

La base ya está preparada para separar responsabilidades:

- `app/`: composición de páginas y layouts.
- `components/`: UI, shells y secciones reutilizables.
- `components/ui/`: primitivas visuales.
- `hooks/`: lógica de interacción.
- `lib/`: utilidades y datos compartidos.
- `i18n/`: configuración de idioma y helpers.
- `messages/`: traducciones por idioma.

## Principios SOLID aplicados

- Responsabilidad única: cada layout, componente y helper debe resolver una sola tarea.
- Abierto/cerrado: extiende con nuevos componentes o secciones sin tocar la base de navegación.
- Sustitución de Liskov: los componentes UI deben poder reemplazarse sin romper contratos.
- Segregación de interfaces: exporta helpers pequeños y específicos en vez de módulos monolíticos.
- Inversión de dependencias: las páginas deben depender de shells y componentes compartidos, no de lógica duplicada.

## Desarrollo

```bash
pnpm install
pnpm dev
```

## Setup Supabase (MVP)

1. Crea un proyecto en Supabase.
2. Copia `.env.example` a `.env.local` y configura:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

3. Abre el SQL Editor en Supabase y ejecuta el script:

```sql
-- archivo en este repo
supabase/schema.sql
```

4. En Authentication > Providers, habilita Email.
5. Inicia la app y accede a `/auth` para registrarte/iniciar sesion.

Notas:
- El `dashboard` esta protegido por sesion.
- `projects` y `cash_flows` usan RLS para aislar datos por usuario.

## Validación

```bash
pnpm build
```

## Nota

El proyecto todavía tiene lógica de negocio por endurecer, pero la estructura ya quedó lista para hacerlo sin arrastrar dos implementaciones paralelas de la app.