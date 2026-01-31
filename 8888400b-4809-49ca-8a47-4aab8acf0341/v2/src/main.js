import MinecraftGame from "./game/MinecraftGame.js";

let shown = false;
addEventListener("error", (e) => {
  if (shown) return;
  shown = true;
  alert(e.message);
});

const game = new MinecraftGame();
window.game = game; // optional for debugging
