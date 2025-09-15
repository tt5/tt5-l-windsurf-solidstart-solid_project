# Notification System

## Overview
The notification system provides real-time feedback to players about game events, particularly base point changes. Notifications are displayed in the side panel and automatically expire after a set time.

## Features

### Real-time Updates
- Uses Server-Sent Events (SSE) for real-time notifications
- Shows events from all players in real-time
- Displays the player's ID and action taken

### Notification Format
Each notification includes:
- **ID**: Internal identifier (format: `[pointId|coordinates]-[timestamp]`)
- **Message**: Human-readable description of the event
  - Format: `[username] [action] a base point at (x, y)`
  - Example: `ade42619... created a base point at (5, 4)`
- **Timestamp**: When the event occurred (in milliseconds since epoch)
- **User ID**: The full ID of the player who triggered the event

### User Identification
- Player IDs are shortened for display (first 8 characters + "...")
- Full user ID is stored internally for tracking
- Example: `user_ade42619164b7ae8cc6eee383432d025` → `ade42619...`

### Message Types
1. **Base Point Created**
   - Trigger: When a player creates a new base point
   - Example: `ade42619... created a base point at (5, 4)`

2. **Base Point Updated**
   - Trigger: When a player updates an existing base point
   - Example: `d8f26ebe... updated a base point at (5, 4)`

### Technical Implementation
- **Component**: `SidePanel.tsx`
- **State Management**: Local component state with SolidJS signals
- **Limits**: Shows maximum of 10 most recent notifications
- **Persistence**: Notifications are not persisted across page refreshes

### Event Flow
1. Server sends SSE event for base point changes
2. Client receives and parses the event
3. Notification is added to the top of the list
4. Oldest notifications are removed if over the 10-item limit

### Future Enhancements
- Add notification types (info, success, warning, error)
- Add timestamps in relative format (e.g., "2 minutes ago")
- Allow dismissing individual notifications
- Persist notifications across sessions
- Add sound effects for important events
- Support for different notification categories (combat, construction, etc.)
