// Pure game logic for "Bump Dungeon" --- no DOM here, so this file is what
// spec/game.test.ts exercises directly. main.ts is the only thing that
// touches the page.

export type Pos = { x: number; y: number };

export interface Enemy {
  pos: Pos;
  hp: number;
  maxHp: number;
  atk: number;
}

export type Status = "playing" | "won" | "lost";

export interface GameState {
  status: Status;
  player: { pos: Pos; hp: number; maxHp: number };
  enemies: Enemy[];
  battle: number | null;
}

const WALL = "#";
const EXIT = "X";

// A single corridor: every step right is progress toward the door, through
// both enemies, with no branch to get lost in. An earlier branching layout
// let a scripted playthrough wander into a dead end that looked closer to the
// door than it was --- see PROCESS.md.
export const MAP = ["#########", "#P.E.E.X#", "#########"];

function findChar(ch: string): Pos {
  for (let y = 0; y < MAP.length; y++) {
    const x = MAP[y].indexOf(ch);
    if (x !== -1) return { x, y };
  }
  throw new Error(`map has no '${ch}'`);
}

export function createInitialState(): GameState {
  const enemies: Enemy[] = [];
  for (let y = 0; y < MAP.length; y++) {
    for (let x = 0; x < MAP[y].length; x++) {
      if (MAP[y][x] === "E") {
        const isFirst = enemies.length === 0;
        enemies.push({
          pos: { x, y },
          hp: isFirst ? 3 : 4,
          maxHp: isFirst ? 3 : 4,
          atk: isFirst ? 1 : 2,
        });
      }
    }
  }
  return {
    status: "playing",
    player: { pos: findChar("P"), hp: 6, maxHp: 6 },
    enemies,
    battle: null,
  };
}

function tileAt(x: number, y: number): string {
  return MAP[y]?.[x] ?? WALL;
}

function livingEnemyAt(state: GameState, x: number, y: number): number {
  return state.enemies.findIndex((e) => e.hp > 0 && e.pos.x === x && e.pos.y === y);
}

export function move(state: GameState, dx: number, dy: number): GameState {
  if (state.status !== "playing" || state.battle !== null) return state;

  const x = state.player.pos.x + dx;
  const y = state.player.pos.y + dy;
  if (tileAt(x, y) === WALL) return state;

  const enemyIndex = livingEnemyAt(state, x, y);
  if (enemyIndex !== -1) return { ...state, battle: enemyIndex };

  const player = { ...state.player, pos: { x, y } };
  const status: Status = tileAt(x, y) === EXIT ? "won" : state.status;
  return { ...state, player, status };
}

export type Rng = () => number;

function roll(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function attack(state: GameState, rng: Rng = Math.random): GameState {
  if (state.battle === null || state.status !== "playing") return state;

  const enemies = state.enemies.map((e) => ({ ...e }));
  const enemy = enemies[state.battle];
  enemy.hp -= roll(rng, 1, 3);

  if (enemy.hp <= 0) return { ...state, enemies, battle: null };

  const hp = state.player.hp - roll(rng, enemy.atk, enemy.atk + 1);
  const player = { ...state.player, hp };
  const status: Status = hp <= 0 ? "lost" : state.status;
  return { ...state, enemies, player, status };
}

export function flee(state: GameState, rng: Rng = Math.random): GameState {
  if (state.battle === null || state.status !== "playing") return state;

  const enemy = state.enemies[state.battle];
  const caught = rng() < 0.5;

  if (!caught) {
    // A clean getaway actually goes somewhere: back one tile, the way you
    // came. Without this, fleeing was a no-op that just skipped a turn ---
    // only obvious once you'd clicked it and watched nothing happen.
    const back = { x: state.player.pos.x - 1, y: state.player.pos.y };
    const player = tileAt(back.x, back.y) === WALL ? state.player : { ...state.player, pos: back };
    return { ...state, player, battle: null };
  }

  const hp = state.player.hp - enemy.atk;
  const player = { ...state.player, hp };
  const status: Status = hp <= 0 ? "lost" : state.status;
  return { ...state, player, battle: null, status };
}
