# Git Profile Manager

An Electron application to easily switch between multiple Git profiles. 

By Ahmet YILDIZ | phosimurg

## Features

- Add, delete, edit, and activate profiles
- View the currently active profile
- Manage Git config settings easily
- Automatically create a profile on first launch
- Detect external Git config changes and offer to save them

## New Feature Testing

### Automatic Profile Creation on First Launch

When you launch the application for the first time, it will automatically create a profile by reading the username and email from your local Git config.

**How to Test:**

1. Clear the application data (usually located at `%APPDATA%/git-profile-manager`).
2. Ensure your Git configuration (`git config`) has a username and email set.
3. Launch the application.
4. A profile should be created automatically.

### Detecting External Changes

If the Git config is changed outside the application, Git Profile Manager will detect it and notify you.

**How to Test:**

1. Start the application.
2. Open another terminal or command prompt.
3. Run the following commands:
   ```bash
   git config --global user.name "New Name"
   git config --global user.email "new@email.com"
   ```
4. Within 10 seconds, the application will detect the changes and show a notification.
5. You can click "Save as Profile" or ignore the changes.

## Installation

### Install Dependencies

```bash
npm install
```

### Run in Development Mode

```bash
# This command will start the React server and then launch the Electron app
npm run electron:dev
```

### Build the Application

```bash
npm run electron:build
```

## Project Structure

```
git-profile-manager/
├── electron/
│   ├── main.js       # Electron main process
│   └── preload.js    # Preload script for API communication
├── public/           # React static files
├── src/
│   ├── components/   # React components
│   │   ├── ActiveProfile.js
│   │   ├── ProfileForm.js
│   │   └── ProfileList.js
│   ├── App.js        # Main app component
│   └── index.js      # React entry point
└── package.json      # Project dependencies and scripts
```

## Setup Steps

1. Install the required npm packages:

```bash
npm install wait-on concurrently electron electron-is-dev --save-dev
```

2. Start the application:

```bash
npm run electron:dev
```

## Troubleshooting

### React Hook Errors

If you encounter React Hook errors, it might be caused by multiple versions of React being included. Follow these steps:

```bash
rm -rf node_modules
rm package-lock.json
npm install
npm run electron:dev
```

### Application Shows a Blank Screen

- Check for error messages in the terminal.
- Make sure the React development server (usually running at `localhost:3000`) is active.
- Ensure the preload script (`preload.js`) is correctly loaded.
- If you encounter CSP (Content Security Policy) errors, you can temporarily disable web security during development by updating the `package.json` script:

```json
"electron:start": "wait-on http://localhost:3000 && electron --disable-web-security ."
```
