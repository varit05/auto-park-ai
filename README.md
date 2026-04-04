# AutoPark AI 🅿️

An AI-powered automatic parking booking app for iOS that integrates with PaybyPhone to automatically book parking when you arrive at saved locations.

## Features

### 🤖 AI-Powered Automation
- **Fully Automatic Mode**: Automatically books parking when you arrive at a saved location
- **Semi-Automatic Mode**: Asks for confirmation before booking
- **Manual Mode**: Only notifies you when you arrive

### 🧠 Smart Decision Making
- AI analyzes context (time of day, day of week, historical patterns) to suggest optimal parking duration
- Supports multiple AI providers: Mock (demo), Ollama (local), OpenAI, and Claude
- Learns from your parking history to improve suggestions

### 📍 Location-Based Triggering
- Geofencing around saved locations (home, office, gym, etc.)
- Background location monitoring
- Smart arrival detection

### 🚗 Multi-Vehicle Support
- Add multiple vehicles
- Set default vehicle for automatic booking

### 💳 Flexible Payment
- Support for multiple payment methods
- Card and Apple Pay integration

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: Zustand
- **Navigation**: React Navigation
- **Location**: Expo Location + Background Tasks
- **Notifications**: Expo Notifications
- **Storage**: AsyncStorage

## Project Structure

```
auto-park-gen-ai/
├── app/
│   ├── components/       # Reusable UI components
│   ├── screens/          # App screens
│   │   ├── HomeScreen.tsx
│   │   ├── LocationsScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── HistoryScreen.tsx
│   ├── services/         # Business logic services
│   │   ├── locationService.ts    # Location tracking & geofencing
│   │   ├── paybyphoneService.ts  # PaybyPhone integration
│   │   ├── aiService.ts          # AI/LLM integration
│   │   ├── notificationService.ts # Notifications
│   │   └── automationService.ts   # Automation orchestration
│   ├── store/            # Zustand store
│   ├── types/            # TypeScript definitions
│   ├── utils/            # Helper functions
│   └── App.tsx           # Main app component
├── assets/               # Images and icons
├── app.json              # Expo configuration
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript configuration
└── babel.config.js       # Babel configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- iOS device or simulator (iOS 14+)
- Xcode (for iOS development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/varit05/auto-park-gen-ai.git
cd auto-park-gen-ai
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm start
# or
yarn start
```

4. Run on iOS:
- Press `i` in the terminal to open in iOS simulator
- Or scan the QR code with the Expo Go app on your iOS device

### Configuration

1. **Add Locations**: Go to the Locations tab and add places where you want automatic parking
2. **Add Vehicle**: Go to Settings and add your vehicle details
3. **Add Payment**: Add your preferred payment method
4. **Configure Automation**: Choose your automation mode (Fully Automatic, Semi-Automatic, or Manual)
5. **Enable AI**: Toggle AI-powered suggestions if desired

### AI Configuration

The app supports multiple AI providers:

#### Mock (Default - Demo)
No configuration needed. Uses smart heuristics for demo purposes.

#### Ollama (Local - Free)
1. Install [Ollama](https://ollama.ai) on your computer
2. Pull a model: `ollama pull llama2`
3. In the app settings, select "Ollama (Local)" as the AI provider
4. Ensure your phone and computer are on the same network

#### OpenAI
1. Get an API key from [OpenAI](https://platform.openai.com)
2. In the app settings, select "OpenAI" as the AI provider
3. Enter your API key

#### Claude
1. Get an API key from [Anthropic](https://console.anthropic.com)
2. In the app settings, select "Claude" as the AI provider
3. Enter your API key

## How It Works

### Automation Flow

1. **Location Monitoring**: The app continuously monitors your location in the background
2. **Geofence Detection**: When you enter a saved location's geofence, the app triggers
3. **AI Analysis**: If enabled, the AI analyzes the context to suggest optimal duration
4. **Booking**: Based on your automation mode:
   - **Fully Automatic**: Books parking immediately
   - **Semi-Automatic**: Shows a notification for confirmation
   - **Manual**: Only notifies you of arrival

### PaybyPhone Integration

The app integrates with PaybyPhone via:
- **Deep Linking**: Opens the PaybyPhone app with pre-filled location data
- **Web Fallback**: Opens the PaybyPhone website if the app isn't installed

> **Note**: Full automation requires the PaybyPhone app to be installed. Some manual interaction may be required due to iOS security restrictions.

## iOS Permissions

The app requires the following permissions:
- **Location (Always)**: For background location monitoring
- **Notifications**: For booking confirmations and alerts

## Limitations

### iOS Restrictions
- iOS restricts fully automatic app launching for security reasons
- Some user interaction may be required for final booking confirmation
- Background location updates may be limited by iOS

### PaybyPhone Integration
- Requires PaybyPhone app to be installed for best experience
- No official API access; uses deep linking
- Some features may require manual completion in the PaybyPhone app

## Development

### Adding New Features

1. Create new components in `app/components/`
2. Add new screens in `app/screens/`
3. Add services in `app/services/`
4. Update types in `app/types/`

### Running Tests

```bash
npm test
# or
yarn test
```

### Building for Production

```bash
# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Disclaimer

This app is for personal use and educational purposes. It is not affiliated with or endorsed by PaybyPhone. Users are responsible for their own parking bookings and payments.

## Support

For issues and questions:
- GitHub Issues: [Report a bug](https://github.com/varit05/auto-park-gen-ai/issues)
- Email: support@autopark-ai.com

---

Built with ❤️ using React Native and Expo