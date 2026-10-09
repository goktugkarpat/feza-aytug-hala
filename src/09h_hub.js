/* HUB (geçici) */
const HUB = (() => {
  'use strict';
  function say(key, prio = 3) { if (typeof AUD !== 'undefined' && AUD.LINES && AUD.LINES[key] && AUD.say) return AUD.say(key, { prio }) || 0; return 0; }
  function open(id, st) { if (typeof GAME !== 'undefined') GAME.emit('toast', { text: id }); }
  return { open, say };
})();
