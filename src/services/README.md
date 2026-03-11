# API Integration Services

This directory contains comprehensive API integration services for the Smart Campus Assistant attendance system.

## 📁 File Structure

```
src/services/
├── attendance.service.ts      # Main attendance API service
├── websocket.service.ts       # WebSocket real-time communication
└── README.md                 # This documentation
```

## 🔧 Services Overview

- All services use a unified Prisma client.
- API requests use relative paths (/api).
- Internal server logic runs within Next.js.

### 1. Attendance Service (`attendance.service.ts`)

The main service for managing attendance sessions with comprehensive API integration.

#### Features:

- **Session Management**: Create, read, update, delete sessions
- **Real-time Updates**: WebSocket integration for live updates
- **Error Handling**: Comprehensive error management
- **Type Safety**: Full TypeScript support
- **Authentication**: JWT token management

#### Key Methods:

```typescript
// Session Management
createSession(sessionData: CreateSessionData): Promise<ApiResponse<AttendanceSession>>
getSessions(params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<AttendanceSession>>>
updateSession(sessionId: string, updates: UpdateSessionData): Promise<ApiResponse<AttendanceSession>>
deleteSession(sessionId: string): Promise<ApiResponse<void>>

// Session Control
startSession(sessionId: string): Promise<ApiResponse<AttendanceSession>>
stopSession(sessionId: string): Promise<ApiResponse<AttendanceSession>>
pauseSession(sessionId: string): Promise<ApiResponse<AttendanceSession>>

// QR Code Management
generateQRCode(sessionId: string): Promise<ApiResponse<{ qrCode: string; qrCodeData: string }>>

// Statistics
getSessionStats(professorId?: string): Promise<ApiResponse<SessionStats>>
getActiveSessions(professorId?: string): Promise<ApiResponse<AttendanceSession[]>>
getScheduledSessions(professorId?: string): Promise<ApiResponse<AttendanceSession[]>>
getCompletedSessions(professorId?: string): Promise<ApiResponse<AttendanceSession[]>>
```

#### Real-time Event Listeners:

```typescript
// Event listeners for real-time updates
onSessionCreated(callback: (session: AttendanceSession) => void)
onSessionUpdated(callback: (sessionId: string, session: AttendanceSession) => void)
onSessionDeleted(callback: (sessionId: string) => void)
onSessionStarted(callback: (sessionId: string, session: AttendanceSession) => void)
onSessionEnded(callback: (sessionId: string, session: AttendanceSession) => void)
onSessionPaused(callback: (sessionId: string, session: AttendanceSession) => void)
onQRCodeGenerated(callback: (sessionId: string, qrCode: string) => void)
```

### 2. WebSocket Service (`websocket.service.ts`)

Real-time communication service for live updates and notifications.

#### Features:

- **Auto-reconnection**: Automatic reconnection with exponential backoff
- **Event Management**: Comprehensive event handling
- **Room Management**: Join/leave specific rooms for targeted updates
- **Authentication**: JWT token-based authentication
- **Error Handling**: Robust error management

#### Key Methods:

```typescript
// Connection Management
connect(): Promise<void>
disconnect(): void
reconnect(): void

// Event Handling
on(event: string, handler: (...args: any[]) => void): void
off(event: string): void

// Room Management
joinRoom(room: string): void
leaveRoom(room: string): void

// Server Communication
emitToServer(event: string, data: any): void

// Status
getConnectionStatus(): boolean
getReconnectionStatus(): { isReconnecting: boolean; attempts: number; maxAttempts: number }
```

## 🎯 Usage Examples

### Basic Session Management

```typescript
import { attendanceService } from "../services/attendance.service";

// Create a new session
const sessionData = {
  courseId: 101,
  courseName: "CS 101",
  title: "Data Structures Lecture",
  description: "Introduction to data structures",
  startTime: new Date("2024-01-15T10:00:00Z"),
  endTime: new Date("2024-01-15T12:00:00Z"),
  location: {
    latitude: 40.7128,
    longitude: -74.006,
    radius: 50,
    name: "Main Campus - Room 101",
  },
  security: {
    isLocationRequired: true,
    isPhotoRequired: false,
    isDeviceCheckRequired: true,
    fraudDetectionEnabled: true,
    gracePeriod: 5,
    maxAttempts: 3,
    riskThreshold: 70,
  },
};

const response = await attendanceService.createSession(sessionData);
if (response.success) {
  console.log("Session created:", response.data);
} else {
  console.error("Error:", response.error);
}
```

