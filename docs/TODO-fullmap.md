# Full Map Implementation Plan

## Phase 1: Database Setup
- [x] Create database migration for `map_tiles` table
- [x] Add indexes for spatial queries
- [x] Write repository layer for tile data access

## Phase 2: Server API
- [x] Implement GET /api/map/tile/{tileX}/{tileY} endpoint
- [x] Add tile generation logic
- [x] Implement bitmap compression
- [x] Set up tile caching

### Tile Generation Strategy: On-Demand with Staleness Check
1. **Tile Request Flow**:
   - When a client requests a tile, first check if it exists and is up-to-date
   - If tile is missing or stale, regenerate it from base points
   - Return the tile with appropriate cache headers

2. **Staleness Check**:
   - Each tile has a `last_updated_ms` timestamp
   - Compare with the latest base point update time in that tile's area
   - Regenerate tile if it's older than the last base point change

3. **Performance Optimizations**:
   - Cache generated tiles in memory
   - Use database transactions for consistency
   - Implement proper error handling and timeouts

## Phase 3: Client Implementation
- [x] Create map view component
- [x] Implement tile loading and rendering
- [~] Add viewport-based tile requests (partially implemented - needs to respect current player position)
- [~] Handle tile caching on client side (partially implemented - TileCache class exists but isn't fully utilized)

## Phase 4: Integration
- [ ] Connect to base points updates
- [ ] Implement tile invalidation on changes
- [ ] Add loading states and error handling

## Testing
- [ ] Unit tests for tile generation
- [ ] Integration tests for API endpoints
- [ ] Performance testing with large datasets
- [ ] Browser compatibility testing

## Optimization
- [ ] Profile tile generation performance
- [ ] Optimize database queries
- [ ] Implement delta updates
- [x] Add compression for tile data (using pako)

## Documentation
- [ ] Update API documentation
- [ ] Add code comments
- [ ] Write usage examples
- [ ] Document performance characteristics
