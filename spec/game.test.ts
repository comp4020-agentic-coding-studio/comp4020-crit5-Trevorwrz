import { describe, expect, it } from "vitest";
import { attack, createInitialState, move } from "../src/scripts/game";

// Crit 5 spec: "it can be lost: a wrong move is possible, and play ends
// somewhere --- a win, a loss or a finish." These assert the ending rule
// directly on the state machine, not on the rendered page, so they survive a
// change of stack.

describe("crit 5 spec: the run ends somewhere", () => {
  it("driving the player's hp to zero in a fight ends the run in a loss", () => {
    let state = createInitialState();
    state = { ...state, battle: 0 };
    state.enemies[0] = { ...state.enemies[0], hp: 99, atk: 5 };

    const alwaysMinRoll = () => 0; // deterministic: smallest damage roll each time

    state = attack(state, alwaysMinRoll);
    expect(state.status).toBe("playing");

    state = attack(state, alwaysMinRoll);
    expect(state.status).toBe("lost");
    expect(state.player.hp).toBeLessThanOrEqual(0);
  });

  it("reaching the door with nothing blocking it ends the run in a win", () => {
    let state = createInitialState();
    state = { ...state, player: { ...state.player, pos: { x: 6, y: 1 } }, enemies: [] };

    state = move(state, 1, 0); // (6,1) -> (7,1), the door tile
    expect(state.status).toBe("won");
  });

  it("a wrong move is possible: the corridor wall doesn't move you", () => {
    let state = createInitialState();
    const before = state.player.pos;

    state = move(state, 0, -1); // into the wall above the corridor
    expect(state.player.pos).toEqual(before);
  });
});
