# AutoPark AI - System Patterns

## System Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                         React Native                             │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                      App (App.tsx)                           │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │ │
│  │  │  Navigation     │  │   Screens       │  │  Providers  │  │ │
│  │  │  Container       │  │   (4 tabs)      │  │  (SafeArea) │  │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Zustand Store                             │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │ │
│  │  │   Locations     │  │    Vehicles     │  │   Settings  │  │ │
│  │  │   Sessions      │  │  PaymentMethods │  │   AppState  │  │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                     Services Layer                           │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │ │
│  │  │  Location       │  │   Automation    │  │     AI      │  │ │
│  │  │  Service        │  │    Service      │  │   Service   │  │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────┘  │ │
│  │  ┌─────────────────┐  ┌─────────────────┐                   │ │
│  │  │  Notification   │  │   PaybyPhone    │                   │ │
│  │  │  Service        │  │    Service      │                   │ │
│  │  └─────────────────┘  └─────────────────┘                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Native Modules                            │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │ │
│  │  │   AsyncStorage  │  │  expo-location  │  │    expo-    │  │ │
│  │  │                 │  │                 │  │ notifications│  │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────┘  │ │
│  │  ┌─────────────────┐  ┌─────────────────┐                   │ │
│  │  │ expo-task-      │  │ expo-background-│                   │ │
│  │  │   manager       │  │     fetch       │                   │ │
│  │  └─────────────────┘  └─────────────────┘                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Key Technical Decisions

### 1. State Management: Zustand
- **Why**: Lightweight, TypeScript-friendly, minimal boilerplate
- **Pattern**: Centralized store with actions and persist middleware
- **Storage**: AsyncStorage for persistence

### 2. Navigation: React Navigation 6
- **Why**: Industry standard, well-maintained, good TypeScript support
- **Pattern**: Bottom tabs for main navigation, stack for detail screens

### 3. Location Tracking: expo-location
- **Why**: Part of Expo ecosystem, well-documented
- **Pattern**: Background location with geofencing

### 4. Notifications: expo-notifications
- **Why**: Unified API for iOS and Android notifications
- **Pattern**: Local notifications for booking confirmations and reminders

### 5. Background Tasks: expo-task-manager + expo-background-fetch
- **Why**: Required for background location monitoring
- **Pattern**: Define background tasks that run even when app is suspended

## Design Patterns in Use

### 1. Service Layer Pattern
Each domain (location, automation, AI, notifications, PaybyPhone) has its own service class:
- Encapsulates business logic
- Provides clean API for components to use
- Handles errors internally

### 2. Singleton Pattern
Services are exported as singleton instances:
```typescript
export const locationService = new LocationService();
export const automationService = new AutomationService();
```

### 3. Observer Pattern
- Zustand store subscriptions for reactive UI updates
- Event callbacks for geofence events

### 4. Middleware Pattern
- Zustand persist middleware for automatic state persistence
- Navigation middleware for route protection (future)

### 5. Factory Pattern
- ID generation via `generateId()` helper
- Consider using factory for creating domain objects

## Component Relationships

### Store → Services
- Services read from store via `useStore.getState()`
- Services write to store via store actions
- Store triggers re-renders when state changes

### Services → Native Modules
- Services abstract native module complexity
- Services handle platform-specific logic
- Services provide error handling and fallbacks

### Screens → Store → Services
- Screens subscribe to store state
- Screens call store actions
- Services handle async operations

## Critical Implementation Paths

### 1. App Initialization Flow
```
App.tsx
  → useStore (persist hydration)
  → initializeApp()
  → aiService.initialize()
  → automationService.initialize()
  → startMonitoring() (if active locations exist)
```

### 2. Geofence Event Flow
```
expo-location (background)
  → locationService.handleLocationUpdate()
  → automationService.handleGeofenceEnter()
  → aiService.suggestDuration() (if AI enabled)
  → notificationService.sendBookingConfirmationNotification()
  → useStore.addGeofenceEvent()
```

### 3. Booking Flow
```
automationService.performAutomaticBooking()
  → paybyphoneService.bookParking()
  → useStore.addParkingSession()
  → notificationService.sendBookingSuccessNotification()
```

## Data Flow Patterns

### Read Flow
```
Component → useStore selector → State value
```

### Write Flow
```
Component → Store action → State update → Persist to AsyncStorage
```

### Async Flow
```
Service → API call → Success/Failure → Store update → UI re-render
```

## Error Handling Strategy

### 1. AsyncStorage Errors
- Wrapped in try-catch blocks
- Logged to console
- App continues with default state

### 2. Location Errors
- Permission denied: Show user message, disable location features
- Location unavailable: Use last known location, retry later

### 3. API Errors
- Network errors: Retry with exponential backoff (future)
- Auth errors: Clear session, prompt re-authentication
- Validation errors: Show user-friendly messages

### 4. Background Task Errors
- Log errors for debugging
- Attempt recovery on next foreground
- Notify user if critical failure

## Performance Considerations

### 1. State Optimization
- Use `partialize` to persist only necessary state
- Avoid storing large objects in AsyncStorage
- Use selectors to prevent unnecessary re-renders

### 2. Location Optimization
- Throttle location updates (5-second interval)
- Use appropriate accuracy level
- Stop monitoring when not needed

### 3. Notification Optimization
- Debounce notifications (60-second minimum)
- Group related notifications
- Respect user notification preferences