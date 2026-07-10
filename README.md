# Dine @ Michigan

Dine @ Michigan is your companion app for exploring dining options at the University of Michigan.
Browse menus, check dining hours, and find the perfect meal on campus.

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [How it Works](#how-it-works)
4. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [VSCode Extensions](#vscode-extensions)
   - [Installation](#installation)
5. [Project Structure](#project-structure)
6. [Contributing](#contributing)
7. [Frequently Asked Questions](#frequently-asked-questions)
8. [License](#license)

## Features

- **Real-time Menu Updates**: View current menus for University of Michigan dining locations
- **Menu History & Planning**: View past menus and upcoming menus for the week
- **Interactive Campus Map**: Find and navigate to dining halls, food trucks, coffee shops, cafés, and convenience stores across campus
- **Favorites**: Save your favorite food items and get notified when they appear on menus
- **Allergen Information**: Filter food items based on dietary restrictions and allergens
- **Comprehensive Location Info**: Check operating hours, payment methods, and real-time status for all dining locations
- **Push Notifications**: Stay updated with the latest dining alerts and updates
- **Offline Support w/ Caching**: Access menus, location info, and your favorites even without an internet connection
- **Home Screen Widget**: See your favorite locations' open/closed status right from your Home Screen
- **Accessibility Features**:
  - Dark Mode: Enhanced visibility in low-light conditions
  - Color Blind Mode: Improved color accessibility
  - Colloquial Names: Toggle between official and common location names

## Tech Stack

- **Framework**: [Expo](https://expo.dev/) + [React Native](https://reactnative.dev/)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/)
- **Global State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Database**:
  - Remote: [Supabase](https://supabase.com/)
  - Local: [SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) with [Drizzle ORM](https://orm.drizzle.team/) (learn more [here](https://expo.dev/blog/modern-sqlite-for-react-native-apps))
- **Data Fetching**: [TanStack Query](https://tanstack.com/query/latest) (React Query)
- **Persistent Storage**: [MMKV](https://github.com/mrousavy/react-native-mmkv)
- **Analytics**: [PostHog](https://posthog.com/) with session replay and auto-capture
- **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for React Native)
- **Icons**: [Lucide React Native](https://lucide.dev/guide/packages/lucide-react-native)

## How it Works

The menu data is scraped from the University of Michigan's official [dining site](https://dining.umich.edu/menus-locations/), using the scraper script in [`scripts/scrape-menus.mjs`](scripts/scrape-menus.mjs). Once the menus are scraped, the data is stored in a **Supabase** database.

Every day, the **Expo** mobile application fetches the latest menu data from the database, keeping the application up-to-date. To optimize performance and reduce loading times, the data is cached locally in an **SQLite** database using **Drizzle ORM**. This local cache allows the app to quickly retrieve the necessary information, ensuring a smooth, **offline-first** user experience.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [pnpm](https://pnpm.io/installation)
- [Docker Desktop](https://docs.docker.com/desktop/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- An iOS or Android emulator. Follow the guide [here](https://docs.expo.dev/workflow/android-studio-emulator/) to set up an Android emulator or [here](https://docs.expo.dev/workflow/ios-simulator/) for an iOS simulator.

### VSCode Extensions

We recommend using the following VSCode extensions to improve your development experience:

- **[Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)**: For Tailwind CSS class autocomplete and IntelliSense.

### Installation

1. **Clone the Repository**

   ```sh
   git clone https://github.com/nischalkotamraju/dine-at-michigan.git
   cd dine-at-michigan
   ```

2. **Install Dependencies**

   ```sh
    pnpm install
   ```

3. **Run Local Supabase Instance**

   For this step, you need [Docker Desktop](https://docs.docker.com/desktop/) installed on your machine. Follow the guide to install it on your system.

   Next, install the Supabase CLI. Follow the guide [here](https://supabase.com/docs/guides/local-development/cli/getting-started?queryGroups=platform&platform=macos#installing-the-supabase-cli).

   After installing the Supabase CLI, run the following command to start a local Supabase instance:

   ```sh
   supabase start
   ```

   Once it's up and running, you should see a message like this in the terminal:

   ```sh
   Started supabase local development setup.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
        anon key: eyJh......
   service_role key: eyJh......
   ```

   The `API URL` and `anon key` are the environment variables you need to configure in the next step.

   To seed your local database with menu data, run the scraper script in [`scripts/scrape-menus.mjs`](scripts/scrape-menus.mjs) against your local Supabase instance.

4. **Configure Environment Variables**

   Copy the `.env-example` file to create a `.env` file:

   ```sh
   cp .env-example .env
   ```

   Update with your Supabase credentials and optionally add PostHog analytics:

   ```sh
    EXPO_PUBLIC_SUPABASE_URL=<supabase-url>
    EXPO_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
    EXPO_PUBLIC_POSTHOG_API_KEY=<posthog-api-key> # Optional - for analytics tracking
   ```

   > **Note**: The PostHog API key is optional. If not provided, analytics will be disabled. Analytics are automatically disabled in development mode.

5. **Create an Expo Account**

   Create an account at [expo.dev](https://expo.dev). Once you create the account, you can log in with:

   ```sh
   npx expo login
   ```

6. **Setup the Development Build**

   Since the app uses [react-native-mmkv](https://github.com/mrousavy/react-native-mmkv?tab=readme-ov-file) instead of `AsyncStorage`, you must run it with a development build rather than Expo Go.

   Run the following commands to build the development version:

   - **For iOS:**

     ```sh
     pnpm run ios
     ```

   - **For Android:**

     ```sh
     pnpm run android
     ```

   If you're developing for both platforms, run both commands.

   > **Note**: The build process may take some time. Please wait until it completes.

7. **Analytics Setup (OPTIONAL)**

   If you want to enable analytics tracking for your development environment:

   1. Create a free account at [PostHog](https://posthog.com/)
   2. Create a new project and copy your API key
   3. Add the API key to your `.env` file as `EXPO_PUBLIC_POSTHOG_API_KEY`

   > **Note**: Analytics are automatically disabled in development mode for privacy. Session replay and auto-capture will only work in production builds.

8. **Download to physical device (OPTIONAL)**

   If you want to test the app on a physical device, connect your device to your computer
   with a USB cable and run the following command:

   - **For iOS:**

   ```sh
   npx expo run:ios --device
   ```

   - **For Android:**

   ```sh
   npx expo run:android --device
   ```

   > **Note**: Make sure to enable USB debugging on your Android device. You can find the instructions [here](https://developer.android.com/studio/debug/dev-options).

   This will install the development build onto your device.

9. **Start the Development Server**

   ```sh
   pnpm run start
   ```

   Make sure that you are using `development build` instead of `Expo Go` when running the app. You can switch to the development build by pressing `s` in the terminal.

   **Tunneling for Physical Devices**

   If you're using a physical device on a public Wi-Fi network, use the following commands to tunnel the server to your device:

   ```sh
   pnpm run start --tunnel
   ```

   > Note: Tunneling may have limitations with Supabase connections. Using an emulator or development build is recommended for full functionality.

   **Debugging Drizzle with Drizzle Studio**

   While the development server is running, press `Shift + M` in the terminal and select `expo-drizzle-studio-plugin` to open Drizzle Studio in your browser. You can use this tool to inspect the SQLite database and troubleshoot any issues related to the local cache with SQLite and Drizzle ORM. Read more about Drizzle Studio [here](https://orm.drizzle.team/drizzle-studio/overview).

10. **Launch Emulators**

To open the app on an emulator, press either of the following keys in the terminal:

- `i` to open on iOS simulator
- `a` to open on Android emulator

## Project Structure

```txt
dine-at-michigan/
├── app/               # Expo Router screens and local UI components
├── assets/            # Images and static assets
├── components/        # Global reusable UI components
├── data/              # Static data and constants
├── drizzle/           # Drizzle ORM migrations and metadata
├── hooks/             # Custom React hooks
├── ios/               # Native iOS project (incl. Home Screen widget extension)
├── scripts/           # Menu scraping scripts
├── services/          # Service layer (analytics, database, notifications, device)
│   ├── analytics/     # PostHog analytics configuration
│   ├── database/      # SQLite schema and database utilities
│   └── notifications/ # Push notification services
├── store/             # Zustand state management with MMKV persistence
├── supabase/          # Supabase local client, migrations, and utilities
├── types/             # TypeScript type definitions
└── utils/             # Helper functions and utilities
```

## Frequently Asked Questions

### General

**Q: Is this app officially affiliated with the University of Michigan?**
A: No, this is an independently created project that aims to improve the dining experience at the University of Michigan. While it uses publicly available data from Michigan Dining, it is not officially affiliated with the university.

**Q: Where does the menu data come from?**
A: The menu data is scraped daily from [Michigan Dining's official menu pages](https://dining.umich.edu/menus-locations/) using the scraper in [`scripts/scrape-menus.mjs`](scripts/scrape-menus.mjs).

**Q: How often is the menu data updated?**
A: The menu data is refreshed daily to ensure you have the most current information.

### Development

**Q: Do I need to run the scraper to test the app locally?**
A: No, you can develop and test the app without running the scraper, but running it against your local Supabase instance is recommended to fully test all of the app's features.

**Q: What is local Supabase development and why do I need it?**
A: Local Supabase development means running Supabase on your own computer instead of using a hosted service. This gives you:

- A completely isolated development environment
- Freedom to experiment without affecting production data
- No need for external credentials or API keys
- Faster development since you're working with a local database

The setup requires Docker Desktop and Supabase CLI, but once configured, it provides a full Supabase environment including database, authentication, and real-time features. Check the [Supabase Local Development](https://supabase.com/docs/guides/cli/local-development) docs for more details.

**Q: Why can't I use Expo Go?**
A: The app uses [react-native-mmkv](https://github.com/mrousavy/react-native-mmkv) for storage, which requires native code. Expo Go doesn't support native modules, so you need to use a development build instead.

**Q: I'm getting SQLite errors, what should I do?**
A: Make sure you're using a development build and not Expo Go. If the error persists, try:

1. Delete the app from your device/emulator
2. Rebuild using `pnpm run ios` or `pnpm run android`
3. If issues continue, check Drizzle Studio (press `Shift + M` in terminal) to inspect the database

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes using [conventional commit messages](https://www.conventionalcommits.org/):
   ```sh
   feat: add new feature
   fix: resolve issue with X
   docs: update documentation
   style: format code (no functional changes)
   refactor: restructure code without changing behavior
   test: add or update tests
   chore: update dependencies or configuration
   ```
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
