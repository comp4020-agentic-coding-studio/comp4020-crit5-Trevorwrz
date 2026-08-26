## Breakthrough

The corridor version worked and passed every check, but sitting with the
built thing, I could tell it wasn't answering the brief as well as it could:
a straight line guarantees a shape, not a choice. Opening the map into a room
with two ways in forced a real decision instead --- fight the weak enemies for
a level first, or go straight for the door and skip the boss. The second
breakthrough came from carrying an old fix forward without re-checking its
assumptions: last week's flee fix retreated the player one tile west, which
was only ever correct because a corridor can only be walked into from one
side. The moment I actually traced how a player could now reach an enemy from
any direction, that fix quietly became a bug again in a new shape. Neither of
those showed up from reading the diff in isolation --- both needed thinking
through what actually changes when a design assumption (one path in) stops
holding.

## What this changed

I'd been treating "this passed the tests I wrote" as close to "this is
right," and this week separated those further than the corridor week did.
The flee bug wasn't caught by any test --- it was caught by walking through
what a player entering from the south would experience, which the existing
test suite had no opinion on because it was written for a world where that
approach didn't exist. The habit I want to keep isn't just running the game
before trusting its tests; it's re-examining what a passing test was actually
assuming, whenever the thing underneath it changes shape.
