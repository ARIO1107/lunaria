const task = (id, stationId, title, kind, prompt, answer, options = []) => ({
  id, stationId, title, kind, prompt, answer, options,
  hint: prompt,
  why: 'Cada comprobación protege a la tripulación y prepara el siguiente paso.',
});

export const levels = [
  {
    id: 1, title: 'El lanzamiento', subtitle: 'Comienza la aventura',
    intro: 'La nave sigue en la plataforma de lanzamiento. Revisa soporte vital, energía y propulsión. El centro de control espera tu autorización antes del despegue.',
    summary: 'Las comprobaciones se hicieron en tierra. La película muestra el despegue hasta la órbita terrestre. El viaje hacia la Luna empieza en el siguiente nivel.',
    tasks: [
      task('air', 'oxygen', 'Revisar soporte vital', 'eclss', 'La nave sigue en tierra. Prepara la ventilación, el suministro de oxígeno y la retirada de CO₂ en la consola.', 'estable'),
      task('power', 'breakers', 'Conectar energía y respaldo', 'choice', 'Antes del despegue, las cargas esenciales necesitan una alimentación principal y otra de respaldo.', 'Principal y respaldo independientes', ['Una única batería para todo', 'Principal y respaldo independientes', 'Apagar soporte vital']),
      task('fuel', 'propulsion', 'Comprobar combustible y propulsión', 'checks', 'Seguimos en la plataforma. Depósito de lanzamiento al 100 % del indicador de juego. Revisa el circuito antes de autorizar.', ['Combustible disponible', 'Válvulas comprobadas', 'Motores preparados'], ['Combustible disponible', 'Válvulas comprobadas', 'Motores preparados']),
      task('clearance', 'propulsion', 'Obtener autorización de control', 'choice', 'Todavía no hemos despegado. El centro de control ficticio pregunta si las tres revisiones están completas.', 'Solicitar autorización', ['Solicitar autorización', 'Encender sin autorización']),
      task('launch', 'propulsion', 'Despegar y separar la primera etapa', 'launch', 'Gestiona el ascenso en el simulador. Al separar la etapa verás la película del despegue.'),
    ],
  },
  {
    id: 2, title: 'Conoce tu nave', subtitle: 'Preparando el viaje',
    intro: 'Estamos en vuelo hacia la Luna. Explora los sistemas, revisa el inventario y aprende a orientar la nave. Titus detecta una señal intermitente ficticia.',
    summary: 'Orientación y trayectoria son conceptos diferentes. Registraste una señal ficticia de origen desconocido. Una advertencia independiente indica que el circuito de propulsión necesita mantenimiento.',
    tasks: [
      task('navigation', 'coas', 'Orientar la referencia de navegación', 'alignment', 'Gira la mira hasta meter la proa en el arco verde, cerca de 45°. La flecha de trayectoria no se mueve.', 45),
      task('supplies', 'suit', 'Revisar suministros de emergencia', 'checks', 'Mete en la bolsa el agua, el botiquín y las herramientas. Deja fuera lo que no sea un suministro de emergencia.', ['Agua y alimentos', 'Botiquín', 'Herramientas y equipo científico'], ['Agua y alimentos', 'Botiquín', 'Herramientas y equipo científico']),
      task('atmosphere', 'oxygen', 'Distinguir presión y oxígeno', 'choice', 'La presión se mantiene, pero la reserva de oxígeno está baja. Abre la reserva y registra la lectura.', 'Reserva de oxígeno y composición del aire', ['Solo el indicador de presión', 'Reserva de oxígeno y composición del aire', 'El combustible del motor']),
      task('energy-tour', 'breakers', 'Revisar suministro eléctrico', 'choice', 'Da respaldo al aire y a la navegación. Corta el bus principal y comprueba qué sigue encendido.', 'Los sistemas esenciales', ['Solo la iluminación decorativa', 'Los sistemas esenciales', 'Ningún sistema']),
      task('signal', 'propulsion', 'Sintonizar y registrar la señal', 'signal', 'Busca el canal ficticio 7, envía y espera. Anota el mensaje y el aviso de mantenimiento, que es independiente.', 7),
    ],
  },
  {
    id: 3, title: 'Última oportunidad', subtitle: 'Supervivencia y órbita lunar',
    intro: 'Una avería eléctrica ficticia afecta a la propulsión. La señal misteriosa no explica este fallo. Diagnostica, aísla y repara el circuito antes de la maniobra orbital.',
    summary: 'Aislaste el circuito antes de repararlo y priorizaste soporte vital y navegación. El encendido de frenado consumió 15 unidades simuladas de combustible de la nave.',
    tasks: [
      task('diagnose', 'breakers', 'Diagnosticar el circuito averiado', 'choice', 'Soporte vital: estable. Navegación: estable. Propulsión: circuito abierto y fusible quemado.', 'Propulsión', ['Soporte vital', 'Navegación', 'Propulsión']),
      task('isolate', 'breakers', 'Aislar el circuito afectado', 'choice', 'Antes de tocar la pieza, elimina su alimentación.', 'Desconectar propulsión', ['Desconectar propulsión', 'Sustituir con corriente activa', 'Apagar el aire de toda la nave']),
      task('replace', 'suit', 'Instalar el repuesto correcto', 'choice', 'El inventario contiene un fusible compatible, cinta y un sensor óptico.', 'Fusible compatible', ['Fusible compatible', 'Cinta sobre el fusible', 'Sensor óptico']),
      task('repair-test', 'breakers', 'Probar la reparación', 'checks', 'La pieza nueva está instalada. Revisa antes de reconectar.', ['Cubierta cerrada', 'Continuidad comprobada', 'Circuito reconectado'], ['Cubierta cerrada', 'Continuidad comprobada', 'Circuito reconectado']),
      task('allocation', 'breakers', 'Distribuir energía de emergencia', 'allocation', 'Presupuesto de 60 unidades. Mínimos: soporte vital 20, navegación 15 y propulsión 20. Comunicaciones e investigación son ajustables.'),
      task('stabilize', 'coas', 'Estabilizar orientación orbital', 'alignment', 'Mantén la referencia en 90° ±5° antes de confirmar.', 90),
      task('orbit', 'propulsion', 'Ejecutar frenado orbital', 'choice', 'El motor funciona, la orientación está corregida y los sistemas esenciales reciben energía. ¿Cómo entramos en órbita?', 'Encender para reducir la velocidad', ['Encender para reducir la velocidad', 'Apagar navegación y acelerar', 'Esperar sin modificar la trayectoria']),
    ],
  },
  {
    id: 4, title: 'El aterrizaje', subtitle: 'Primeros pasos en la Luna',
    intro: 'Selecciona una zona ficticia cercana al polo sur. Prepara el módulo, controla el descenso y realiza una primera salida segura.',
    summary: 'Controlaste la velocidad con propulsión. La gravedad lunar es menor que la terrestre. El escenario y los límites del aterrizaje son un modelo educativo.',
    tasks: [
      task('site', 'lander', 'Elegir una zona de aterrizaje', 'site', 'A: amplia y poco iluminada. B: más iluminación y zona estrecha. C: terreno accidentado y sombras. La elección afecta el descenso y la energía de la base.'),
      task('module', 'lander', 'Preparar el módulo lunar', 'checks', 'El módulo tiene sus propios depósitos. Confirma cada sistema.', ['Propulsión y combustible', 'Navegación y comunicaciones', 'Equipo de superficie'], ['Propulsión y combustible', 'Navegación y comunicaciones', 'Equipo de superficie']),
      task('landing', 'lander', 'Realizar un aterrizaje suave', 'landing', 'Controla empuje y desplazamiento. Mantén baja la velocidad al tocar el suelo.'),
      task('eva-check', 'module', 'Preparar el traje y la esclusa', 'checks', 'Verifica traje y presión antes de abrir. Titus usa un modo superficial ficticio.', ['Reserva del traje', 'Casco sellado', 'Esclusa despresurizada'], ['Reserva del traje', 'Casco sellado', 'Esclusa despresurizada']),
      task('observe', 'regolith', 'Observar una roca de entrenamiento', 'choice', 'Camina hasta la zona marcada. La textura contiene fragmentos finos y gruesos. ¿Qué puedes concluir con una observación visual?', 'Describir la textura y registrar el lugar', ['Conocer toda la composición por el color', 'Describir la textura y registrar el lugar', 'Afirmar que contiene agua potable']),
      task('return', 'module', 'Regresar al módulo', 'choice', 'Has registrado la observación. Confirma el procedimiento de entrada.', 'Cerrar esclusa y recuperar presión', ['Cerrar esclusa y recuperar presión', 'Abrir ambas puertas a la vez']),
    ],
  },
  {
    id: 5, title: 'Un nuevo hogar', subtitle: 'Estableciendo la estación lunar',
    intro: 'Módulos de carga enviados antes de nuestra expedición ficticia contienen el hábitat y el equipo. Conéctalos para establecer el puesto avanzado.',
    summary: 'La estación Lunaria está operativa. Energía, aire y agua dependen de equipos y mantenimiento. Analizaste una muestra mediante un instrumento simulado.',
    tasks: [
      task('habitat', 'habitat', 'Inspeccionar hábitat prefabricado', 'checks', 'Comprueba la estructura y el ambiente interior.', ['Estructura intacta', 'Sensores y presión', 'Inventario de carga'], ['Estructura intacta', 'Sensores y presión', 'Inventario de carga']),
      task('solar', 'solar', 'Conectar paneles y baterías', 'choice', 'La iluminación es variable. ¿Cómo suministrar energía durante la sombra?', 'Conectar paneles a baterías', ['Conectar paneles a baterías', 'Esperar energía solar durante la oscuridad', 'Encender todo sin respaldo']),
      task('life', 'life', 'Activar soporte vital', 'checks', 'Activar el equipo consume 10 unidades de energía.', ['Circulación de aire', 'Control de oxígeno y CO₂', 'Control térmico'], ['Circulación de aire', 'Control de oxígeno y CO₂', 'Control térmico']),
      task('water', 'storage', 'Priorizar agua y recuperación', 'choice', 'Recuperar agua requiere energía y agua usada. Hay 15 unidades recuperables en el equipo.', 'Consumo humano primero y recuperación controlada', ['Toda el agua para experimentos', 'Consumo humano primero y recuperación controlada', 'Crear agua sin equipo']),
      task('surface-suit', 'module', 'Verificar traje para la recolección', 'checks', 'Prepara una salida corta a la zona de muestras.', ['Aire del traje', 'Sellos comprobados', 'Ruta de regreso'], ['Aire del traje', 'Sellos comprobados', 'Ruta de regreso']),
      task('sample', 'regolith', 'Recoger muestra de regolito', 'collect', 'Recoge una muestra etiquetada de este sitio ficticio.'),
      task('analysis', 'lab', 'Analizar y registrar la muestra', 'analysis', 'El instrumento simulado detecta fragmentos de roca y polvo. Selecciona la clasificación compatible.', 'Regolito', ['Regolito', 'Agua potable', 'Metal puro']),
    ],
  },
  { id: 6, title: 'Operaciones lunares', subtitle: 'Explorar, mantener e investigar',
    intro: 'Completa tres ciclos de operaciones y tres actividades científicas o de mantenimiento. Cada ciclo es un turno del simulador. Consulta los costos antes de actuar.',
    summary: 'Has mantenido la estación y realizado investigación. Puedes continuar explorando.',
    tasks: [],
  },
];

export const levelById = id => levels.find(level => level.id === id);
export const nextObjective = state => levelById(state.currentLevel)?.tasks.find(task => !state.completedObjectives.includes(task.id)) ?? null;

