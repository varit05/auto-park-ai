# AutoPark AI - Technical Context

## Technologies Used

### Core Framework
- **React Native 0.73.0**: Cross-platform mobile development
- **Expo ~50.0.0**: Development platform and build tools
- **TypeScript 5.1.6**: Type-safe JavaScript
- **React 18.2.0**: UI framework

### State Management
- **Zustand 4.5.0**: Lightweight state management
- **@react-native-async-storage/async-storage 1.21.0**: Persistent storage

### Navigation
- **@react-navigation/native 6.1.9**: Navigation framework
- **@react-navigation/bottom-tabs 6.5.11**: Bottom tab navigation
- **@react-navigation/stack 6.3.20**: Stack navigation
- **react-native-safe-area-context 4.8.2**: Safe area handling
- **react-native-screens 3.29.0**: Native screen components

### Expo Modules
- **expo-location ~16.5.0**: Location services and geofencing
- **expo-notifications ~0.27.0**: Push and local notifications
- **expo-task-manager ~11.8.0**: Background task management
- **expo-background-fetch ~11.8.0**: Background data fetching
- **expo-constants ~15.4.5**: App configuration
- **expo-linking ~6.2.2**: Deep linking
- **expo-web-browser ^55.0.12**: Web browser integration
- **expo-status-bar ^55.0.5**: Status bar management

### Networking & Data
- **axios 1.6.5**: HTTP client for API calls

### Development Tools
- **@babel/core ^7.20.0**: JavaScript transpiler
- **@babel/runtime ^7.20.0**: Babel runtime helpers
- **babel-plugin-module-resolver ^5.0.0**: Module path resolution
- **eslint ^8.56.0**: Code linting
- **@typescript-eslint/eslint-plugin ^6.18.0**: TypeScript linting
- **@typescript-eslint/parser ^6.18.0**: TypeScript parser
- **jest ^29.2.1**: Testing framework
- **jest-expo ~50.0.0**: Expo Jest preset
- **@testing-library/react-native 12.4.3**: React Native testing utilities

## Development Setup

### Prerequisites
- Node.js (compatible with React Native 0.73)
- pnpm (package manager used in project)
- Expo CLI
- Xcode (for iOS development)
- CocoaPods (for iOS native dependencies)

### Installation
```bash
# Install dependencies
pnpm install

# Start development server
pnpm start

# Run on iOS
pnpm ios

# Run on Android
pnpm android
```

### Project Structure
```
auto-park-gen-ai/
├── app/
│   ├── App.tsx              # Main app component
│   ├── screens/             # Screen components
│   │   ├── HomeScreen.tsx
│   │   ├── LocationsScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── services/            # Business logic services
│   │   ├── aiService.ts
│   │   ├── automationService.ts
│   │   ├── locationService.ts
│   │   ├── notificationService.ts
│   │   └── paybyphoneService.ts
│   ├── store/               # Zustand store
│   │   └── useStore.ts
│   ├── types/               # TypeScript definitions
│   │   └── index.ts
│   └── utils/               # Utility functions
│       └── helpers.ts
├── assets/                  # Images, icons, etc.
├── app.json                 # Expo configuration
├── babel.config.js          # Babel configuration
├── index.js                 # App entry point
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── pnpm-lock.yaml           # Dependency lock file
```

### Path Aliases (tsconfig.json)
```json
{
  "@/*": ["app/*"],
  "@components/*": ["app/components/*"],
  "@screens/*": ["app/screens/*"],
  "@services/*": ["app/services/*"],
  "@store/*": ["app/store/*"],
  "@app-types/*": ["app/types/*"],
  "@utils/*": ["app/utils/*"],
  "@assets/*": ["assets/*"]
}
```

## Technical Constraints

### React Native Limitations
1. **No Web APIs**: `crypto.randomUUID()`, `fetch` differences, etc.
2. **No DOM**: Cannot use browser-specific APIs
3. **Threading**: JavaScript runs on single thread
4. **Memory**: Limited compared to web apps

### Expo Go Limitations
1. **Background Location**: May not work fully in Expo Go
2. **Custom Native Code**: Requires development build
3. **App Icons**: Use default Expo icons
4. **Push Notifications**: Limited in development

### iOS-Specific Considerations
1. **Permissions**: Must request location permissions explicitly
2. **Background Modes**: Must declare in app.json
3. **App Store Guidelines**: Must comply with Apple's requirements
4. **Encryption**: Must declare if using encryption (set to false)

## Dependencies Analysis

### Critical Dependencies
1. **expo-location**: Core functionality for geofencing
2. **@react-native-async-storage/async-storage**: Data persistence
3. **zustand**: State management
4. **expo-notifications**: User communication

### Development Dependencies
1. **TypeScript**: Type safety and IDE support
2. **ESLint**: Code quality
3. **Jest**: Automated testing

### Potential Issues
1. **expo-task-manager**: May have compatibility issues with some Expo versions
2. **Background location**: Battery usage concerns
3. **AsyncStorage**: Not suitable for large datasets

## Tool Usage Patterns

### State Management Pattern
```typescript
// Reading state
const locations = useStore(state => state.locations);

// Writing state
const addLocation = useStore(state => state.addLocation);
addLocation(locationData);

// Persisted automatically via middleware
```

### Service Pattern
```typescript
// Singleton service
export const locationService = new LocationService();

// Usage
await locationService.requestPermissions();
await locationService.startLocationMonitoring(locations, callbacks);
```

### Error Handling Pattern
```typescript
try {
  await someAsyncOperation();
} catch (error) {
  console.error('Operation failed:', error);
  // Graceful degradation
}
```

## Build and Deployment

### Development Build
```bash
# Create development build
expo run:ios
expo run:android
```

### Production Build
```bash
# Build with EAS
eas build --platform ios
eas build --platform android
```

### Environment Variables
- Use `app.json` extra field for configuration
- Use expo-constants for runtime access
- Never hardcode sensitive information

## Testing Strategy

### Unit Tests
- Test utility functions
- Test service methods
- Mock native modules

### Integration Tests
- Test navigation flows
- Test state management
- Test service interactions

### Manual Testing
- Test on real device for location features
- Test background behavior
- Test notification delivery