### Real-time Updates

```typescript
import { attendanceService } from "../services/attendance.service";

// Listen for session updates
attendanceService.onSessionCreated((session) => {
  console.log("New session created:", session);
});

attendanceService.onSessionUpdated((sessionId, session) => {
  console.log("Session updated:", sessionId, session);
});

attendanceService.onSessionStarted((sessionId, session) => {
  console.log("Session started:", sessionId, session);
});
```

### Using React Hooks

```typescript
import { useAttendanceSessions } from '../hooks/useAttendanceSessions';

function AttendanceManager() {
  const {
    sessions,
    isLoading,
    createSession,
    startSession,
    stopSession,
    error,
    createError
  } = useAttendanceSessions();

  const handleCreateSession = async (sessionData) => {
    const success = await createSession(sessionData);
    if (success) {
      console.log('Session created successfully');
    } else {
      console.error('Failed to create session:', createError);
    }
  };

  return (
    <div>
      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage error={error} />}
      {/* Your component JSX */}
    </div>
  );
}
```

## 🔒 Security Features

### Authentication

- JWT token-based authentication
- Automatic token refresh
- Role-based access control

### Rate Limiting

- API rate limiting to prevent abuse
- Different limits for different operations
- Automatic retry with exponential backoff

### Data Validation

- Comprehensive input validation
- Type safety with TypeScript
- Server-side validation

## 📊 Error Handling

### Error Types

- **Network Errors**: Connection issues, timeouts
- **Authentication Errors**: Invalid tokens, expired sessions
- **Validation Errors**: Invalid input data
- **Business Logic Errors**: Permission denied, resource not found

### Error Recovery

- Automatic retry for transient errors
- User-friendly error messages
- Fallback mechanisms

## 🚀 Performance Optimizations

### Caching

- Response caching for frequently accessed data
- Smart cache invalidation
- Offline support

### Real-time Updates

- Efficient WebSocket connections
- Event batching
- Selective updates

### Loading States

- Comprehensive loading indicators
- Progressive loading
- Skeleton screens

## 🧪 Testing

### Unit Tests

```typescript
import { attendanceService } from "../services/attendance.service";

describe("AttendanceService", () => {
  it("should create a session successfully", async () => {
    const sessionData = {
      /* test data */
    };
    const response = await attendanceService.createSession(sessionData);
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
  });
});
```

### Integration Tests

- API endpoint testing
- WebSocket connection testing
- Error scenario testing

## 📈 Monitoring

### Metrics

- API response times
- Error rates
- WebSocket connection stability
- User engagement

### Logging

- Comprehensive logging
- Error tracking
- Performance monitoring

## 🔧 Configuration

### Environment Variables

```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WEBSOCKET_URL=ws://localhost:3001
REACT_APP_JWT_SECRET=your-secret-key
```

### Service Configuration

```typescript
const config = {
  apiUrl: process.env.REACT_APP_API_URL,
  websocketUrl: process.env.REACT_APP_WEBSOCKET_URL,
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
};
```

## 🚀 Deployment

### Production Considerations

- HTTPS for all communications
- Secure WebSocket connections (WSS)
- Environment-specific configurations
- Error monitoring and alerting

### Scaling

- Load balancing for API servers
- WebSocket scaling strategies
- Database optimization
- Caching strategies

## 📚 Additional Resources

- [API Documentation](./api-docs.md)
- [WebSocket Events](./websocket-events.md)
- [Error Codes](./error-codes.md)
- [Performance Guide](./performance.md)

## 🤝 Contributing

1. Follow TypeScript best practices
2. Add comprehensive error handling
3. Include unit tests for new features
4. Update documentation
5. Follow the existing code style

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
