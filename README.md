# CloudTown Website

[![Crowdin](https://badges.crowdin.net/ctec-website/localized.svg)](https://crowdin.com/project/ctec-website)

A modern, multilingual website built with Next.js, React, and TypeScript.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v20.x or higher ([Download here](https://nodejs.org/))
- **Corepack** (included with Node.js 16.9+)

## 🚀 Getting Started

### 1. Enable Corepack

This project uses Yarn 4.x, which requires Corepack to be enabled:

```bash
corepack enable
```

> **Note:** Corepack is included by default with Node.js 16.9+ and will automatically use the correct Yarn version specified in `package.json`.

> **Windows Users:** You need to run this command in PowerShell **as Administrator** (Win + X → "Terminal (Admin)"). This is a one-time setup.

### 2. Install Dependencies

```bash
yarn install
```

### 3. Run Development Server

```bash
yarn dev
```

The development server will start at `http://localhost:3000` (or another available port).

## 📦 Available Scripts

| Command             | Description                                  |
| ------------------- | -------------------------------------------- |
| `yarn dev`          | Start development server with HMR            |
| `yarn build`        | Build the static site into `out/`            |
| `yarn start`        | Serve the built `out/` folder locally        |
| `yarn typecheck`    | Run the TypeScript compiler without emitting |
| `yarn test:e2e`     | Compare the build against mc-ctec.org        |
| `yarn lint`         | Run ESLint to check code quality             |
| `yarn format`       | Format code with Prettier                    |
| `yarn format:check` | Check code formatting without making changes |

## 🏗️ Tech Stack

- **Framework:** Next.js 16 (App Router, static export) with React 19 and TypeScript
- **Styling:** Styled Components with Ant Design
- **Internationalization:** i18next
- **Testing:** Playwright visual parity tests
- **Package Manager:** Yarn 4.12.0 (Berry)

## 🌐 Internationalization

This project supports multiple languages:

- English (en)
- Traditional Chinese (zh_TW)
- Simplified Chinese (zh_CN)

Translations are managed via [Crowdin](https://crowdin.com/project/ctec-website).

## 🚢 Deployment

The website is automatically deployed to GitHub Pages via GitHub Actions when changes are pushed to the `main` branch.

### Manual Deployment

1. Build the project:

   ```bash
   yarn build
   ```

2. Deploy the `out` folder to your hosting service.

## 🧪 Parity Tests

`tests/parity.spec.ts` loads every route on the live site and on the local
build (light and dark theme, desktop and mobile) and compares the visible text
and full-page screenshots.

```bash
yarn build
npx playwright install chromium
yarn test:e2e
```

Set `PARITY_LIVE_URL` to compare against a different deployment.

## 🔧 CI/CD

The project uses GitHub Actions for continuous deployment. Key features:

- **Corepack Integration:** Automatically uses Yarn 4.12.0
- **Dependency Caching:** Caches Yarn dependencies for faster builds (~140 MB)
- **Auto-deployment:** Deploys to GitHub Pages on push to `main`

## 📝 Development Notes

### Using Yarn 4.x

This project uses Yarn Berry (v4.12.0). Key differences from Yarn 1.x:

- ✅ Faster installs with better caching
- ✅ More efficient dependency resolution
- ✅ Better security with zero-installs support
- ⚠️ Some CLI flags differ from Yarn 1.x (e.g., use `YARN_IGNORE_NODE=1` instead of `--ignore-engines`)

### ESLint Configuration

For production applications, consider enabling type-aware lint rules:

```js
export default {
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
};
```

Then update to use `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`.

## 📄 License

This project is licensed under the [GNU General Public License v3.0](LICENSE).

You are free to use, modify, and distribute this software under the terms of the GPL-3.0 license.

## 🤝 Contributing

Contributions are welcome! Please ensure your code follows the project's ESLint and Prettier configurations.
