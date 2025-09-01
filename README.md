# 2FA Code Manager

A web app for managing 2FA codes with one-time use functionality, built with React, Vite, and Firebase.

## Features

- Generate and manage 2FA codes
- One-time use functionality
- User authentication and authorization
- Real-time database synchronization
- Responsive design

## Tech Stack

- **Frontend**: React 18, Vite
- **Database**: Firebase Realtime Database
- **Authentication**: Firebase Auth
- **Encryption**: AES-GCM with Web Crypto API
- **Styling**: CSS3 with modern design
- **Icons**: Lucide React
- **Charts**: Recharts

## Firebase Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "2fa-code-manager")
4. Follow the setup wizard

### 2. Enable Services

1. **Realtime Database**:

   - Go to Realtime Database in the sidebar
   - Click "Create database"
   - Choose "Start in test mode" for development
   - Select a location close to your users

2. **Authentication**:
   - Go to Authentication in the sidebar
   - Click "Get started"
   - Enable "Email/Password" sign-in method

### 3. Get Configuration

1. Click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>)
5. Register your app with a nickname
6. Copy the configuration object

### 4. Update Configuration

Replace the placeholder values in `src/firebase/config.js`:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-actual-messaging-sender-id",
  appId: "your-actual-app-id",
};
```

### 5. Deploy Security Rules

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init`
4. Deploy rules: `firebase deploy --only database`

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

### Build for Production

```bash
npm run build
```

This creates a `dist/` folder with your production-ready application.

### Deploy to Firebase Hosting

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize hosting: `firebase init hosting`
4. Deploy: `firebase deploy`

### Deploy to Other Platforms

The `dist/` folder contains static files that can be deployed to:

- **Vercel**: Drag and drop the `dist/` folder
- **Netlify**: Drag and drop the `dist/` folder
- **GitHub Pages**: Push the `dist/` folder to a `gh-pages` branch
- **Any static hosting service**: Upload the contents of `dist/` folder

## Project Structure

```
src/
├── firebase/           # Firebase configuration and services
│   ├── config.js      # Firebase app initialization
│   ├── database.js    # Realtime Database operations
│   ├── auth.js        # Authentication services
│   └── index.js       # Service exports
├── components/         # React components
│   ├── AuthModal.jsx  # Authentication modal
│   ├── CodeModal.jsx  # Code creation modal
│   ├── CodeViewer.jsx # Code display modal
│   └── CollectionModal.jsx # Collection creation modal
├── App.jsx            # Main application component
├── main.jsx           # Application entry point
└── index.css          # Global styles
```

## Database Schema

### Users Collection

```javascript
{
  uid: "string",           // Firebase Auth UID
  email: "string",         // User email
  displayName: "string",   // User display name
  createdAt: "timestamp",  // Account creation date
  updatedAt: "timestamp"   // Last update date
}
```

### Codes Collection

```javascript
{
  userId: "string",        // Reference to user
  code: "string",          // The 2FA code
  description: "string",   // Code description/label
  isUsed: "boolean",       // Whether code has been used
  createdAt: "timestamp",  // Code creation date
  updatedAt: "timestamp"   // Last update date
}
```

## Security Rules

The Realtime Database security rules ensure:

- Users can only access their own data
- Authentication is required for all operations
- Data integrity is maintained

## Environment Variables

For production, consider using environment variables for Firebase configuration:

```bash
# .env.local
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
# ... etc
```

Then update `src/firebase/config.js` to use them:

```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  // ... etc
};
```
