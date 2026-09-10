<a href='https://www.saashub.com/postly?utm_source=badge&utm_campaign=badge&utm_content=postly&badge_variant=color&badge_kind=approved' target='_blank'><img src="https://cdn-b.saashub.com/img/badges/approved-color.png?v=1" alt="Postly badge" style="max-width: 150px;"/></a>

# Postly 🔵 

A modern, open-source social media mobile application built with React Native and Expo.

## 🎯 Mission & Vision

The tech world often leaves invisible identities behind. Postly is built to be a safe, and inclusive digital home. Our mission focuses on:
- Digital Representation: Giving a voice to unrepresented nations cultures and communities.
- Privacy by Design: Putting the user back in control of their personal data.
- Lean Architecture: Optimized for lower bandwidth environments, ensuring high performance across various mobile devices and networking conditions.

## Features

- Authentication — Sign up, login, forgot password (Supabase Auth)
- Home Feed — Infinite scrolling feed with stories and posts
- Search — Discover users and content
- Camera — Built-in camera for capturing photos/videos
- Compose — Create new posts with media attachments
- Comments — Threaded comment system
- Direct Messages — Real-time messaging with Supabase Realtime
- Push Notifications — Expo push notifications
- User Profiles — View and edit profiles, follow/unfollow
- Stories — Create and view ephemeral stories
- Love Mode — Interactive 20-questions matching for mutual follows
- Account Switching — Multi-account support for seamless profile management
- File Contributions — Community-driven asset sharing (music, artwork, themes) via "Donate a File"
- Dark Theme — Full dark mode UI
- Interoperability — Built for decentralization and integration with open communication standards like the ActivityPub protocol (Fediverse ecosystem)

## 🛡️ Performance & Privacy Core

- Aggressive Caching & Minimal Fetching: Built following "Lean" development principles to ensure data efficiency and minimal battery drain.
- Image & Media Compression: Advanced image optimization before network uploads to adapt to varying global internet speeds.
- Database-Level Security: Secure access managed via strict Supabase Row Level Security (RLS) policies.
- Future-Proof Roadmap: Planning for decentralized networking and integration with open communication standards like the ActivityPub protocol (Fediverse ecosystem).

## 🚀 Environment Configuration for EAS
When building with EAS, your local `.env` files are ignored. You must configure environment variables in the Expo dashboard or `eas.json`:

1. **EAS Secrets**: Run `eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value <your-url>`
2. **EAS JSON**: Add an `env` object to your profile in `eas.json`.

## Tech Stack

- React Native + Expo SDK 54 (New Architecture)
- React 19 + React Native 0.81.5
- Reanimated 4 — Experimental worklet engine
- Expo Router — File-based navigation
- NativeWind — Tailwind CSS for React Native
- Supabase — Auth, Database, Storage, Realtime
- TypeScript — Type-safe codebase.

## Architecture

- Expo Router provides file-based navigation via the app/ directory. Each folder maps to a route segment, with layout files (`_layout.tsx`) controlling navigation containers.
- Supabase handles the entire backend: Auth for user sessions, Database (PostgreSQL) for data, Storage for media uploads, and Realtime for live messaging/notifications.
- NativeWind (Tailwind CSS for React Native) is used throughout for styling — all component classes follow Tailwind conventions.
- AppContext (`store/AppContext.native.tsx`) manages global state (auth session, user profile, feed data) using React Context + hooks.

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator or Android Emulator (or physical device with Expo Go)

### Installation
```
# Clone the repository
git clone https://github.com/postly-app/postly-social-mobile.git
cd postly-social-mobile

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

### Environment Variables

All environment variables use the `EXPO_PUBLIC_` prefix, which Expo exposes to client-side code at build time. Copy `.env.example` to `.env.local` and fill in your values:

| Variable | Description | Required |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Yes |

> Note: `EXPO_PUBLIC_SUPABASE_ANON_KEY` is a public key designed for client-side use. It is protected by Supabase Row Level Security (RLS) policies — it does not grant admin access. Never commit your Supabase service role key or `.env.local`.

### Running
```
# Start the development server
npx expo start

# Run on iOS
npx expo start --ios

# Run on Android
npx expo start --android
```

### Building for Production

#### Option 1: Build with EAS (Cloud)
```bash
eas build --platform android --profile preview
```

#### Option 2: Local Windows Build (Manual)
If you reach your EAS free tier limit, use this command in PowerShell:
```powershell
$env:PATH += ";C:\Program Files\nodejs"; cd android; ./gradlew assembleRelease
```
The APK will be at `android/app/build/outputs/apk/release/app-release.apk`.

#### Option 3: GitHub Actions (Cloud Link)
Push your code to GitHub and check the **Actions** tab. It will automatically build an APK and provide a download link in the "Artifacts" section.

#### Troubleshooting Local Builds
- **Licenses Not Accepted**: Run `sdkmanager --licenses` in your Android SDK bin folder.
- **Node Not Found**: Ensure `$env:NODE_BINARY = "node"` is set in your terminal session.

## Project Structure
```
postly-social-mobile/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main tab navigation
│   ├── comments/          # Comment threads
│   ├── post/              # Post detail views
│   └── user/              # User profiles
├── components/            # Reusable components
│   ├── native/            # Native-specific components
│   └── screens/           # Screen components
├── services/              # API and business logic
│   ├── apiService.ts      # Supabase API layer
│   └── supabase.native.ts # Supabase client
├── store/                 # State management
│   └── AppContext.native.tsx
├── assets/                # Images, fonts, icons
└── app.json               # Expo configuration
```

## Security

- Supabase anon key (`EXPO_PUBLIC_SUPABASE_ANON_KEY`) is a client-side key that is designed to be public. It is protected by Supabase Row Level Security (RLS) policies on the database side — it cannot bypass RLS or access admin operations.
- Never commit `.env.local` or any file containing service role keys, secrets, or private credentials. `.env.local` is gitignored by default.
- If you discover a security vulnerability, please report it via [GitHub Issues](https://github.com/postly-app/postly-social-mobile/issues) or see [SECURITY.md](SECURITY.md) for responsible disclosure details.

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on setting up your development environment, creating branches, submitting pull requests, and code style expectations.

## License

Copyright ©️ 2026 Postly. All rights reserved.

Postly is licensed under the [Apache License 2.0](LICENSE).

```
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

See [NOTICE](NOTICE) for third-party library attributions.

## Production Checklist

1. **Assets**: Ensure `assets/icon.png` is the final production icon.
2. **EAS Build**: Run `eas build --platform android` (or `eas build --platform ios`) to generate the production binaries.
3. **Environment Sync**: Verify that the Supabase `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in the build environment match the production instance.

The project is now ready for the final production build phase.

## 🚀 OTA Updates (EAS Update)

Postly supports Over-the-Air (OTA) updates using Expo EAS Update. This allows you to push bug fixes and UI improvements to users immediately without them having to download a new APK or app store update.

### How it works:
1.  **Native Code vs JS**: As long as you don't change native dependencies (like adding a new `expo-*` library that requires native changes), you can push updates OTA.
2.  **Branches**: Updates are published to specific branches (e.g., `production`, `preview`).

### Pushing an Update:
1.  **Install EAS CLI**: `npm install -g eas-cli`
2.  **Configure (First time)**: `eas update:configure`
3.  **Publish Changes**:
    ```bash
    eas update --branch production --message "Fix chat persistence and sync issues"
    ```
4.  **User Experience**: The next time a user opens the app, it will check for updates in the background. On the subsequent restart, the new version will be active.

## Acknowledgments

Built with ❤️
Maintained and managed by [Postly](https://github.com/postly-app) 🔵
