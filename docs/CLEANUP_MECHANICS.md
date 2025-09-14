# Cleanup System Mechanics

## Slope Selection and Cleanup Behavior

### Current Implementation
- Uses a uniform random distribution to select prime number slopes
- Always includes slopes 1 and -1 (main diagonals) plus 2 random primes per cleanup
- Each prime `p` is used in four variants: `[p, -p, 1/p, -1/p]`
- Cleanup runs every 10 seconds

### Key Findings

1. **Slope Selection Frequencies**
   - Each prime has an equal chance of being selected
   - Expected time to see any specific prime (e.g., 1999): ~25 minutes
   - Expected time between cleanups of the same slope: ~12.5 minutes (with 2 primes/cleanup)

2. **Grid Impact**
   - The game uses a 2000x2000 integer coordinate grid
   - Lines with slopes near 1 or -1 can contain up to 2000 points
   - Steeper or shallower slopes (|m| >> 1 or |m| << 1) have fewer integer coordinate points
   - This makes smaller slopes more effective at finding points to clean up

3. **Distribution Analysis**
   - **Uniform Distribution (Current)**:
     - Simple and predictable
     - All primes have equal chance
     - May be less efficient as it doesn't account for grid constraints
   
   - **Log-Weighted Distribution (Considered)**:
     - Favors smaller primes
     - More aligned with grid efficiency
     - Adds complexity with minimal gameplay impact

   - **Exponential Distribution (Considered)**:
     - Strongly favors smaller primes
     - Overly aggressive for this use case
     - Adds unnecessary complexity

### Performance Considerations
- Cleanup time is primarily affected by:
  1. The 10-second fixed interval
  2. Grid constraints and point distribution
  3. Number of primes checked per cleanup
- Slope selection distribution has minimal impact on performance

### Conclusion
The current uniform distribution provides a good balance between simplicity and effectiveness. While other distributions were considered, they don't provide significant enough benefits to justify the added complexity.

### Monitoring
- Added warning logs for cleanups taking >5 seconds
- Logs show which slopes are being used for each cleanup
- Can be used to monitor and adjust the system if needed
