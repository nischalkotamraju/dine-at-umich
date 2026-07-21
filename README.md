# Dine @ Michigan

A fast, no-nonsense dining app for University of Michigan students — menus, hours, and locations for every dining hall, café, grill, and market on campus, without the clunky official portals.

## What it does

- **Live menus** for every dining hall, café, market, and the grill — organized by meal period, with nutrition facts and allergen/dietary tags (halal, vegan, contains-peanuts, etc.) on every item.
- **Open/closed status at a glance**, computed from each location's actual posted hours, plus a heads-up when somewhere's about to close or about to open.
- **Filter by location type or accepted payment method** (Blue Bucks, M-Card, cash, credit/debit) right from the home screen.
- **Favorites** for both locations and specific food items, with an optional alert when a favorited food shows up on today's menu.
- **Interactive campus map** to find dining locations relative to where you are.
- **Home Screen widget** showing your favorite locations' open/closed status without opening the app.
- **Light and dark mode**, built to match iOS system appearance.

## How the data stays fresh

A scheduled scraper runs several times a day, pulling current menus directly from `dining.umich.edu` and syncing them into a Supabase database that the app reads from. No manual updates, no stale menus.

## Tech stack

- [Expo](https://expo.dev) / React Native, file-based routing via `expo-router`
- Local-first data layer: SQLite (via Drizzle ORM) synced from [Supabase](https://supabase.com)
- Playwright-based scraper (`scripts/scrape-menus.mjs`) running on a GitHub Actions schedule
- Zustand for local app state, PostHog for anonymous, privacy-respecting product analytics

## Getting started

```bash
npm install
npm run start
```

Requires a `.env` with the Supabase project credentials (see `.env.example` if present, or ask a maintainer).

## Privacy

Dine @ Michigan doesn't require an account and doesn't sell or share personal data. See the [privacy policy](https://nischalkotamraju.github.io/dine-at-michigan/privacy.html) for details.

## Feedback

Found a bug or have a feature request? [Suggest it here](https://dinemichigan.userjot.com).
