---
name: lunaria-ui
description: >
  Mejora la interfaz de Lunaria: menú, cubierta, paneles y consolas, con
  el estilo que el juego ya tiene. Úsala ante UX, UI, HUD, botones,
  tipografía, foco, táctil o un pase de interfaz. También ante /lunaria-ui.
when-to-use: >
  interfaz, UX, UI, HUD, menú, botón, panel, tipografía, foco, táctil
---

# Interfaz de Lunaria

Hay dos idiomas visuales. Una pantalla nueva entra en uno de los dos. El público tiene unos 7 a 12 años: una acción clara, texto corto en español y controles de al menos 44 px.

## Menú

`MainMenu.jsx` y `src/styles/menu.css`. Foto lunar, marco recortado, IBM Plex Mono, verde `#39ff14` y texto `#75ff60`. Los dos recortes del logo salen del JPG original. Ese verde no sustituye al oro de la partida.

## Partida

Los tokens viven en `src/styles/index.css`: `--ground` `#111414`, `--surface` `#1b211f`, `--raised` `#252d29`, `--text` `#e7e9df`, `--muted` `#b0bbb2`, `--accent` `#e8bf69`, `--green` `#9be3b6`, `--danger` `#f18d7d`, `--line` `#343e38`. La fuente es Segoe UI. Los botones son `.primary-button`, `.secondary-button` y `.quiet-button`. El foco visible es un contorno oro.

La exploración está en `CampaignScreen.jsx` y `exploration.css`: cabecera, mapa y lateral de 280 px. El centro del mapa queda libre. Por debajo de 760 px aparecen `.touch-controls`. El diálogo es `Modal.jsx` y se cierra con Escape. Las consolas están en `campaign.css`. El control y el valor que envían los guarda `lunaria-gameplay`. El cromo de la película lo trata `lunaria-cinematics`. El globo lo tratan `lunaria-animation` y `titus-voice`. Un icono nuevo se genera con `ui-icons.md` de `game-assets`.

## Al pulir

Lee la nota que corresponda y aplícala aquí. Ignora el saludo inicial de las notas de Emil. No instales `motion` ni otra librería de animación: el movimiento de la interfaz es CSS. No añadas un interruptor de datos de prueba al juego publicado. `choreograph` no está en el repo.

- Pantalla nueva: `frontend-design`, y después encaja el plan en el menú o en la partida. La paleta ya está elegida.
- Pulsación, hover y paneles: `emil-design-eng`. Caminar con el teclado lo anima `lunaria-animation`.
- Si un panel se traba: `animation-performance`. Anima `transform` y `opacity`.
- Revisión de movimiento: `review-animations` y su `STANDARDS.md`.
- Auditoría de los archivos tocados: `web-design-guidelines`, que trae las reglas al día.
- Texto largo, lista vacía, una sola muestra y zoom: el catálogo de `break-ui`.

El movimiento reducido ya anula transiciones en `index.css`. Un adorno nuevo entra en esa media query. El hover con desplazamiento solo vale con puntero fino.

Mira el menú y la vista tocada a 1440 px y a 760 px. Si el cambio se publica, ciérralo con `lunaria-verify`.
