# Simulation Service Integration

## Purpose
Integrate the base point simulation into the server startup process to run automatically in non-production environments.

## Core Functionality
- **Exact Movement Logic**: Movement behavior must precisely match `simulate-base-points.ts`
- **Random Start Position**: X/Y between -900 and 900
- **Random Initial Direction**: Default direction is random (up/down/left/right) in server implementation (differs from script's default 'up')
- **Infinite Placement**: Continuous point placement attempts
- **Deterministic Behavior**: Same inputs must produce identical movement patterns as the script

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
- **Movement Logic**: Must be an exact copy from `simulate-base-points.ts`
- **Direction Handling**: 
  - Default direction is random (up/down/left/right)
  - All other movement rules must match the script exactly
- **State Management**: Maintains the same state machine as the script
- **Environment Variables**: Processes configuration while preserving script behavior

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
