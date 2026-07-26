# Development Build & Deployment

## Expo development build

```bash
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build --profile development --platform ios
npx expo start --dev-client
```

## Web preview

```bash
npm run build:web
npx serve dist
```

## Vercel deployment

1. Install the Vercel CLI and link the project:

```bash
npm i -g vercel
vercel --token $VERCEL_TOKEN
```

2. Add `VERCEL_TOKEN` to your CI/GitHub secrets if deploying from GitHub Actions.

3. `vercel.json` is already configured to build `dist/` and rewrite routes to `index.html`.

The web preview uses SQLite through `expo-sqlite`'s web worker; persistent storage in the browser is limited by the browser environment.
