# Process overview

A tiny bump-combat corridor crawl: walk right, fight what's in the way, reach
the door or run out of HP. No on-screen instructions anywhere --- the opening
screen is just the corridor with the player at one end and the door glowing at
the other.

## The moments that mattered

1. **A branching maze was the obvious first design, and it broke.** The
   corridor started as a small maze (two enemies reachable from either of two
   detours). I wrote a scripted playthrough --- a greedy walker that always
   steps toward the door --- to sanity-check it before ever touching the DOM.
   It got stuck: one dead-end tile looked closer to the door by straight-line
   distance than the tile that actually led there, so the walker oscillated
   forever between two squares. A first-time player with no instructions and
   no map would hit the same trap. I replaced the maze with a single one-way
   corridor before committing anything, so there's no earlier commit to point
   at --- the fix is the design that shipped in
   [`7b3136f`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-Trevorwrz/commit/7b3136f).
2. **The ending rule got a test before the corridor got a second pass.**
   [`ae9b0c7`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-Trevorwrz/commit/ae9b0c7)
   asserts the spec's "a wrong move is possible, and play ends somewhere"
   directly against the state machine (`spec/game.test.ts`): hp hitting zero
   in a fight ends in a loss, reaching the clear door ends in a win, and the
   corridor wall actually blocks a move. I also ran 300 scripted playthroughs
   with an always-attack policy to check the odds weren't degenerate: every
   run ended (no more stuck walkers), and about 4% lost --- real risk, not a
   guaranteed win or a guaranteed loss.
3. **Flee did nothing, and only clicking it showed that.** Reading
   `flee()` looked fine: resolve a coin flip, maybe take a hit, close the
   battle. Playing it was different --- on a clean getaway, the battle just
   closed with the player standing exactly where they were, next to an enemy
   that still blocked the only way through. The button did something (a state
   change) but nothing a player could see or use. I changed a clean flee to
   step the player back one tile in
   [`5a466a0`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-Trevorwrz/commit/5a466a0)
   --- the change the brief asks for: one that came from playing the finished
   game, not from reading its code.

## What I haven't verified myself

The brief's no-tutorial rule and the five-minute engagement bar are exactly
the two things it says can't be put under test: I checked the openness of the
opening screen and the odds by script, but a cold, silent playtest with
another person is still owed before the crit.
