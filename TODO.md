# Project TODOs

## High Priority

1. ✅ **Update Game Design Documentation**
   - [x] Align DESIGN.md with current implementation
   - [x] Document viewport-based mechanics
   - [x] Clarify base point placement rules

2. **Implement Basic Territory Visualization**
   - **2.1 Player Color Mapping**
     - [ ] Create utility function for distinct player colors
     - [ ] Map user IDs to specific colors
     - [ ] Store color mapping in game state
   - **2.2 Board Rendering Updates**
     - [ ] Show base points with player colors
     - [ ] Add visual indicators for restricted squares
     - [ ] Implement hover/selection states
   - **2.3 Visual Feedback System**
     - [ ] Add CSS classes for territory states
     - [ ] Implement smooth state transitions
     - [ ] Distinguish claimed vs restricted areas

3. **Enhance Base Point Placement**
   - Improve validation logic
   - Add visual feedback for valid/invalid placements
   - Handle edge cases (world boundaries, etc.)

4. **Optimize Cleanup Process**
   - Ensure cleanup runs efficiently
   - Add detailed logging
   - Prevent race conditions

5. **Add Core Game Tests**
   - Unit tests for base point placement
   - Tests for territory calculation
   - Cleanup process tests

6. **Improve Multiplayer Sync**
   - Ensure consistent world state
   - Handle concurrent modifications
   - Add basic conflict resolution

7. **Enhance Error Handling**
   - Add proper error boundaries
   - Improve error messages
   - Log errors for debugging

8. **Optimize Performance**
   - Implement viewport-based loading
   - Add spatial indexing for base points
   - Optimize re-renders

9. **Add Basic Analytics**
   - Track key game metrics
   - Log important events
   - Monitor performance

10. **Update README**
    - Add setup instructions
    - Document environment variables
    - Add contribution guidelines

*Last updated: 2025-09-11*
