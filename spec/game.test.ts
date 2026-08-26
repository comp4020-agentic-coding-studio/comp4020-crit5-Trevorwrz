import { describe, expect, it } from "vitest";
import { attack, createInitialState, flee, move, type GameState } from "../src/scripts/game";

// Crit 5 spec: "it can be lost: a wrong move is possible, and play ends
// somewhere --- a win, a loss or a finish." These assert the ending rule
// directly on the state machine, not on the rendered page, so they survive a
// change of stack.

const alwaysMinRoll = () => 0; // deterministic: smallest damage roll each time

describe("crit 5 spec: the run ends somewhere", () => {
  it("driving the player's hp to zero in a fight ends the run in a loss", () => {
    let state = createInitialState();
    const bossIndex = state.enemies.length - 1;
    state = { ...state, battle: bossIndex };
    state.enemies[bossIndex] = { ...state.enemies[bossIndex], hp: 99, atk: 5 };

    state = attack(state, alwaysMinRoll);
    expect(state.status).toBe("playing");

    state = attack(state, alwaysMinRoll);
    expect(state.status).toBe("lost");
    expect(state.player.hp).toBeLessThanOrEqual(0);
  });

  it("reaching the door with nothing blocking it ends the run in a win", () => {
    let state = createInitialState();
    state = { ...state, player: { ...state.player, pos: { x: 8, y: 4 } }, enemies: [] };

    state = move(state, 1, 0); // (8,4) -> (9,4), the door tile
    expect(state.status).toBe("won");
  });

  it("a wrong move is possible: the room wall doesn't move you", () => {
    let state = createInitialState();
    const before = state.player.pos;

    state = move(state, 0, -1); // into the wall above the start
    expect(state.player.pos).toEqual(before);
  });
});

// The JRPG-style hook this rewrite added: beating an enemy is worth something
// concrete on the next fight, not just a closed battle panel.

describe("crit 5 spec: levelling up changes the odds, not just a number", () => {
  it("defeating an enemy grants exp, and enough exp levels the player up", () => {
    let state = createInitialState();
    state = { ...state, battle: 0 };
    state.enemies[0] = { ...state.enemies[0], hp: 1, exp: 3 };

    state = attack(state, alwaysMinRoll);

    expect(state.battle).toBeNull();
    expect(state.player.level).toBe(2);
    expect(state.player.maxHp).toBeGreaterThan(6);
    expect(state.player.hp).toBe(state.player.maxHp); // levelling heals
  });

  it("a higher level rolls higher damage against the same enemy", () => {
    const base = createInitialState();
    const levelled = { ...base, player: { ...base.player, level: 3 } };

    const lowRollDamageAtLevel1 = (() => {
      let s: GameState = { ...base, battle: 0 };
      s.enemies = [{ ...s.enemies[0], hp: 99 }, ...s.enemies.slice(1)];
      const before = s.enemies[0].hp;
      s = attack(s, alwaysMinRoll);
      return before - s.enemies[0].hp;
    })();

    const lowRollDamageAtLevel3 = (() => {
      let s: GameState = { ...levelled, battle: 0 };
      s.enemies = [{ ...s.enemies[0], hp: 99 }, ...s.enemies.slice(1)];
      const before = s.enemies[0].hp;
      s = attack(s, alwaysMinRoll);
      return before - s.enemies[0].hp;
    })();

    expect(lowRollDamageAtLevel3).toBeGreaterThan(lowRollDamageAtLevel1);
  });
});

// The corridor's flee fix (retreat one tile) assumed every fight was walked
// into from the east, which was true of a one-way corridor and stopped being
// true the moment the map opened up. This pins the fix that replaced it.

describe("crit 5 spec: fleeing retreats the way you actually came in", () => {
  it("a clean flee steps back opposite the approach direction, not a fixed direction", () => {
    let state = createInitialState();
    state = { ...state, player: { ...state.player, pos: { x: 1, y: 3 } } };

    state = move(state, 0, 1); // walks down into the enemy sitting at (1,4)
    expect(state.battle).not.toBeNull();
    expect(state.player.pos).toEqual({ x: 1, y: 3 }); // not moved into the fight yet

    const notCaught = () => 0.9;
    state = flee(state, notCaught);

    expect(state.battle).toBeNull();
    expect(state.player.pos).toEqual({ x: 1, y: 2 }); // back the way it came: up, not west into a wall
  });
});
