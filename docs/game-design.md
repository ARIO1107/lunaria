# Lunaria beta · recorrido jugable

Alex Ríos y Titus hacen una expedición ficticia. Los datos científicos salen de `src/data/scienceFacts.js` y enlazan a NASA. Los recursos, tolerancias y el mapa son parámetros del simulador.

## Recorrido

1. Cinemática en la plataforma de lanzamiento y comprobaciones de aire, energía y propulsión, todavía en tierra. La autorización no despega. El ascenso reutiliza el simulador existente. Si la primera etapa se separa, una segunda cinemática resume el despegue hasta la órbita terrestre. Bajar potencia en Max Q es una mecánica del juego. El nivel 2 empieza ya en vuelo hacia la Luna.
2. Recorrido por la nave, alineación con tolerancia de ±5°, inventario y una señal ficticia en el canal 7. La ida y vuelta del mensaje usa unos 2,6 s.
3. Avería eléctrica independiente de la señal. Hay que aislar, reparar y repartir 60 unidades sin dejar sin mínimo a vida, navegación y propulsión. El frenado orbital resta 15 unidades de combustible de la nave.
4. Elección de zona A, B o C, descenso con gravedad de referencia 1,62 m/s² y primera salida en la superficie.
5. Hábitat, paneles, soporte vital, agua y una muestra de regolito analizada en el laboratorio.
6. Tres ciclos de operaciones y tres actividades. En el ciclo 2 hay un ejercicio de aviso solar, sin cálculo de dosis. La zona B empieza con más energía de juego porque tiene más luz en la ficción; la zona C, con menos.

## Cinemática de apertura

Jugar, si no hay partida, entra en una escena 3D propia (Three.js, solo en las cinemáticas). Dura 75 segundos en la plataforma: torre, lanzador, cielo, cabina, Alex y Titus. No muestra la Luna cerca ni un viaje espacial. Los diálogos van en subtítulos; no hay voces grabadas. La música es original. Esc u Omitir entra al nivel 1. Continuar no repite esa apertura. Al superar el simulador de ascenso se reproduce `level1_launch_cinematic`, de 60 segundos: cuenta atrás, encendido, despegue, ascenso y un salto marcado hasta la órbita terrestre. Omitirla abre el resumen. Los motores dejan de sonar al llegar al espacio. Gráficos Alto o Ajustado están en Configuración.

En Edge headless con Playwright, sobre el build de producción, la cabina de la plataforma midió 60 FPS cuatro veces seguidas con gráficos Alto. La pasada anterior de la cinemática espacial también midió 60 FPS en la cabina ya estabilizada. Pasadas anteriores en este equipo se quedaron en 30 FPS cuando ese navegador presentaba a 30 Hz. Con el límite de refresco desactivado, la cabina dio 109, 212 y 387 FPS, y el intervalo medio de animación fue 4,9 ms. Esas cifras son mediciones, no una garantía. Gráficos Ajustado, con la CPU emulada cuatro veces más lenta, midió 38 FPS en la ventana del salto y después 62, 44, 60 y 60. Antes, con el navegador a 30 Hz, la misma emulación se quedó en 24–31. No hay una medición en otro aparato: 30 FPS estables en un equipo modesto siguen siendo el objetivo. Ajustado baja la resolución interna, quita sombras y reduce estrellas. Al saltar de tiempo en la prueba el contador baja un instante; esa ventana no es la reproducción continua.

## Guardado

`localStorage` guarda la campaña versionada. Un archivo imposible de validar se descarta. Reintentar vuelve al punto de control del nivel, no al lanzamiento. El modo demostración del menú salta niveles y lo indica en pantalla.
