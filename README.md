# Faulty Hermes 🏛️

Faulty Hermes is a language learning application designed to help users master new languages through interactive chats and learning partners.

## Features
- **Dynamic Onboarding**: Quick setup for native and target languages.
- **Learning Partners**: Connect with others to practice.
- **Progress Tracking**: Real-time streak and learning statistics.
- **Premium UI**: Modern light-themed design with liquid-spatial aesthetics.
- **Auth Persistence**: Integrated Firebase Auth with AsyncStorage for seamless sessions.

---

## Getting Started: Frontend

The frontend is built using **React Native** and **Expo**.

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or later recommended)
- [Expo Go](https://expo.dev/expo-go) app on your mobile device (to test on physical hardware)

### 1. Installation
Navigate to the frontend directory and install the necessary dependencies:

```bash
cd frontend
npm install
```

### 2. Environment Configuration
Create a `.env` file in the `frontend` directory and add your Firebase configuration:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 3. Running the App
Start the Expo development server:

```bash
npx expo start
```

*   **To run on a physical device**: Scan the QR code with the Expo Go app.
*   **To run with a tunnel (useful for remote testing)**:
    ```bash
    npx expo start --tunnel
    ```
*   **To clear cache if encountering issues**:
    ```bash
    npx expo start -c
    ```

---

## Tech Stack
- **Framework**: React Native / Expo
- **Backend**: Firebase (Auth, Firestore)
- **Navigation**: React Navigation
- **Icons**: Lucide React Native
- **Persistence**: React Native AsyncStorage

## Development
For testing purposes, the Login and Signup screens currently support a **Guest Bypass**. You can click "Login" or "Sign Up" with empty credentials to instantly access the dashboard and view the UI.
