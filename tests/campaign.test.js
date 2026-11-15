import test from 'node:test';
import assert from 'node:assert/strict';
import { campaignAtLevel, campaignReducer, createCampaign, validateCampaign } from '../src/game/campaign.js';
import { levels } from '../src/data/levelDefinitions.js';
import { createLanding, stepLanding } from '../src/game/landingSimulation.js';
import { scienceFacts } from '../src/data/scienceFacts.js';

function answer(state, task) {
  let next = state;
  if (task.kind === 'launch') next = campaignReducer(next, { type: 'flight', value: { ...next.flight, status: 'success' } });
  if (task.kind === 'landing') next = campaignReducer(next, { type: 'landing', value: { ...next.landing, status: 'success' } });
  const value = task.kind === 'allocation'
    ? { life: 20, navigation: 15, propulsion: 20, communication: 0, research: 5 }
    : task.kind === 'site' ? 'B'
    : task.kind === 'collect' ? true
    : task.answer;
  let result = campaignReducer(next, { type: 'answer', id: task.id, stationId: task.stationId, value });
  if (result.phase === 'launchCinematic') result = campaignReducer(result, { type: 'launchCinematicDone' });
  return result;
}

test('a new game plays the opening once and a saved game stays out of it', () => {
  const fresh = createCampaign();
  assert.equal(fresh.phase, 'cinematic');
  const playing = campaignReducer(fresh, { type: 'cinematicDone' });
  assert.equal(playing.phase, 'active');
  assert.equal(playing.flags.boarded, true);
  assert.match(playing.message, /soporte vital/);
  assert.equal(campaignReducer(playing, { type: 'cinematicDone' }), playing);
  const saved = validateCampaign(JSON.parse(JSON.stringify(playing)));
  assert.equal(saved.phase, 'active');
  assert.equal(saved.flags.boarded, true);
});

test('level 1 stays on the pad until the ascent succeeds, then waits for the launch film', () => {
  let state = campaignReducer(createCampaign(), { type: 'cinematicDone' });
  state = answer(state, state && levels[0].tasks[0]);
  assert.equal(state.phase, 'active');
  assert.match(state.message, /soporte vital está preparado/);
  for (const task of levels[0].tasks.slice(1, 4)) state = answer(state, task);
  assert.equal(state.phase, 'active');
  assert.equal(state.completedLevels.includes(1), false);
  const denied = campaignReducer(state, { type: 'answer', id: 'launch', stationId: 'propulsion', value: true });
  assert.equal(denied.phase, 'active');
  assert.equal(denied.completedObjectives.includes('launch'), false);
  const flying = campaignReducer(state, { type: 'flight', value: { ...state.flight, status: 'success' } });
  const filmed = campaignReducer(flying, { type: 'answer', id: 'launch', stationId: 'propulsion', value: true });
  assert.equal(filmed.phase, 'launchCinematic');
  assert.equal(filmed.completedLevels.includes(1), false);
  assert.equal(validateCampaign(JSON.parse(JSON.stringify(filmed))).phase, 'launchCinematic');
  const done = campaignReducer(filmed, { type: 'launchCinematicDone' });
  assert.equal(done.phase, 'complete');
  assert.equal(done.completedLevels.includes(1), true);
  const level2 = campaignReducer(campaignReducer(done, { type: 'advance' }), { type: 'begin' });
  assert.equal(level2.currentLevel, 2);
  assert.match(levels[1].intro, /vuelo hacia la Luna/);
});

test('wrong checks and skipped stations do not complete an objective', () => {
  let state = campaignReducer(createCampaign(), { type: 'cinematicDone' });
  state = campaignReducer(state, { type: 'begin' });
  const partial = campaignReducer(state, { type: 'answer', id: 'air', stationId: 'oxygen', value: ['Oxígeno disponible'] });
  assert.deepEqual(partial.completedObjectives, []);
  assert.match(partial.message, /Titus/);
  const skipped = campaignReducer(state, { type: 'answer', id: 'power', stationId: 'breakers', value: 'Principal y respaldo independientes' });
  assert.match(skipped.message, /objetivo activo/);
  assert.equal(skipped.completedObjectives.length, 0);
});

test('a scripted run finishes five levels and three operation cycles', () => {
  let state = campaignReducer(createCampaign(), { type: 'cinematicDone' });
  state = campaignReducer(state, { type: 'begin' });
  for (const level of levels.filter(item => item.id < 6)) {
    assert.equal(state.currentLevel, level.id);
    assert.equal(state.phase, 'active');
    for (const task of level.tasks) {
      state = answer(state, task);
      assert.ok(state.completedObjectives.includes(task.id), task.id + ' ' + state.message);
    }
    assert.equal(state.phase, 'complete');
    state = campaignReducer(state, { type: 'advance' });
    state = campaignReducer(state, { type: 'begin' });
  }
  assert.equal(state.currentLevel, 6);
  const act = name => {
    state = campaignReducer(state, { type: 'operation', name });
    assert.equal(state.phase, 'active', name + ' ' + state.message);
  };
  act('research'); act('repair'); act('oxygen'); act('cycle');
  act('shelter'); act('research'); act('save'); act('cycle');
  act('research');
  state = campaignReducer(state, { type: 'operation', name: 'cycle' });
  assert.equal(state.phase, 'complete');
  assert.ok(state.completedLevels.includes(6));
  assert.equal(validateCampaign(JSON.parse(JSON.stringify(state))).currentLevel, 6);
});

test('operations reject a repeated action and corrupt saves', () => {
  let state = campaignReducer(campaignAtLevel(6), { type: 'begin' });
  state = campaignReducer(state, { type: 'operation', name: 'save' });
  const energy = state.resources.base.energy;
  const again = campaignReducer(state, { type: 'operation', name: 'save' });
  assert.equal(again.resources.base.energy, energy);
  assert.match(again.message, /ciclo/);
  assert.equal(validateCampaign(null), null);
  assert.equal(validateCampaign({ version: 1, currentLevel: 9 }), null);
  assert.equal(campaignAtLevel(4).phase, 'briefing');
  assert.deepEqual(campaignAtLevel(4).completedLevels, [1, 2, 3]);
});

test('landing uses lunar gravity and a measurable safe touchdown', () => {
  const falling = stepLanding({ ...createLanding('A'), status: 'flying', altitude: 10, vy: 0, x: 0, vx: 0, throttle: 0, fuel: 40, steer: 0 }, 0.05);
  assert.ok(falling.vy > 0);
  const landed = stepLanding({ ...createLanding('A'), status: 'flying', altitude: 0.02, vy: 1, x: 0, vx: 0, throttle: 0, fuel: 10, steer: 0 }, 0.05);
  assert.equal(landed.status, 'success');
  const missed = stepLanding({ ...createLanding('A'), status: 'flying', altitude: 0.02, vy: 1, x: 80, vx: 0, throttle: 0, fuel: 10, steer: 0 }, 0.05);
  assert.equal(missed.status, 'failed');
});

test('Titus has at least ten sourced facts', () => {
  assert.ok(scienceFacts.length >= 10);
  for (const fact of scienceFacts) {
    assert.equal(fact.verified, true);
    assert.match(fact.sourceUrl, /^https:\/\//);
    assert.ok(fact.text.length > 20);
  }
});
