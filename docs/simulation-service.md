# Simulation Service Plan

## Overview
This document outlines the plan for integrating the base point simulation into the server startup process.

## Key Requirements
1. **Maintain Existing Behavior**:
   - Keep the current movement and point placement logic
   - **Change**: Default start direction will be random (up/down/left/right) in the new implementation
   - Run infinite attempts for point placement

2. **Configuration**:
   - Move from CLI arguments to environment variables
   - Support essential simulation parameters (excluding debug mode)
   - Enable/disable simulation via environment variable

## Implementation Plan

### 1. Environment Variables
```bash
# .env
# Enable/disable simulation
ENABLE_SIMULATION=true

# Core simulation parameters
SIMULATION_GRID_SIZE=100
SIMULATION_NUM_POINTS=10
SIMULATION_START_X=0
SIMULATION_START_Y=0
SIMULATION_MOVE_DELAY=1000
SIMULATION_ANIMATE=false
SIMULATION_DEBUG=false

# Authentication (from existing script)
TEST_USER_ID=your_user_id
TEST_AUTH_TOKEN=your_auth_token
```

### 2. Simulation Service
Create `src/lib/server/services/simulation.service.ts` with:
- Singleton pattern
- Core simulation logic from `simulate-base-points.ts`
- Environment variable configuration
- Proper TypeScript types
- Basic logging for important events

### 3. Server Integration
Update `src/lib/server/init.ts` to:
- Import and initialize the simulation service
- Start simulation based on `ENABLE_SIMULATION`
- Handle cleanup on server shutdown

### 4. Error Handling
- Add proper error boundaries
- Implement retry logic for API calls
- Log errors appropriately

## Testing Plan
1. Unit tests for core simulation logic
2. Integration test with the server
3. Manual verification of simulation behavior

## Rollback Plan
- Keep the original `simulate-base-points.ts` script
- Make the simulation opt-in via environment variable
- Document how to disable if issues arise
