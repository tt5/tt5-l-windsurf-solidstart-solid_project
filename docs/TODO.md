# TODO

- when a base point in the viewport is removed the restricted squares are not updated (deleted). Solution: update from the events. Also update added base point in the viewport from the events?
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
- player can move to any position
- load at current position, getInitialViewport, TAG-t

## in progres

- passwords
- documentation
- types
- unit testing
- styles
- performance testing, metrics, logging
- enhance error handling in cleanup process (in progress)