# Join/Leave Game Implementation Plan

## Phase 1: Database Setup

1. **Add Required Columns**
   - [ ] Add `game_joined` (BOOLEAN) column to `users` table
   - [ ] Add `home_x` (INTEGER) column to `users` table
   - [ ] Add `home_y` (INTEGER) column to `users` table
   - [ ] Ensure `base_points` table has `game_created_at_ms` column

2. **Create Migration**
   ```bash
   npm run db:create-migration "Add game join status and home position to users"
   ```

## Phase 2: Backend Implementation

### 2.1 Repository Layer

1. **User Repository Updates**
   - [ ] Add `setGameJoinedStatus(userId, status)`
   - [ ] Add `setHomePosition(userId, x, y)`
   - [ ] Add `getUserGameStatus(userId)`

2. **Base Point Repository Updates**
   - [ ] Add `getOldestBasePoint()`
   - [ ] Add `deleteBasePoint(id)`
   - [ ] Add `createBasePointForNewUser(userId, x, y)`

### 2.2 Service Layer

1. **Game Join Service**
   ```typescript
   // Pseudo-code
   async joinGame(userId: string) {
     // 1. Start transaction
     // 2. Get oldest base point
     // 3. Calculate new position (-3,-2 from oldest)
     // 4. Get oldest prime timestamp
     // 5. Create new base point with (oldestPrimeTimestamp - 1)
     // 6. Delete oldest base point
     // 7. Update user's home position and join status
     // 8. Commit transaction
   }
   
   async leaveGame(userId: string) {
     // Update user's join status
   }
   ```

### 2.3 API Endpoints

1. **Join Game**
   - `POST /api/game/join`
   - Authentication required
   - Returns: `{ success: boolean, homePosition: {x, y} }`

2. **Leave Game**
   - `POST /api/game/leave`
   - Authentication required
   - Returns: `{ success: boolean }`

3. **Get Game Status**
   - `GET /api/game/status`
   - Returns: `{ isJoined: boolean, homePosition?: {x, y} }`

## Phase 3: Frontend Implementation

### 3.1 State Management

1. **User Store Updates**
   - Add `isGameJoined` state
   - Add `homePosition` state
   - Add actions for joining/leaving game

2. **API Service**
   ```typescript
   // api/game.ts
   export const gameApi = {
     join: () => api.post('/api/game/join'),
     leave: () => api.post('/api/game/leave'),
     getStatus: () => api.get('/api/game/status')
   };
   ```

### 3.2 UI Components

1. **Game Controls Component**
   - Join/Leave game button
   - Displays current join status
   - Handles loading states

2. **Game Status Indicator**
   - Shows if player is in-game
   - Displays home position

## Phase 4: Testing

### 4.1 Unit Tests
- [ ] Test game join logic
- [ ] Test position calculation
- [ ] Test concurrent joins

### 4.2 Integration Tests
- [ ] Test API endpoints
- [ ] Test database transactions
- [ ] Test error scenarios

### 4.3 Manual Testing
- [ ] Test join/leave flow
- [ ] Test concurrent joins
- [ ] Test edge cases (no base points, etc.)

## Phase 5: Deployment

1. **Database Migration**
   ```bash
   npm run db:migrate
   ```

2. **Deploy Backend**
   - [ ] Deploy updated backend code
   - [ ] Test in staging

3. **Deploy Frontend**
   - [ ] Build and deploy frontend
   - [ ] Test in staging

## Phase 6: Monitoring & Maintenance

1. **Error Tracking**
   - [ ] Set up monitoring for join/leave failures
   - [ ] Log relevant metrics

2. **Performance**
   - [ ] Monitor database performance
   - [ ] Optimize queries if needed

## Rollback Plan

If issues arise:
1. Revert frontend changes
2. Run database rollback:
   ```bash
   npm run db:rollback
   ```
3. Revert backend changes

## Dependencies
- Database migration system
- Authentication system
- Base point management
- Prime number utilities

## Known Issues/Limitations
- Race conditions on concurrent joins
- Need to handle server restarts during join

## Future Improvements
- Add cooldown period between joins/leaves
- Implement game sessions with time tracking
- Add more detailed join/leave analytics
