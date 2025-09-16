# 1600 placed, ~500 db, ~1200ms cleanup

npx tsx scripts/simulate-base-points.ts --debug -p 1600 -a 3200 --animate  --delay 10

simulation calls calculate-square with 15x15 squares, takes < 3ms

clean-up: 16
calculate-square: 3 (highest)

# 3200

npx tsx scripts/simulate-base-points.ts --debug -p 3200 -a 3200 --animate  --delay 10

Placed 1204/3200 base points after 50387 attempts.

npx tsx scripts/simulate-base-points.ts --debug -p 3200 -a 6400 --animate  --delay 10

calculate-squares: ~6ms
cleanup: 550 point, ~1600ms
600,700 point, ~2500ms

2500 added, 2000 removed
problem with player position and border?

npx tsx scripts/simulate-base-points.ts --debug -p 3200 -a 6400 --animate  --delay 9

Simulation complete with partial success. Placed 1838/3200 base points after 144524 attempts.

npx tsx scripts/simulate-base-points.ts --debug -p 3200 -a 12800 --animate  --delay 8

cleanup: 700 points, 3 s, >5s
calculate-squares: 23ms, 50ms
750 points, 3-6s

Simulation complete! Successfully placed 3200/3200 base points.
2429 removed
Total moves: 13'755'520

# stable

npx tsx scripts/simulate-base-points.ts --debug -p 3200 -a 12800 --animate  --delay 7
calculate-squares: (0,1,2,3,5) 10ms
cleanup: every 20s, (0,1 and two out of "primes between 3 and 2000")

MOVE 322635
2870 Added
2089 Removed