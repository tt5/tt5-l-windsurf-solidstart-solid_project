# TODO


- when a base point in the viewport is removed the restricted squares are not updated (deleted). Solution: update from the events. Also update added base point in the viewport from the events?
- keep position when changing tabs
- join and leave game
  - multiple players join between world time ticks
- delete account and clean up base points
- auto add basepoint with space bar

## calculate-square

- docs
  - direction unused
  - borderIndices: square to check. (optimize?)
  - currentPosition: defines direction (it is actually the next point in direction)
- optimize calculate-square endpoint
  - is it necessary to call it with all viewport squares?


## unclear

- component testing
- http prefetching, websockets

## production

- production build
- db backups
- containerization

## map

- world borders in the map, max and min zoom
- load at current position
- player can move to any position

## in progres

- passwords
- documentation
- types
- unit testing
- styles
- performance testing, metrics, logging
- enhance error handling in cleanup process (in progress)

## drawing

1. fetch base points (100ms cooldown)
2. draw viewport (restricted squares)
3. move squares
4. add base points
5. is there a next border base point in the direction of movement?
6. if yes skip calculate-squares (all border squares are restricted except the next border base point).
7. if no calculate-squares
8. join moved squares and new border squares

