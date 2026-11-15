import test from 'node:test';
import assert from 'node:assert/strict';
import { createLifeSupport, lifeProblem, lifeReadout, LIFE_READY } from '../src/game/lifeSupport.js';
import { campaignReducer, createCampaign } from '../src/game/campaign.js';

test('life support stays unready until fan, oxygen and CO2 are all on', () => {
  const off = createLifeSupport();
  assert.equal(lifeReadout(off).flow, 0);
  assert.match(lifeProblem(off).line, /ventilación está apagada/);
  const fan = { ...off, fan: true };
  assert.equal(lifeReadout(fan).flow, 20);
  assert.match(lifeProblem(fan).line, /suministro de oxígeno/);
  const supplied = { ...fan, valve: true };
  assert.equal(lifeReadout(supplied).supply, 100);
  assert.match(lifeProblem(supplied).line, /CO₂/);
  const ready = { ...supplied, scrubber: true };
  assert.equal(lifeProblem(ready), null);
  assert.equal(lifeReadout(ready).co2, 12);
  assert.equal(lifeReadout(ready).circulating, true);
});

test('the life-support console completes only with a stable result', () => {
  let state = campaignReducer(createCampaign(), { type: 'cinematicDone' });
  const early = campaignReducer(state, { type: 'answer', id: 'air', stationId: 'oxygen', value: 'incompleto' });
  assert.equal(early.completedObjectives.includes('air'), false);
  state = { ...state, flags: { ...state.flags } };
  const guided = campaignReducer(state, { type: 'guide', id: 'life-arrive', message: 'Titus: ¡Aquí estamos! Este sistema nos ayuda a mantener condiciones adecuadas para respirar.' });
  const again = campaignReducer(guided, { type: 'guide', id: 'life-arrive', message: 'otra vez' });
  assert.equal(again, guided);
  const done = campaignReducer(guided, { type: 'answer', id: 'air', stationId: 'oxygen', value: LIFE_READY });
  assert.equal(done.completedObjectives.includes('air'), true);
  assert.match(done.message, /iremos a comprobar la energía/);
});
