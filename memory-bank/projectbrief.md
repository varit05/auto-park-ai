# AutoPark AI - Project Brief

## Project Overview
AutoPark AI is an AI-powered automatic parking booking application for iOS using PaybyPhone. The app leverages location tracking, geofencing, and artificial intelligence to automate the parking booking process.

## Core Requirements
1. **Automatic Parking Booking**: Detect when user arrives at saved locations and automatically book parking via PaybyPhone
2. **AI-Powered Duration Suggestions**: Use AI/LLM to suggest optimal parking duration based on historical data
3. **Geofencing**: Monitor user location and trigger events when entering/exiting defined areas
4. **Background Location Tracking**: Continue monitoring even when app is not in foreground
5. **Notifications**: Send booking confirmations, reminders, and alerts to users
6. **Multi-Mode Automation**: Support fully automatic, semi-automatic, and manual booking modes

## Technical Goals
- Native iOS experience using React Native with Expo
- Offline-first architecture with local data persistence
- Background task support for location monitoring
- Integration with PaybyPhone API for parking bookings
- Flexible AI provider support (OpenAI, Ollama, Claude, local models)

## Project Structure
```
auto-park-gen-ai/
├── app/
│   ├── screens/        # UI screens (Home, Locations, History, Settings)
│   ├── services/       # Business logic services
│   ├── store/          # Zustand state management
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Helper utilities
├── assets/             # Images, icons, etc.
├── app.json            # Expo configuration
├── package.json        # Dependencies
└── tsconfig.json       # TypeScript configuration
```

## Success Criteria
- App launches without crashes in Expo Go
- Location permissions handled gracefully
- Geofence events trigger correctly
- Parking bookings can be completed via PaybyPhone
- AI suggestions improve booking accuracy