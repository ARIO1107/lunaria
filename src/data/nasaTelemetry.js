/**
 * Historical references are separate from the game's deliberately simplified physics.
 * A pending value is a requirement from the brief, NOT a verified NASA measurement.
 * Units are in each field name. Never use suit pressure as remaining oxygen quantity.
 */
export const NASA_SOURCES = {
  timeline: {
    title: 'NASA SP-4029 · Apollo 11 Timeline',
    url: 'https://www.nasa.gov/wp-content/uploads/static/history/SP-4029/Apollo_11i_Timeline.htm',
  },
  missionReport: {
    title: 'Apollo 11 Mission Report · MSC-00171',
    url: 'https://www.nasa.gov/wp-content/uploads/static/apollo50th/pdf/A11_MissionReport.pdf',
  },
  moon: { title: 'NASA · Moon facts', url: 'https://science.nasa.gov/moon/facts/' },
};

export const nasaTelemetry = {
  launch: {
    mission: 'Apollo 11 / AS-506',
    date: '1969-07-16',
    source: NASA_SOURCES.timeline,
    verified: {
      mach1TimeS: 66.3,
      maxQTimeS: 83,
      maxQPressureLbFt2: 735.17,
      centerEngineCutoffTimeS: 135.2,
      outboardEngineCutoffTimeS: 161.63,
      separationTimeS: 162.3,
      peakAccelerationG: 3.94,
      peakAccelerationTimeS: 161.71,
      earthOrbitInsertionTimeS: 709.33,
    },
    referenceApproximate: { initialThrustMN: 33.4, f1EngineCount: 5, parkingOrbitKm: 185 },
    note: 'Max Q fue a T+83 s, no a T+66 s (Mach 1). El acelerador variable, el calor y las decisiones manuales son adaptaciones lúdicas; los F-1 no se regulaban así en vuelo.',
  },
  docking: {
    pendingVerification: { translunarSpeedKmh: 39400, rotationDeg: 180, minDockingSpeedMs: 0.03, maxDockingSpeedMs: 0.15, maxAlignmentDeg: 2 },
    sourceToReview: NASA_SOURCES.missionReport,
    note: 'Rangos del brief pendientes de cotejar con manuales de acoplamiento; no son mediciones verificadas de Apolo 11.',
  },
  lunarOrbit: {
    verified: { burnDurationS: 357.53 },
    source: NASA_SOURCES.timeline,
    pendingVerification: { altitudeKm: 110, deltaVMs: 900 },
    note: '357,53 s se obtiene de 075:55:47.90 menos 075:49:50.37. La avería por radiación es ficción educativa.',
  },
  landing: {
    verified: { descentInitialAltitudeM: 15240 },
    source: NASA_SOURCES.timeline,
    referenceApproximate: { lunarGravityMs2: 1.62 },
    pendingVerification: { minThrottle: 0.1, maxThrottle: 1, maxSlopeDeg: 12, maxVerticalSpeedMs: 0.9, fuelMarginS: 25 },
    note: '50.000 pies = 15.240 m. Los límites de victoria y margen de combustible requieren contexto; no se presentan como límites universales reales.',
  },
  eva: {
    referenceApproximate: { lunarGravityMs2: 1.62 },
    pendingVerification: { surfaceSunC: 120, surfaceShadowC: -130, suitPressureAtm: 0.26 },
    sourceToReview: NASA_SOURCES.moon,
    note: 'La temperatura superficial depende del lugar y hora. 0,26 atm es presión, no reserva de oxígeno. Astrobee/Titus es una referencia moderna, no equipo Apolo.',
  },
};

export const GAME_TUNING = Object.freeze({
  missionTimeScale: 3,
  maxQStartS: 60,
  maxQEndS: 105,
  maxQSafeThrottle: 0.7,
  minimumMeanThrottle: 0.7,
  separationGraceS: 15,
  astronautSpeed: 175,
});
