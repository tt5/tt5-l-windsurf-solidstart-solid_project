# WebSocket Implementation for Real-time Updates

## Overview
This document outlines the WebSocket-based approach for real-time border square updates to replace the current HTTP polling mechanism.

## Architecture

### Components
1. **WebSocket Server**
   - Handles client connections
   - Manages game state updates
   - Broadcasts changes to relevant clients

2. **Client-Side Handler**
   - Manages WebSocket connection
   - Processes incoming updates
   - Updates local state efficiently

## WebSocket API

### Connection
- **Endpoint**: `ws://<server>/ws`
- **Protocol**: Custom binary protocol for efficiency
- **Authentication**: JWT in initial handshake

### Message Types

#### 1. Client -> Server
```typescript
interface ClientMessage {
  type: 'MOVE' | 'PING' | 'SUBSCRIBE';
  payload: MovePayload | PingPayload | SubscribePayload;
  requestId?: string;  // For request/response correlation
}

interface MovePayload {
  direction: 'up' | 'down' | 'left' | 'right';
  position: [number, number];
  borderIndices: number[];  // Current border square indices
  viewport: {              // Current viewport bounds
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  timestamp: number;       // Client timestamp for latency calculation
}
```

#### 2. Server -> Client
```typescript
interface ServerMessage {
  type: 'BORDER_UPDATE' | 'PLAYER_UPDATE' | 'PONG' | 'ERROR';
  payload: BorderUpdate | PlayerUpdate | PongPayload | ErrorPayload;
  requestId?: string;  // Echoes client's requestId if present
}

interface BorderUpdate {
  coordinates: Array<{
    index: number;     // Grid index of the square
    x: number;         // World X coordinate
    y: number;         // World Y coordinate
    owner: string | null;
    updatedAt: string;
  }>;
  viewport: {          // The viewport these updates are valid for
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}
```

## Implementation Details

### Server-Side
1. **Connection Manager**
   - Tracks active connections
   - Handles reconnection logic
   - Manages subscriptions

2. **Update Batching**
   - Groups updates into batches
   - Sends updates at 60fps (16.67ms intervals)
   - Deltas only for changed squares

### Client-Side
1. **Connection Handler**
   - Automatic reconnection
   - Connection health monitoring
   - Message queuing when offline

2. **Update Pipeline**
   - Applies updates to local state
   - Smooth animations
   - Conflict resolution

## Performance Considerations

### Message Size Optimization
- Use binary protocol with MessagePack
- Delta encoding for updates
- Bit flags for common states

### Network Efficiency
- Only send visible border updates
- Throttle frequent updates
- Prioritize critical updates

## Security
- Rate limiting
- Message validation
- Connection limits per IP

## Migration Plan
1. **Phase 1**: Implement WebSocket alongside HTTP
2. **Phase 2**: Feature flag to switch between HTTP/WS
3. **Phase 3**: Monitor and optimize
4. **Phase 4**: Deprecate HTTP endpoint

## Monitoring
- Connection metrics
- Message throughput
- Latency measurements
- Error rates

## Considerations and Trade-offs

### 1. Resource Usage
- **Server Load**: Persistent connections consume more server resources than stateless HTTP
- **Memory Usage**: Each connection maintains state, increasing memory requirements
- **Battery Impact**: Mobile devices may experience higher battery drain

### 2. Complexity
- **State Management**: Need to handle connection state and reconnection logic
- **Synchronization**: Potential for race conditions with game state updates
- **Error Handling**: More complex error recovery than REST endpoints

### 3. Scalability
- **Connection Limits**: Servers have limits on concurrent connections
- **Load Balancing**: Requires sticky sessions or shared state between instances
- **Caching**: Traditional HTTP caching doesn't apply to WebSockets

### 4. Development Impact
- **Testing**: More complex test scenarios for connection states
- **Debugging**: Harder to debug real-time interactions
- **Tooling**: May require additional development tools

### 5. Network Conditions
- **Unstable Connections**: Poor network conditions can cause disconnections
- **Firewalls**: Some networks may block WebSocket connections
- **Latency**: Still subject to network latency, though reduced

### 6. Security Considerations
- **Attack Surface**: Larger surface for potential attacks
- **Authentication**: Need secure connection authentication
- **DDoS Risk**: Vulnerable to connection exhaustion attacks

### 7. Fallback Strategy
- **Legacy Support**: Must maintain HTTP API as fallback
- **Feature Detection**: Need robust detection of WebSocket support
- **Graceful Degradation**: Must handle fallback to HTTP gracefully

### 8. Cost Implications
- **Infrastructure**: May require additional server resources
- **Bandwidth**: Could increase bandwidth usage without optimization
- **Development Time**: Additional implementation and maintenance overhead

## HTTP Prefetching Analysis

### Performance Estimates with Prefetching

#### Best Case (Ideal Conditions)
- **Latency**: ~50-100ms per move (including network)
- **Moves/Second**: Up to 10-20 moves/second
- **Requirements**:
  - Low-latency network (<50ms RTT)
  - Efficient client-side caching
  - Optimized server response times (~1-2ms)

#### Realistic Case (Average Conditions)
- **Latency**: ~100-200ms per move
- **Moves/Second**: 5-10 moves/second
- **Requirements**:
  - Standard broadband connection
  - Some network jitter
  - Moderate server load

### Implementation Considerations
1. **Prefetch Direction**: Predict player movement based on current velocity
2. **Cache Management**: LRU cache for recently visited squares
3. **Request Batching**: Group adjacent square requests
4. **Progressive Loading**: Load visible squares first, then prefetch surrounding

### Comparison Table
| Metric | HTTP (Current) | HTTP + Prefetch | WebSocket |
|--------|----------------|-----------------|-----------|
| Max Speed | 1-2 moves/s | 5-10 moves/s | 30-60 moves/s |
| Latency | 200-500ms | 100-200ms | 20-50ms |
| Network Usage | High | Medium | Low |
| Implementation Complexity | Low | Medium | High |
| Best For | Turn-based | Fast single-player | Real-time MP |

# http

When WebSocket Makes Sense
High-Frequency Updates:

If you expect >1 move/second: I expect 10 moves/second

Multiple concurrent players: not really concurrent

Real-time interactions: not really

Current Implementation is Fine When:

Few base points: no, many

Turn-based or slow-paced gameplay: no, fast

Limited concurrent users: not really concurrent

Simple game mechanics

Keep HTTP if:

Gameplay is turn-based or slow: no

Player base is small/stable: yes

Consider WebSocket if:

Adding real-time multiplayer: no

Implementing live leaderboards: no

Adding chat or notifications: no

Planning for significant user growth: no