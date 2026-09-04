React + Vite + Tailwind CSS project running inside Figma Make.

## Development Server

A Vite development server is **already running** on `$PORT` (default 8443). You don't need to start it manually.

- Preview URL: The user can access the running app through the preview panel
- Hot reload: Changes to source files are reflected immediately

## Project Structure

This is the canonical project structure. Start with task-relevant files below. Only follow imports or inspect other files when required, when a documented path is missing, or when the repository contradicts this guide.

- `src/main.tsx` - React entrypoint; imports `src/index.css` and mounts `src/App.tsx` into the `#root` element
- `src/App.tsx` - Primary application component and the usual starting point for UI work
- `src/index.css` - Global CSS entrypoint and Tailwind CSS v4 import
- `index.html` - Vite HTML shell containing the `#root` element and loading `src/main.tsx`
- `package.json` - Project dependencies and the Vite build, development, preview, and formatting scripts
- `vite.config.ts` - Vite configuration with React, Tailwind CSS v4, and Figma Make plugins plus the `@` alias for `src`
- `.mise.toml` - Toolchain versions for Node.js and pnpm

## Dependencies

- Runtime: React 19 and React DOM 19
- Styling: Tailwind CSS v4 with the `@tailwindcss/vite` plugin
- Build tooling: Vite 8, TypeScript 5.7, and `@vitejs/plugin-react`
- Formatting: oxfmt

## Styling

This project uses **Tailwind CSS v4** through the `@tailwindcss/vite` plugin configured in `vite.config.ts`. `src/index.css` imports Tailwind with `@import 'tailwindcss';`. Use Tailwind utility classes directly in JSX and put global CSS or Tailwind v4 theme customization in `src/index.css`. This scaffold does not need a Tailwind config file or PostCSS config.

`src/main.tsx` imports `src/index.css`, so global font wiring belongs in `src/index.css`. Keep CSS `@import` statements first, then add any `@font-face` rules and font-family defaults there.

## Code quality

- Use double quotes for strings containing apostrophes (`"We're here to help"`), or escape them in single-quoted strings. An unescaped apostrophe in a single-quoted string breaks the build.
- Ensure JSX tags are closed and braces are balanced.
- Export components as default exports.

## API Key Security — CRITICAL

**GEMINI_API_KEY and CLOUDCONVERT_API_KEY must NEVER appear in any frontend file.**

- These keys live only in `supabase/functions/server/index.tsx` (Deno Edge Function), read via `Deno.env.get(...)`.
- The frontend (`src/`) calls our own backend route (`/functions/v1/server/.../gemini` or `/convert`), which proxies to the external API.
- If any generated code puts an API key in `src/`, `index.html`, or any client-side file, that is a critical security bug — revert it immediately.
- Reference: `.env.example` documents the required secrets; set them via `supabase secrets set KEY=value`.

## File structure notes

- `src/utils/converters.ts` — all browser-side conversion logic (pdf-lib, pdfjs, tesseract, etc.)
- `src/utils/download.ts` — download helpers
- `src/data/tools.ts` — tool registry (id, name, category, path, acceptedFormats)
- `docs/` — dev notes and integration specs (not application source)
- `supabase/functions/server/index.tsx` — Edge Function (managed by Make platform; do not add unused imports)
