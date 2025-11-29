// ui.js

import { formatTime } from './utils.js';

export function updateHUD(player, gameTime) {
  document.getElementById('health-fill').style.width = `${player.health}%`;
  document.getElementById('respect-fill').style.width = `${player.respect}%`;
  document.getElementById('chaos-fill').style.width = `${player.chaos}%`;
  document.getElementById('clock').innerText = formatTime(gameTime);
}
