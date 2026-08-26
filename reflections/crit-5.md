## Breakthrough

Running a scripted playthrough before ever opening the browser was the moment
that paid off. The first corridor design was a small maze, and a greedy
walker aimed at the door got stuck oscillating between two tiles forever --- a
dead end that looked closer to the goal than the path that actually worked.
That's exactly the trap a real player would hit with no instructions and no
map to consult. Swapping it for a one-way corridor before writing a single
test turned "does this feel fair" from a guess into something I'd already
checked two ways: by script, and later by clicking through the battle myself,
which is what caught flee doing nothing a player could see.

## What this changed

Testing a game's *rules* is not the same as testing whether it's *fun*, and I
went in assuming a green test suite meant the game was in good shape. It
doesn't: `attack()` was fully covered and correct, and the game still had a
button that silently did nothing useful. The habit I want to keep is running
the thing before trusting the tests that describe it --- treating a test suite
as proof the rules are consistent, not proof the experience is right.
