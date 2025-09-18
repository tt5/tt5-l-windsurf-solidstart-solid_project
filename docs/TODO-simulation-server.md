# Simulation Server Implementation TODO

## 1. Create Simulation Service
- [ ] Create `src/lib/server/services/simulation.service.ts`
  - Copy movement logic from `simulate-base-points.ts`
  - Only change: Make initial direction random
  - Keep all other logic identical

## 2. Environment Setup
- [ ] Add to `.env`:
  ```
  ENABLE_SIMULATION=true
  SIMULATION_MOVE_DELAY=1000
  SIMULATION_NUM_POINTS=800
  SIMULATION_START_X=
  SIMULATION_START_Y=
  ```

## 3. Server Integration
- [ ] Update `src/lib/server/init.ts`
  - Import simulation service
  - Start simulation if `ENABLE_SIMULATION=true`
  - Add proper cleanup on shutdown

## 4. Error Handling
- [ ] Network errors: Retry with backoff
- [ ] Server errors (5xx): Fail hard
- [ ] Client errors (4xx): Log and continue

## 5. Testing
- [ ] Verify movement matches original script
- [ ] Test error scenarios
- [ ] Verify cleanup on shutdown
