---
name: lunaria-verify
description: >
  Verifica un cambio de Lunaria con tests, build y navegador, y lo publica
  en main. Úsala al cerrar jugabilidad, diálogos, escenarios o personajes,
  o cuando el usuario pida probar y subir el cambio. También ante /lunaria-verify.
when-to-use: >
  verificar, probar, build, e2e, Playwright, commit, push, FPS, WebGLRenderer
---

# Verificar Lunaria

Di que algo quedó hecho solo después de ver la salida de la herramienta. Si un paso no corre, dilo.

## Comandos

Desde la raíz del repo, con `npm.cmd` en PowerShell:

1. `npm.cmd test`
2. `npm.cmd run build`
3. Confirma que `dist/assets/index-*.js` no contiene `WebGLRenderer`. Esa cadena pertenece a `cast-*.js`. `dist/index.html` no precarga Three.js.

Antes de Playwright, cierra lo que escuche en el puerto 4173. El preview no debe servir un `dist` viejo. La config usa Edge, `http://127.0.0.1:4173` y un solo worker.

## Qué abrir en el navegador

- Diálogo o globo: el test de exploración a 1440 px y `tests/browser/bubbles.spec.js`.
- Consola de una estación: entra en esa estación y completa el control. El nivel 1 usa el spec de soporte vital. El nivel 2 usa `tests/browser/level2.spec.js`.
- Un texto que también está en el lateral se busca en `.crew-card` o en el diálogo, no en toda la página.
- No instales `page.clock` antes de la cinemática de apertura. El spec de soporte vital sí lo instala antes de navegar, porque el temporizador de la consola espera ese reloj.

## Publicar

Cuando los pasos anteriores pasen, crea el mensaje en un archivo temporal y haz `git commit -F` con `feat:` o `fix:`. Empuja a `origin` `main`. No incluyas `dist`, `test-results` ni `node_modules`. Borra el archivo temporal. El mensaje dice qué ve el jugador, en una frase.
