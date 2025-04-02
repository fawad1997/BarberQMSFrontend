# Real-Time Queue Management with WebSockets

This document explains how the real-time queue updates are implemented using WebSockets in the WalkInOnline platform.

## Overview

The queue management system now includes real-time updates through WebSockets, enabling:
- Instant position updates during drag and drop operations
- Live updates when new customers join the queue
- Real-time notifications for appointment updates

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```bash
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

For production, use a secure WebSocket connection:

```bash
NEXT_PUBLIC_WS_URL=wss://your-api-domain.com
```

## Backend Requirements

The WebSocket server should be implemented on the backend with these message types:

### Message Types

1. **Queue Update**
   ```json
   {
     "type": "queue_update",
     "queue_items": [
       {
         "id": 1,
         "full_name": "John Doe",
         "position_in_queue": 1,
         "status": "CHECKED_IN",
         ...
       },
       ...
     ]
   }
   ```

2. **New Entry**
   ```json
   {
     "type": "new_entry",
     "queue_item": {
       "id": 5,
       "full_name": "Jane Smith",
       "position_in_queue": 5,
       "status": "CHECKED_IN",
       ...
     }
   }
   ```

3. **Appointment Update**
   ```json
   {
     "type": "appointment_update",
     "appointments": [
       {
         "id": 1,
         "shop_id": 1,
         "status": "scheduled",
         ...
       },
       ...
     ]
   }
   ```

## WebSocket Implementation Details

The frontend establishes a WebSocket connection for each shop's queue page:

1. **Connection Establishment**: 
   - Connection URL format: `${process.env.NEXT_PUBLIC_WS_URL}/ws/queue/${shopId}/`
   - The connection is established when the queue page loads
   - The connection is closed when the user navigates away from the page

2. **Fallback Mechanism**:
   - If WebSockets are unavailable, the app falls back to polling every 5 seconds
   - This ensures updates even without WebSocket support
   - A notification will appear informing the user that polling is being used

3. **Real-time Position Updates During Drag**:
   - While dragging queue items, position numbers update in real-time
   - This is handled client-side for immediate feedback
   - After drag completion, changes are sent to the server

## Backend Implementation Guide

For backend developers, implement the WebSocket server with these endpoints:

```
/ws/queue/{shop_id}/
/ws/appointments/{shop_id}/
```

Events that should trigger WebSocket messages:
- Queue position updates
- New customer check-ins
- Status changes of queue items
- Appointment status changes

## Testing WebSocket Connections

To test if your WebSocket connection is working:

1. Open your browser's developer console
2. Look for WebSocket connection logs:
   - "WebSocket connection established" indicates success
   - Check for any error messages if the connection fails

3. You can manually test by adding a new customer through the API and verifying the real-time update in the UI

## Troubleshooting WebSocket Connections

If you encounter WebSocket connection issues:

### 1. Backend Server Not Running

The most common cause of WebSocket errors is that the WebSocket server is not running on the backend. Ensure:

- The backend server is running and accessible
- The WebSocket server is properly implemented and enabled
- The server is listening on the correct port (default: 8000)

### 2. Environment Variables

Verify your environment variables are correctly set:

```bash
# Check .env file
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

For local development, make sure you're using `ws://` protocol, and for production use `wss://`.

### 3. CORS Issues

If the WebSocket server is running but you still can't connect, it might be a CORS issue:

- Ensure the WebSocket server allows connections from your frontend origin
- Check backend logs for CORS rejection messages

### 4. Network/Firewall Issues

WebSocket connections might be blocked by:

- Corporate firewalls that block WebSocket connections
- Proxy servers that don't support WebSockets
- Network restrictions on certain ports

### 5. Automatic Fallback

The application includes an automatic fallback to polling when WebSockets fail:

- After 3 failed connection attempts, the system will automatically switch to polling
- A yellow notification will appear informing the user that polling is being used
- Data will still update, but with a slight delay compared to WebSockets 