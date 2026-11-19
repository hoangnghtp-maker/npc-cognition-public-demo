'use strict';
// Minimal adaptation of the owner's NPC cognition module. See README.
const { createHash } = require('node:crypto');
const clone = x => JSON.parse(JSON.stringify(x));
const VERSION = 'npc.demo.v1', CAP = 32;
const STANCES = ['engage', 'question', 'disagree', 'refuse', 'suggest', 'comfort', 'uncertain'];
const GESTURES = ['none', 'pause', 'nod', 'shake_head', 'look_at_player'];
function exact(x, keys) {
  return !!x && typeof x === 'object' && !Array.isArray(x) &&
    Object.keys(x).length === keys.length && keys.every(k => Object.hasOwn(x, k));
}
function request(world, command) {
  const npc = world.npcs[command.npc_id];
  if (command.type !== 'talk' || !npc || npc.location !== world.location) return null;
  const boundary = (world.resentment[command.npc_id] || 0) > 3;
  const body = {
    schema_version: VERSION, npc_id: command.npc_id,
    input: String(command.text || '').slice(0, 1200),
    speaker: { name: npc.name, traits: [...npc.traits] },
    priorities: boundary ? ['boundary', 'own_judgment'] : ['own_judgment'],
    evidence: [{ id: 'scene:here', kind: 'observation', text: world.location }],
    remembered_dialogue: clone((world.dialogue[command.npc_id] || []).slice(-6)),
    constraints: { boundary, player_claims: 'unverified', world_actions: 'speech_only' }
  };
  // Binding is an integrity/staleness check, not an authentication credential.
  body.context_id = createHash('sha256').update(JSON.stringify({ body, world })).digest('hex');
  return body;
}
function shape(p) {
  return exact(p, ['schema_version', 'context_id', 'npc_id', 'stance', 'priority_id', 'subject', 'speech', 'gesture', 'evidence_ids']) &&
    p.schema_version === VERSION && typeof p.context_id === 'string' && typeof p.npc_id === 'string' &&
    STANCES.includes(p.stance) && typeof p.priority_id === 'string' &&
    typeof p.subject === 'string' && p.subject.trim().length > 0 && p.subject.length <= 100 &&
    typeof p.speech === 'string' && p.speech.trim().length >= 8 && p.speech.length <= 1100 &&
    GESTURES.includes(p.gesture) && Array.isArray(p.evidence_ids) && p.evidence_ids.length <= 10 &&
    p.evidence_ids.every(x => typeof x === 'string');
}
function validate(world, command, proposal) {
  const req = request(world, command);
  let p = proposal;
  try { if (typeof p === 'string') p = JSON.parse(p); }
  catch { return { ok: false, reason: 'invalid_json' }; }
  if (!req || !shape(p)) return { ok: false, reason: 'invalid_proposal' };
  if (p.context_id !== req.context_id || p.npc_id !== req.npc_id)
    return { ok: false, reason: 'stale_or_wrong_speaker' };
  if (!req.priorities.includes(p.priority_id) || p.evidence_ids.some(id => !req.evidence.some(e => e.id === id)))
    return { ok: false, reason: 'evidence_or_priority_unavailable' };
  if (req.constraints.boundary && (p.priority_id !== 'boundary' || !['refuse', 'disagree', 'question'].includes(p.stance)))
    return { ok: false, reason: 'boundary_not_preserved' };
  if (/[<>]/.test(p.speech + p.subject)) return { ok: false, reason: 'markup_rejected' };
  return { ok: true, proposal: clone(p) };
}
function commit(world, command, proposal) {
  const checked = validate(world, command, proposal);
  if (!checked.ok) return checked;
  const next = clone(world), p = checked.proposal;
  next.dialogue[command.npc_id] = [...(next.dialogue[command.npc_id] || []), {
    player_text: command.text, reply: p.speech, subject: p.subject, stance: p.stance,
    authority: 'ATTRIBUTED_SPEECH_NOT_WORLD_FACT'
  }].slice(-CAP);
  next.turn += 1;
  return { ok: true, world: next };
}
module.exports = { VERSION, CAP, request, shape, validate, commit };
