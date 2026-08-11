# InvManager Bar

App de inventario fraccionado (botellas y tragos) para Cava, Dos Sucres y Mindala.

## Correr en local

```bash
npm install
npm run dev
```

Abre http://localhost:5173

## Desplegar en Vercel

1. Sube esta carpeta a un repositorio de GitHub.
2. Entra a [vercel.com](https://vercel.com) → **Add New Project** → importa el repo.
3. Vercel detecta Vite automáticamente (Build Command: `npm run build`, Output: `dist`). No cambies nada, solo dale **Deploy**.

## Limitaciones actuales (léelo antes de usarlo con inventario real)

- **Persistencia solo local**: los datos se guardan en `localStorage` del navegador. Cada dispositivo/computadora tiene su propia copia — Cava, Dos Sucres y Mindala NO ven el mismo inventario entre sí a menos que trabajen desde el mismo navegador.
- **Sin autenticación real**: el nombre de "operador" es un campo de texto libre, no hay contraseña ni verificación de identidad.
- **Sin backend/base de datos**: si borras los datos del navegador (o usas modo incógnito) se pierde todo el historial.

## Siguiente paso recomendado: backend compartido

Para que las tres áreas compartan el mismo inventario en tiempo real desde cualquier dispositivo, se necesita:
- Una base de datos (ej. [Supabase](https://supabase.com), gratis para empezar).
- Autenticación real (Supabase Auth, Clerk, etc.).
- Reemplazar las llamadas a `localStorage` en `src/App.jsx` por llamadas a esa base de datos.

Si quieres, este es un proyecto aparte que se puede armar sobre esta misma base.
