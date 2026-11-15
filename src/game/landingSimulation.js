export const landingSites = {
  A: { title: 'A · Llanura', center: 0, width: 54, light: 'Baja', energy: 65 },
  B: { title: 'B · Cresta iluminada', center: 16, width: 38, light: 'Mayor', energy: 85 },
  C: { title: 'C · Borde accidentado', center: -22, width: 26, light: 'Variable', energy: 55 },
};
export function createLanding(site = 'A') {
  return { status: 'ready', altitude: 120, vy: 0, x: 0, vx: 0, fuel: 100, throttle: 0, steer: 0, site };
}
export function stepLanding(state, dt) {
  if (state.status !== 'flying' || !Number.isFinite(dt) || dt <= 0) return state;
  const time = Math.min(dt, .05);
  const throttle = state.fuel > 0 ? Math.max(0, Math.min(1, state.throttle)) : 0;
  const vy = state.vy + (1.62 - throttle * 4.2) * time;
  const vx = Math.max(-8, Math.min(8, state.vx + state.steer * 1.8 * time));
  const altitude = Math.max(0, state.altitude - vy * time);
  const x = state.x + vx * time;
  const next = { ...state, altitude, vy, vx, x, fuel: Math.max(0, state.fuel - throttle * 1.3 * time) };
  if (Math.abs(x) > 100 || altitude > 180) return { ...next, status: 'failed' };
  if (altitude === 0) {
    const site = landingSites[state.site];
    const safe = Math.abs(x - site.center) <= site.width / 2 && Math.abs(vy) <= 3 && Math.abs(vx) <= 2 && next.fuel > 0;
    return { ...next, status: safe ? 'success' : 'failed' };
  }
  return next;
}

