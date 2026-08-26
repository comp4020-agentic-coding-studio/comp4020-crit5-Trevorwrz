import { MAP, createInitialState, move, type GameState } from "./game";

const stage = document.getElementById("stage") as HTMLElement;
const hpBar = document.getElementById("hp-bar") as HTMLElement;
const levelBar = document.getElementById("level-bar") as HTMLElement;
const logBar = document.getElementById("log") as HTMLElement;
const endPanel = document.getElementById("end") as HTMLElement;
const endMessage = document.getElementById("end-message") as HTMLElement;
const restartBtn = document.getElementById("restart-btn") as HTMLButtonElement;

let state = createInitialState();

const KEYS: Record<string, [number, number]> = {
  ArrowUp: [0, -1],
  w: [0, -1],
  ArrowDown: [0, 1],
  s: [0, 1],
  ArrowLeft: [-1, 0],
  a: [-1, 0],
  ArrowRight: [1, 0],
  d: [1, 0],
};

const EXP_PER_LEVEL = 3;

function glyphAt(x: number, y: number, s: GameState): string {
  if (s.player.pos.x === x && s.player.pos.y === y) return "\u{1F9CD}";
  const enemy = s.enemies.find((e) => e.hp > 0 && e.pos.x === x && e.pos.y === y);
  if (enemy) return enemy.maxHp > 3 ? "\u{1F479}" : "\u{1F400}";
  return MAP[y][x] === "X" ? "\u{1F6AA}" : "";
}

function render() {
  stage.style.gridTemplateColumns = `repeat(${MAP[0].length}, 1fr)`;
  stage.innerHTML = "";
  for (let y = 0; y < MAP.length; y++) {
    for (let x = 0; x < MAP[y].length; x++) {
      const cell = document.createElement("div");
      const ch = MAP[y][x];
      cell.className = ch === "#" ? "tile wall" : ch === "X" ? "tile exit" : "tile floor";
      if (state.player.pos.x === x && state.player.pos.y === y) cell.classList.add("here");
      cell.textContent = glyphAt(x, y, state);
      stage.appendChild(cell);
    }
  }

  const hp = Math.max(0, state.player.hp);
  hpBar.style.setProperty("--pct", `${(hp / state.player.maxHp) * 100}%`);
  hpBar.textContent = `${hp} / ${state.player.maxHp}`;

  const expIntoLevel = state.player.exp % EXP_PER_LEVEL;
  levelBar.textContent = `Lv ${state.player.level} — ${expIntoLevel} / ${EXP_PER_LEVEL} exp`;

  logBar.textContent = state.log ?? "";

  endPanel.hidden = state.status === "playing";
  if (state.status === "won") endMessage.textContent = "Through the door.";
  if (state.status === "lost") endMessage.textContent = "You fell.";
}

function apply(next: GameState) {
  state = next;
  render();
}

stage.tabIndex = 0;
stage.addEventListener("keydown", (e) => {
  const delta = KEYS[e.key];
  if (!delta) return;
  e.preventDefault();
  apply(move(state, delta[0], delta[1]));
});

restartBtn.addEventListener("click", () => apply(createInitialState()));

render();
stage.focus();
