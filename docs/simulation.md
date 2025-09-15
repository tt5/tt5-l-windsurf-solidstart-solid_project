# Test User Simulation

This document explains how to use the test user simulation script to test the game mechanics.

## Basic Usage

### Running the Simulation
```bash
# Run with default settings (creates 10 base points starting at 0,0)
npx tsx scripts/simulate-base-points.ts

# Run with custom settings
npx tsx scripts/simulate-base-points.ts --points 20 --start-x 10 --start-y -5 --direction right
```

### Deleting All Base Points
```bash
# Delete all base points for the test user
npx tsx scripts/simulate-base-points.ts --delete
```

## Command Line Options

| Option | Alias | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `--grid-size` | `-g` | number | 15 | Size of the game grid (must be odd) |
| `--points` | `-p` | number | 10 | Number of base points to create |
| `--start-x` |  | number | 0 | Starting X coordinate |
| `--start-y` |  | number | 0 | Starting Y coordinate |
| `--direction` | `-d` | string | 'right' | Initial movement direction (right/left/up/down) |
| `--delay` |  | number | 0 | Delay between moves in milliseconds |
| `--debug` |  | boolean | false | Enable debug logging with detailed move information |
| `--delete` |  | boolean | false | Delete all base points instead of simulating |
| `--help` | `-h` |  |  | Show help |

## Examples

### 1. Create a Test User with Custom Path
```bash
# Create 20 base points starting at (5, -3) moving right
npx tsx scripts/simulate-base-points.ts -p 20 --start-x 5 --start-y -3 -d right

# Create points with a delay between moves (100ms)
npx tsx scripts/simulate-base-points.ts --delay 100

# Enable debug logging to see detailed move information
npx tsx scripts/simulate-base-points.ts --debug -d up

# Combine debug with other options
npx tsx scripts/simulate-base-points.ts --debug --delay 500 -d left

# Create points in a 21x21 grid
npx tsx scripts/simulate-base-points.ts -g 21
```

### 2. Clean Up
```bash
# Delete all test user's base points
npx tsx scripts/simulate-base-points.ts --delete
```

## How It Works

1. The test user starts at the specified coordinates
2. Moves in the specified direction, placing base points along the way
3. When it hits a boundary or restricted area, it changes direction
4. Continues until the target number of base points are placed or maximum attempts are reached

## Notes

- The test user respects restricted squares and won't place base points on them
- Movement follows a grid-filling pattern for efficient coverage
- Use the `--delay` option to slow down the simulation if needed