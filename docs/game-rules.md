# game rules

A player can always chose to leave the game.

When a player leaves the game the player has to reenter as a new player.

## first start / reset

There is always one bot playing (scripts/simlate-base-points.ts). Starting from when the world starts/resets.

The beginning of the world is the smallest value of all timetamps of the slope primes.

## new players

All new player start at different position.

They starts (-3,-2) away from the oldest base point. A new base point is added there with a timestamp of one millisecond less than the oldest prime timestamp. The oldest base point is deleted.

## game reset

The game resets when 800 total base points are in the world (as seen by the cleanup event).

After world reset the players have to reenter as a new player.