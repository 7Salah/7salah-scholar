# Academic Quest · Phase 1

This is an independent, static Babylon.js + TypeScript game surface for the existing HTML/CSS/JavaScript platform. The host app has no React, Vite, or Git metadata, so the game uses Vite without adding React or changing the platform's runtime.

## Build and preview

From this directory:

```sh
npm install
npm run build
npm run dev
```

`npm run build` writes the deployable game to `dist/`. The platform entry in `../index.html` links to `game/dist/`, so build before publishing. Vite uses `base: "./"` for GitHub Pages project URLs as well as custom domains. Upload the platform files and the complete `game/` folder, including `game/dist/`, while preserving their relative paths. No GitHub Pages workflow or repository URL was present in the supplied archive, so the actual Pages source and URL could not be verified here.

For development, open `/game/` on the Vite server; the dev server uses the platform root so the existing config and return link remain available. To test the production folder as hosted, serve the project root after building (for example, `python3 -m http.server 8000` from the platform root), then open `/game/dist/`.

Babylon.js is built as a separate vendor chunk (about 1.56 MB minified / 365 KB gzip in this build). Both the Academy entry and Babylon chunk are requested only after the player presses “Enter Academy”; neither is linked from the initial game page. The platform service worker precaches only the small launcher and bypasses `game/dist/`; game bundles are neither precached nor added to its runtime cache.

## Session and data boundaries

The game reads the existing `../config.js` and uses the same Supabase project, SDK version, default auth storage key, and browser origin as the platform. It calls `auth.getSession()` only; it does not show a new sign-in flow, read/write profile tables, write XP, or alter platform points or database tables. The name comes from session user metadata when available; otherwise the game uses a local guest label. Quality and appearance preferences are stored locally. XP remains a display-only mock value.

The procedural avatar is a placeholder attached to a stable player root. Input, movement, collision, and camera follow that root, so a future GLB avatar can replace the placeholder without rebuilding those systems.

## Controls and scope

Desktop: WASD, mouse drag to rotate the camera, Shift to run, Space to jump, E to interact, Esc to pause. Touch devices: virtual joystick, camera swipe on the scene, and run/jump/interact buttons.

Phase 1 provides a single-player campus courtyard, an academic building, paths, trees, a fountain, basic collision, a placeholder character, and a responsive HUD. It does not include missions, persistent progression, multiplayer, or database writes. GitHub Pages/browser-device testing must be performed after deployment; this archive alone does not identify a live URL or browser test environment.
