# Atlas Explorer (React)

Atlas Explorer is a browser-based geography arcade game built around three mini-games that test location knowledge across the US and Canada.

This project has been fully migrated from a legacy Vanilla JS codebase to a modern React + TypeScript + Vite architecture. The visual polish, sound effects, and game logic have all been ported and enhanced.

## Features

- **Three Mini-Games**: Code Drop, Pin Rush, and City Stack.
- **Visual Polish**: Vibrant colors, 3D tilt effects, particle systems, and Lottie animations.
- **Audio System**: Immersive sound effects and background music.
- **Progressive Training**: A structured flow from training to gameplay.
- **Results & Leaderboards**: Track your performance with stars, badges, and streaks.

## Project Structure (New)

The application logic now resides in the `app/` directory:

- `app/src/features/`: Feature-based modules (landing, training, games, results).
- `app/src/components/ui/`: Reusable UI components (particles, animated cards, lottie players).
- `app/src/hooks/`: Custom hooks for audio and session management.
- `app/src/lib/`: Core game logic and scoring utilities.
- `app/public/assets/`: Visual assets (videos, images, lotties).
- `app/public/sfx/`: Audio assets and manifest.

## Running Locally

To start the development server:

```powershell
npm run dev
```

This will run `cd app && npx vite`.

## Testing

To run the Vitest suite:

```powershell
cd app
npm run test
```

## Legacy Cleanup

As of May 2026, the legacy Vanilla JS files (`index.html`, `game.html`, `js/`, `css/`, etc.) have been removed from the root directory to eliminate technical debt.
