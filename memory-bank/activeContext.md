# AutoPark AI - Active Context

## Current Work Focus
The application had a critical crash issue when opening in Expo Go. The crash was caused by `crypto.randomUUID()` being called in the Zustand store, which is not available in React Native environments. This has been fixed.

## Recent Changes (Last Session)

### Crash Fix Applied
1. **Root Cause**: `crypto.randomUUID()` Web API is not available in React Native
   - Error: `EXC_CRASH (SIGABRT)` on `com.facebook.react.AsyncLocalStorageQueue`
   - The Zustand store was calling `crypto.randomUUID()` to generate IDs for locations, vehicles, payment methods, and parking sessions

2. **Fix Applied to `app/store/useStore.ts`**:
   - Replaced all `crypto.randomUUID()` calls with `generateId()` from `@utils/helpers`
   - Added proper error handling for AsyncStorage operations
   - Fixed JSON serialization/deserialization in persist storage

3. **TypeScript Configuration**:
   - Changed `@types/*` path alias to `@app-types/*` to avoid conflicts with Node.js `@types` package

## Next Steps
1. **Test the crash fix**: User should restart Expo dev server and reload app in Expo Go
2. **Address remaining TypeScript errors** (non-critical, don't cause crashes):
   - `Picker` component removed from react-native (use @react-native-picker/picker)
   - `Notifications.NotificationResponseSubscription` type issue in notificationService.ts
   - `AutomationStatus` export issue in automationService.ts
3. **Implement missing functionality**:
   - PaybyPhone API integration (currently stubbed)
   - AI service integration (currently stubbed)
   - Complete notification handling

## Active Decisions and Considerations

### ID Generation
- Using `generateId()` from helpers which uses timestamp + random string approach
- This is compatible with React Native and sufficient for local ID generation
- If UUID v4 is needed, consider using `expo-crypto` or `react-native-uuid`

### Storage Strategy
- Using Zustand with persist middleware
- AsyncStorage for persistence
- JSON serialization for complex objects (Date objects need special handling)

### Import Path Aliases
- `@app-types/*` for app type definitions (avoiding conflict with node_modules/@types)
- `@store/*`, `@services/*`, `@screens/*`, `@utils/*` for other modules

## Important Patterns and Preferences

### Error Handling
- AsyncStorage operations wrapped in try-catch blocks
- Errors logged to console with descriptive messages
- App continues to function even if storage operations fail

### State Management
- Zustand for centralized state
- Persist middleware for automatic persistence
- Partialize function to control what gets persisted

## Learnings and Project Insights

### React Native Limitations
- Web APIs like `crypto.randomUUID()` are not available
- Must use React Native compatible alternatives
- Some npm packages have different behavior on React Native vs web

### Expo Go Considerations
- Some native modules may not work in Expo Go
- Background location tracking requires development build for full functionality
- Test on real device for location features

### Zustand Persist with AsyncStorage
- Must handle JSON serialization manually for complex types
- Date objects become strings when serialized
- Error handling is critical to prevent crashes