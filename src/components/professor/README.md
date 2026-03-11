# Professor Components

This directory contains components specifically designed for professor functionality in the attendance management system.

## QRCodeGenerator Component

The `QRCodeGenerator` component provides comprehensive QR code generation and management for attendance sessions.

### Features

#### 1. QR Code Display

- **Visual QR Code**: High-quality QR code generation using the `qrcode` library
- **Session Information**: Displays course name, session title, and time remaining
- **Security Settings**: Shows location requirements, photo requirements, device checks, and fraud detection status
- **Refresh Functionality**: Real-time QR code updates when session changes

#### 2. Session Information Display

- **Course Details**: Course name and session title
- **Time Information**: Start time, end time, and time remaining with real-time updates
- **Location Data**: GPS coordinates, radius, and location name
- **Security Status**: Comprehensive security feature indicators
- **Attendance Statistics**: Present students, total students, and attendance rate

#### 3. Real-time Updates

- **Session Status**: Live updates of session status (Active, Scheduled, Paused, Ended)
- **Attendance Count**: Real-time attendance tracking
- **Fraud Alerts**: Live fraud detection alerts
- **Time Remaining**: Countdown timer with automatic updates

#### 4. Export Options

- **Download as Image**: Export QR code as PNG image
- **Print QR Code**: Print-friendly QR code with session information
- **PDF Export**: Generate PDF with QR code and session details
- **Share Session Link**: Copy session URL to clipboard

#### 5. Share Functionality

- **Session Link**: Generate shareable session URLs
- **Email Sharing**: Send session information via email
- **SMS Sharing**: Share session details via SMS
- **Social Sharing**: Integration with social media platforms

### Technical Implementation

#### Dependencies

- `qrcode`: QR code generation library
- `@types/qrcode`: TypeScript definitions
- `framer-motion`: Animation library
- `lucide-react`: Icon library
- Shadcn/ui components

#### Key Features

- **Dynamic QR Code Generation**: QR codes are generated with session-specific data
- **Error Handling**: Fallback QR code display if generation fails
- **Responsive Design**: Works on all device sizes
- **Accessibility**: Screen reader compatible
- **Performance**: Optimized for real-time updates

#### QR Code Data Structure

```typescript
interface QRCodeData {
  sessionId: string;
  courseName: string;
  title: string;
  startTime: string;
  endTime: string;
  location: {
    latitude: number;
    longitude: number;
    radius: number;
    name: string;
  };
  security: {
    isLocationRequired: boolean;
    isPhotoRequired: boolean;
    isDeviceCheckRequired: boolean;
    fraudDetectionEnabled: boolean;
    gracePeriod: number;
    maxAttempts: number;
    riskThreshold: number;
  };
  status: string;
  qrCode: string;
  timestamp: number;
}
```

### Usage

```tsx
import QRCodeGenerator from "../components/professor/QRCodeGenerator";

<QRCodeGenerator
  session={sessionData}
  onRefresh={() => console.log("QR code refreshed")}
  onExport={(format) => console.log(`Exported as ${format}`)}
  onShare={(method) => console.log(`Shared via ${method}`)}
/>;
```

### Props

| Prop        | Type                       | Description                         |
| ----------- | -------------------------- | ----------------------------------- |
| `session`   | `AttendanceSession`        | Session data for QR code generation |
| `onRefresh` | `() => void`               | Callback when QR code is refreshed  |
| `onExport`  | `(format: string) => void` | Callback when QR code is exported   |
| `onShare`   | `(method: string) => void` | Callback when session is shared     |
| `className` | `string`                   | Additional CSS classes              |

### Security Features

- **Location Verification**: GPS coordinates and radius validation
- **Device Fingerprinting**: Device check requirements
- **Photo Capture**: Photo verification requirements
- **Fraud Detection**: Real-time fraud monitoring
- **Time Validation**: Session time window enforcement
- **Access Control**: Secure session access

### Export Formats

1. **PNG Image**: High-resolution QR code image
2. **PDF Document**: Printable QR code with session details
3. **Session Link**: Shareable URL for student access
4. **Print Format**: Print-optimized layout

### Real-time Features

- **Live Updates**: Automatic refresh when session changes
- **Time Countdown**: Real-time time remaining display
- **Attendance Tracking**: Live attendance statistics
- **Fraud Monitoring**: Real-time fraud alert display
- **Status Updates**: Live session status changes

### Accessibility

- **Screen Reader Support**: Full accessibility for visually impaired users
- **Keyboard Navigation**: Complete keyboard navigation support
- **High Contrast**: High contrast mode support
- **Focus Management**: Proper focus management for modals
- **ARIA Labels**: Comprehensive ARIA labeling

### Performance

- **Lazy Loading**: QR code generation on demand
- **Caching**: QR code data caching for performance
- **Optimization**: Optimized for real-time updates
- **Memory Management**: Efficient memory usage
- **Error Recovery**: Graceful error handling and recovery

### Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Browsers**: iOS Safari, Chrome Mobile
- **QR Code Scanning**: Compatible with all QR code scanners
- **Print Support**: Full print functionality
- **Export Support**: All export formats supported

### Integration

The component integrates seamlessly with:

- **Professor Dashboard**: Session management interface
- **Attendance System**: Real-time attendance tracking
- **Security Services**: Fraud detection and security validation
- **Notification System**: Real-time alerts and notifications
- **Export Services**: File generation and sharing

### Future Enhancements

- **Bulk QR Generation**: Generate multiple QR codes at once
- **Custom Styling**: Customizable QR code appearance
- **Advanced Security**: Enhanced security features
- **Analytics**: QR code usage analytics
- **Integration**: Third-party service integration
