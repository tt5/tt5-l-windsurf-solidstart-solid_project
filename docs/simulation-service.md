# Simulation Service Integration

## Purpose
Integrate the base point simulation into the server startup process to run automatically in non-production environments.

## Core Functionality
- **Exact Movement Logic**:
  - All movement-related code is copied verbatim from `simulate-base-points.ts`
  - Includes identical state management (`moveCount`, `moveDirection`, etc.)
  - Preserves the exact movement decision tree and state transitions
  - Only modification: Initial direction is random (up/down/left/right) instead of default 'up'
- **Deterministic Behavior**:
  - Same inputs (including RNG seed) produce identical movement patterns
  - Movement logic is isolated from error handling and retry mechanisms

## Configuration
```bash
# .env
# Enable/disable simulation
ENABLE_SIMULATION=true

# Simulation parameters
SIMULATION_NUM_POINTS=800  # Set to a high number for continuous simulation
SIMULATION_MOVE_DELAY=1000  # Delay between moves in ms

# Optional: Set specific start position (random if not set)
SIMULATION_START_X=
SIMULATION_START_Y=

# Required authentication
TEST_USER_ID=your_user_id
TEST_AUTH_TOKEN=your_auth_token
```

## Implementation

### Simulation Service (`src/lib/server/services/simulation.service.ts`)
- **Code Preservation**:
  - Direct copy of movement logic from `simulate-base-points.ts`
  - No modifications to movement-related functions or state variables
  - Error handling wraps but doesn't modify movement logic
- **State Management**:
  - All state variables (`moveCount`, `moveDirection`, etc.) preserved exactly
  - State transitions remain identical to the original script
- **Initialization**:
  - Only difference: Initial direction is randomly selected if not specified
  - All other initialization parameters match the script's defaults

### Server Integration (`src/lib/server/init.ts`)
- Initializes simulation service on startup
- Respects `ENABLE_SIMULATION` flag
- Handles proper cleanup on shutdown

### Error Handling
- **Network Issues**: Automatic retries with backoff for transient network problems
- **Server Errors (5xx)**: Fail hard and stop the simulation
- **Client Errors (4xx)**: Log and continue (treated as invalid moves)
- **Comprehensive Logging**: All errors are logged with relevant context

## Rollback Strategy
- Simulation is opt-in via `ENABLE_SIMULATION`
- Original `simulate-base-points.ts` script remains available
- Can be disabled by setting `ENABLE_SIMULATION=false`
