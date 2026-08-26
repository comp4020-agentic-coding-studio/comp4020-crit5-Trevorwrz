# Process overview

A tiny bump-combat dungeon room: explore, fight what's in the way, level up on
what you beat, and find the door. No on-screen instructions anywhere --- the
opening screen is just the room with the player in one corner and the door
glowing in the other.

This started the week as a straight corridor crawl. Partway through, playing
the built game against what I actually wanted it to be, I decided the corridor
was too thin an answer --- it didn't leave room for a real choice, and levelling
had nothing to level *for*. The rewrite below is what replaced it: everything
in it, including the map, the levelling system and the tests, is this week's
work, built from scratch against this repo's own commit history, not carried
in from anywhere else.

## The moments that mattered

1. **An open room needs a reason a straight line doesn't.** A single corridor
   guarantees every fight happens; opening the map up risks a stranger walking
   straight past everything interesting. I designed the room so a wall with
   two gaps splits it in half --- landing on either gap puts you next to an
   enemy, so at least one fight stays unavoidable, but the boss guarding the
   far corner is reachable by a route that never touches it. That's a genuine
   choice (grind the weak enemies for a level first, or go straight for the
   door) rather than a maze to get lost in, in
   [`090f56d`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-Trevorwrz/commit/090f56d).
   Before trusting the layout I ran the same kind of check that caught last
   week's dead end: a BFS over the map confirmed every floor tile is reachable
   (no stray unreachable room), and 300 scripted playthroughs with a greedy,
   always-attack walker ended every time --- zero stuck, about 89% wins and 11%
   losses, so losing stayed a real risk instead of a rounding error.
2. **The ending rule and the levelling system both got tests before either got
   a second pass.**
   [`38b57c7`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-Trevorwrz/commit/38b57c7)
   reworks the spec's "a wrong move is possible, and play ends somewhere"
   assertions onto the new room's coordinates, and adds coverage the old
   corridor had no mechanic to test: killing an enemy grants exp, enough exp
   levels the player up and heals them, and a higher level rolls higher damage
   in the next fight --- levelling changes an outcome, not just a number on
   screen.
3. **Opening the map up quietly broke last week's flee fix.** The corridor's
   fix made a clean flee retreat one tile west, which was correct precisely
   because a one-way corridor could only ever be entered from the east.
   Working through how a player can now reach any enemy from any of four
   sides, west stopped being "back" --- walking into the room's lower-left
   enemy from above and then fleeing would try to step into the border wall
   and silently fail again, the exact bug the corridor fix was supposed to
   have retired for good. The fix in
   [`090f56d`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-Trevorwrz/commit/090f56d)
   records the direction the player actually walked in from and retreats
   along it instead of a fixed direction; the regression is pinned directly in
   [`38b57c7`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-Trevorwrz/commit/38b57c7)
   by approaching the same enemy from the side the old code would have gotten
   wrong.

4. **A manual Attack/Flee panel was a second interface bolted onto the first.**
   Actually playing the room end to end (not just reasoning about the state
   machine) surfaced something the tests couldn't: bumping an enemy opened a
   battle panel with its own buttons, so every single fight meant leaving the
   keyboard, clicking Attack with the mouse, then clicking back into the stage
   to keep moving with WASD/arrows. That's exactly the kind of friction the
   brief's "no tutorial, learn it by playing" bar is meant to rule out. The fix
   in
   [`ef8e770`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-Trevorwrz/commit/ef8e770)
   makes `move()` resolve the whole fight synchronously the instant you step
   into an enemy's tile --- closer to the instant wall-bump combat of games
   like Magic Tower --- so the player never leaves the keyboard. Flee no
   longer has a decision point to hang off once combat is instantaneous, so it
   was removed rather than left as dead code the tests couldn't reach anymore;
   the on-screen log line takes over telling the player what just happened.

## What I haven't verified myself

The brief's no-tutorial rule and the five-minute engagement bar are exactly
the two things it says can't be put under test: I checked the room's openness
and the win/loss odds by script, and read through what a player clicking and
walking would see, but a cold, silent playtest with another person is still
owed before the crit.
