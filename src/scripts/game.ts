// Pure game logic for "Bump Dungeon" --- no DOM here, so this file is what
// spec/game.test.ts exercises directly. main.ts is the only thing that
// touches the page.

export type Pos = { x: number; y: number };

export interface Enemy {
  pos: Pos;
  hp: number;
  maxHp: number;
  atk: number;
  exp: number;
}

export type Status = "playing" | "won" | "lost";

export interface Player {
  pos: Pos;
  hp: number;
  maxHp: number;
  level: number;
  exp: number;
}

export interface GameState {
  status: Status;
  player: Player;
  enemies: Enemy[];
  battle: number | null;
  // The step that walked the player into this fight, so a clean flee has a
  // "back" that means something on an open map --- see PROCESS.md.
  approach: Pos | null;
}

const WALL = "#";
const EXIT = "X";
const EXP_PER_LEVEL = 3;

// A small open room, one wall with two gaps down into a second room. Either
// gap lands you next to an enemy, so at least one fight is unavoidable, but
// the boss guarding the exit's other side is optional --- a stranger can
// finish without it, and a player who grinds the weak enemy for a level can
// choose to take it on.
export const MAP = [
  "###########",
  "#P..e.....#",
  "#.#######.#",
  "#.........#",
  "#e......HX#",
  "###########",
];

function findChar(ch: string): Pos {
  for (let y = 0; y < MAP.length; y++) {
    const x = MAP[y].indexOf(ch);
    if (x !== -1) return { x, y };
  }
  throw new Error(`map has no '${ch}'`);
}

function findAllChars(ch: string): Pos[] {
  const found: Pos[] = [];
  for (let y = 0; y < MAP.length; y++) {
    for (let x = 0; x < MAP[y].length; x++) {
      if (MAP[y][x] === ch) found.push({ x, y });
    }
  }
  return found;
}

export function createInitialState(): GameState {
  const weak = findAllChars("e").map((pos) => ({ pos, hp: 3, maxHp: 3, atk: 1, exp: 3 }));
  const boss = findAllChars("H").map((pos) => ({ pos, hp: 6, maxHp: 6, atk: 2, exp: 0 }));
  return {
    status: "playing",
    player: { pos: findChar("P"), hp: 6, maxHp: 6, level: 1, exp: 0 },
    enemies: [...weak, ...boss],
    battle: null,
    approach: null,
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
  if (enemyIndex !== -1) return { ...state, battle: enemyIndex, approach: { x: dx, y: dy } };

  const player = { ...state.player, pos: { x, y } };
  const status: Status = tileAt(x, y) === EXIT ? "won" : state.status;
  return { ...state, player, status };
}

export type Rng = () => number;

function roll(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

// A level is worth something concrete: the roll a fight is decided on shifts
// up with it, so grinding the weak enemy is a real hedge before the boss.
function gainExp(player: Player, exp: number): Player {
  const total = player.exp + exp;
  const level = 1 + Math.floor(total / EXP_PER_LEVEL);
  if (level <= player.level) return { ...player, exp: total };
  const maxHp = player.maxHp + 2 * (level - player.level);
  return { ...player, exp: total, level, maxHp, hp: maxHp };
}

export function attack(state: GameState, rng: Rng = Math.random): GameState {
  if (state.battle === null || state.status !== "playing") return state;

  const enemies = state.enemies.map((e) => ({ ...e }));
  const enemy = enemies[state.battle];
  enemy.hp -= roll(rng, state.player.level, state.player.level + 2);

  if (enemy.hp <= 0) {
    const player = gainExp(state.player, enemy.exp);
    return { ...state, enemies, player, battle: null, approach: null };
  }

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
    // A clean getaway steps back the way the player actually came in, using
    // the approach direction recorded when the fight started --- not a
    // hardcoded "west", which is all the old one-way corridor ever needed
    // and which sends you into a wall on an open map you can enter a fight
    // from any side of. See PROCESS.md.
    const approach = state.approach ?? { x: 1, y: 0 };
    const back = { x: state.player.pos.x - approach.x, y: state.player.pos.y - approach.y };
    const player = tileAt(back.x, back.y) === WALL ? state.player : { ...state.player, pos: back };
    return { ...state, player, battle: null, approach: null };
  }

  const hp = state.player.hp - enemy.atk;
  const player = { ...state.player, hp };
  const status: Status = hp <= 0 ? "lost" : state.status;
  return { ...state, player, battle: null, approach: null, status };
}
