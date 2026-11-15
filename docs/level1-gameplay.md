# Nivel 1 · De la revisión al despegue

La secuencia actual ya ordena bien las verificaciones y separa el simulador de la película del ascenso. El reto cambia de forma entre misiones. Soporte vital responde al activar componentes y ascenso responde al empuje, pero energía y autorización se resuelven con una opción de texto y propulsión con casillas que repiten los requisitos. El objetivo de estos prototipos es que Alex lea el instrumento, manipule un control y compruebe qué cambió en cada misión.

| Misión | Reto en primera persona | Éxito y recuperación |
| --- | --- | --- |
| 1. Soporte vital | Gira la válvula de O₂, acciona el ventilador y coloca el cartucho de CO₂. Al probar, la consola muestra si llega oxígeno, si circula aire y si baja el indicador de CO₂. Una prueba de entrenamiento puede partir con uno de los tres componentes sin activar. | Mantener los tres indicadores en su banda durante la prueba. Si falla, el indicador afectado queda marcado y Titus da primero una pista sobre la lectura. Se vuelve a probar en la misma consola. |
| 2. Energía | Conecta dos puentes desde los buses principal y de respaldo hacia las cargas esenciales. Luego simula la pérdida del principal y observa qué cargas siguen funcionando. Con teclado o móvil se seleccionan los dos extremos por separado. | Aire y navegación siguen alimentados durante la prueba. Una conexión incorrecta deja una carga apagada y se puede retirar ese cable. La iluminación decorativa enseña qué se puede dejar fuera del respaldo. |
| 3. Combustible y propulsión | Compara los niveles de dos ramales y acciona una prueba de retención. Uno puede parecer lleno y aun así perder presión simulada. Identifica el ramal con caída, aíslalo para el diagnóstico y verifica el ramal de repuesto de esta nave ficticia. | Las lecturas de prueba se mantienen en la banda y el circuito queda en configuración de vuelo. Un aislamiento incorrecto detiene la prueba y muestra qué lectura conviene revisar. |
| 4. Autorización | Usa la radio para responder a tres peticiones de control con el estado que dejaron las misiones previas. Los indicadores de aire, energía y propulsión muestran lo que debes reportar. La última respuesta confirma la autorización recibida. | Control concede el permiso con las tres lecturas coherentes. Si un reporte discrepa, control pide repetirlo y resalta qué indicador consultar. |
| 5. Ascenso | Conserva el motor de ascenso y coloca sus datos en los instrumentos del puesto de piloto. Usa la palanca para mantener la carga bajo el límite al cruzar Max Q. Al abrirse las ventanas, acciona el corte central y la separación con botones protegidos. | Separar en la ventana válida sin superar el límite del simulador. En el primer intento, muestra la siguiente acción antes de la ventana. Si se pierde la etapa, reinicia solo el ascenso. |

Las pruebas de presión, asignaciones, límites y tiempos del minijuego son parámetros educativos de la nave ficticia. La consola de ascenso representa la dinámica del juego existente. La verificación de las tres primeras misiones debe alimentar el parte de radio y persistir en el guardado. Para evitar caminar tres veces al mismo puesto, al acabar propulsión se puede ofrecer abrir comunicaciones desde esa consola, y después cambiar al puesto de piloto. Conserva una ruta con teclado y tacto para cada control y comunica los estados con forma, texto e indicador visual.

## Recursos 3D

Los cinco archivos GLB están en `art/exports/level1/`. Cada escena tiene una consola, una cabina, guantes de Alex y la cámara `Alex-POV`. Son prototipos visuales con piezas independientes. No incluyen lógica de juego ni animaciones. En Blender se pueden editar desde Archivo → Importar → glTF 2.0. En Three.js se importan con GLTFLoader y se puede usar directamente la cámara incluida.

| Archivo | Grupos a conectar |
| --- | --- |
| `01-life-support.glb` | `oxygen-valve`, `air-fan` / `rotor`, `co2-scrubber`, `test-air-loop` |
| `02-power.glb` | `main-bus`, `backup-bus`, `patch-cable-*`, `life-support-load`, `navigation-load`, `lighting-load` |
| `03-propulsion.glb` | `tank-a`, `tank-b`, `line-pressure`, `pressure-hold`, `isolate-branch-a`, `isolate-branch-b`, `pressure-test` |
| `04-clearance.glb` | `control-radio`, `air-status`, `power-status`, `fuel-status`, `push-to-talk-handset` / `ptt-button` |
| `05-launch.glb` | `max-q-display`, `throttle` / `lever-slide`, `ignition`, `center-cutoff`, `stage-separation` |

La fuente editable está en `art/level1Consoles.js`. Regenera los GLB desde la raíz con `node scripts/export-level1-consoles.mjs`. Los modelos se guardan como recursos de arte para la futura implementación.

