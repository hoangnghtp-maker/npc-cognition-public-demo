'use strict';
const N = require('./cognition');
function fixture() {
  const world = { turn: 0, location: 'village', inventory: [], knowledge: {},
    private_memories: { keeper: ['PRIVATE_FIXTURE_ONLY'] }, resentment: {}, dialogue: {},
    npcs: {
      keeper: { name: 'The Keeper', traits: ['thoughtful'], location: 'village' },
      scout: { name: 'The Scout', traits: ['curious'], location: 'village' }
    }
  };
  const command = { type: 'talk', npc_id: 'keeper', text: 'Does effort matter?' };
  const req = N.request(world, command);
  const proposal = { schema_version: N.VERSION, context_id: req.context_id, npc_id: 'keeper',
    stance: 'disagree', priority_id: 'own_judgment', subject: 'Effort',
    speech: 'I think progress matters even when someone else is faster.', gesture: 'pause', evidence_ids: ['scene:here'] };
  return { world, command, proposal };
}
if (require.main === module) {
  const { world, command, proposal } = fixture();
  console.log(JSON.stringify(N.commit(world, command, proposal), null, 2));
}
module.exports = { fixture };
