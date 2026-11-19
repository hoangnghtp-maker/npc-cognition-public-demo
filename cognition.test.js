'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const N = require('./cognition');
const { fixture } = require('./demo');
test('context excludes private memories and player knowledge', () => {
  const { world, command } = fixture(); world.knowledge.secret = 'HIDDEN_KNOWLEDGE';
  const req = JSON.stringify(N.request(world, command));
  assert(!req.includes('PRIVATE_FIXTURE_ONLY')); assert(!req.includes('HIDDEN_KNOWLEDGE'));
});
test('valid disagreement is accepted without changing original world', () => {
  const { world, command, proposal } = fixture(), before = structuredClone(world);
  assert(N.validate(world, command, proposal).ok); assert.deepEqual(world, before);
});
for (const [name, patch] of Object.entries({
  'extra world patch': { world_patch: { gold: 999 } },
  'wrong speaker': { npc_id: 'scout' }, 'invented evidence': { evidence_ids: ['fake:event'] },
  'invented priority': { priority_id: 'become_king' }, 'markup': { speech: '<script>bad</script>' },
  'oversized speech': { speech: 'x'.repeat(1101) }, 'empty speech': { speech: ' ' },
  'invalid stance': { stance: 'execute' }
})) test('rejects ' + name, () => {
  const { world, command, proposal } = fixture();
  assert.equal(N.validate(world, command, { ...proposal, ...patch }).ok, false);
});
test('malformed JSON is rejected', () => {
  const { world, command } = fixture(); assert.equal(N.validate(world, command, '{').reason, 'invalid_json');
});
test('movement invalidates a proposal', () => {
  const { world, command, proposal } = fixture(); world.location = 'forest';
  assert.equal(N.commit(world, command, proposal).ok, false);
});
test('resentment requires a boundary-aware response', () => {
  const { world, command, proposal } = fixture(); world.resentment.keeper = 5;
  proposal.context_id = N.request(world, command).context_id;
  assert.equal(N.validate(world, command, proposal).ok, false);
  assert(N.validate(world, command, { ...proposal, priority_id: 'boundary', stance: 'refuse' }).ok);
});
test('commit archives speech without granting items or knowledge, and rejects replay', () => {
  const { world, command, proposal } = fixture(), before = structuredClone(world);
  const result = N.commit(world, command, JSON.stringify(proposal)); assert(result.ok);
  assert.deepEqual(result.world.inventory, world.inventory); assert.deepEqual(result.world.knowledge, world.knowledge);
  assert.equal(result.world.dialogue.keeper[0].authority, 'ATTRIBUTED_SPEECH_NOT_WORLD_FACT');
  assert.equal(N.commit(result.world, command, proposal).ok, false); assert.deepEqual(world, before);
});
test('dialogue is isolated by speaker and survives JSON save/load', () => {
  const { world, command, proposal } = fixture(); const next = JSON.parse(JSON.stringify(N.commit(world, command, proposal).world));
  assert.equal(N.request(next, command).remembered_dialogue.length, 1);
  assert.equal(N.request(next, { ...command, npc_id: 'scout' }).remembered_dialogue.length, 0);
});
test('archive and prompt stay bounded after many turns', () => {
  let { world, command, proposal } = fixture();
  for (let i = 0; i < 45; i++) {
    proposal.context_id = N.request(world, command).context_id;
    world = N.commit(world, command, proposal).world;
  }
  assert.equal(world.dialogue.keeper.length, N.CAP);
  assert.equal(N.request(world, command).remembered_dialogue.length, 6);
});
