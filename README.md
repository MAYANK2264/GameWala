# 🎮 GameWala - Inventory Management System

<div align="center">

![GameWala Logo](public/assets/GAME-WALA-FLAT.png)

**A modern, mobile-first inventory management system for gaming console shops**

[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10+-FFCA28?logo=firebase)](https://firebase.google.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-4285F4?logo=pwa)](https://web.dev/progressive-web-apps/)
[![Android](https://img.shields.io/badge/Android-Supported-3DDC84?logo=android)](https://www.android.com/)

[Features](#-features) • [Problem Statement](#-problem-it-solves) • [Installation](#-installation) • [Configuration](#-configuration) • [Usage](#-usage)

</div>

---

## 📋 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Problem It Solves](#-problem-it-solves)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Mobile App](#-mobile-app--pwa)
- [Authentication Setup](#-authentication-setup)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 About

**GameWala** is a comprehensive inventory management system designed specifically for gaming console shops and repair centers. It streamlines product tracking, repair management, sales recording, and inventory operations through an intuitive, mobile-first interface.

The application is built as a Progressive Web App (PWA) that works seamlessly on web browsers, mobile devices, and can be packaged as a native Android application.

---

## ✨ Features

### 📦 Inventory Management
- **Product Tracking**: Add, edit, and manage gaming console inventory with detailed product information
- **Barcode Scanning**: Support for multiple scanning methods:
  - External USB/HID barcode scanners (keyboard emulation)
  - Device camera scanning (front/back camera support)
  - Desktop webcam scanning
  - Manual barcode entry
- **Smart Autocomplete**: Frequently used words and phrases are remembered for faster data entry
- **Product Details**: Complete product information including:
  - Barcode, Brand, Type, Condition
  - Selling Price, Acquisition Date, Source
  - Customer Phone, Status, Notes (collapsible)

### 🔧 Repair Management
- **Repair Tracking**: Create and manage repair orders with customer details
- **Status Workflow**: Drag-and-drop kanban board for repair status management
  - Received → In Progress → Repaired → Delivered
- **Condition Assessment**: Product condition tracking (Good, Bad, Very Bad, Not Repairable)
- **Delivery Scheduling**: Set and track delivery dates for repairs
- **Voice Notes**: Record audio notes for repair procedures
- **Repair History**: Complete repair records with cost tracking

### 💰 Sales & Reports
- **Sales Recording**: Track product sales with profit calculation
- **Sales Reports**: View sales history and generate reports
- **Profit Analysis**: Automatic profit calculation (Sale Price - Acquisition Price)
- **Export Functionality**: Export data for external analysis

### 👥 User Management
- **Role-Based Access**: Owner and Staff roles with different permissions
- **Email/Password Authentication**: Secure employee sign-up and sign-in
- **Google Sign-In**: Quick authentication via Google accounts
- **User Approval**: Owners can approve and manage employee access

### 📱 Mobile-First Design
- **Progressive Web App**: Install as a native app on any device
- **Touch-Optimized**: All interactive elements are touch-friendly
- **Responsive Layout**: Works perfectly on phones, tablets, and desktops
- **Offline Support**: Service worker caching for offline functionality
- **Android APK**: Can be packaged as a native Android application

### 🎨 User Experience
- **Intuitive Interface**: Clean, modern UI with smooth animations
- **Fast Performance**: Optimized with React hooks and memoization
- **Keyboard Shortcuts**: Numeric keyboard for phone fields, smart autocomplete
- **Real-time Updates**: Instant product status updates across the app

---

## 🎯 Problem It Solves

### For Gaming Console Shops:

1. **Inventory Chaos**: 
   - **Problem**: Manual tracking of gaming consoles, accessories, and parts leads to errors and lost items
   - **Solution**: Digital inventory with barcode scanning for accurate, real-time tracking

2. **Repair Management Complexity**:
   - **Problem**: Paper-based repair tickets get lost, customer information is scattered
   - **Solution**: Centralized repair management with customer details, status tracking, and delivery scheduling

3. **Sales Tracking**:
   - **Problem**: No clear visibility into sales, profits, and inventory turnover
   - **Solution**: Automated sales recording with profit calculation and reporting

4. **Mobile Accessibility**:
   - **Problem**: Desktop-only systems limit on-the-go access
   - **Solution**: Mobile-first PWA that works on any device, anywhere

5. **Employee Management**:
   - **Problem**: All employees need access but with different permission levels
   - **Solution**: Role-based access control with owner/staff distinction

6. **Data Entry Speed**:
   - **Problem**: Repetitive data entry slows down operations
   - **Solution**: Smart autocomplete and barcode scanning for rapid data entry

---

## 🛠 Tech Stack

### Frontend
- **React 18+** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing

### Backend & Services
- **Firebase Authentication** - User authentication (Email/Password + Google)
- **Cloud Firestore** - NoSQL database for real-time data
- **Firebase Storage** - File storage for voice notes
- **Firebase Hosting** - Web hosting

### Mobile & PWA
- **Capacitor** - Native app wrapper
- **PWA** - Service worker for offline support
- **HTML5-QRCode** - Barcode scanning library

### Development Tools
- **ESLint** - Code linting
- **TypeScript** - Static type checking
- **Git** - Version control

---

## 📦 Installation

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** 9.0 or higher (comes with Node.js)
- **Git** (for cloning the repository)
- **Firebase account** (free tier works)

### Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/GameWala.git
cd GameWala
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including React, Firebase SDK, and other dependencies.

### Step 3: Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

> **Note**: Get these values from your Firebase Console → Project Settings → General → Your apps

### Step 4: Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

---

## ⚙️ Configuration

### Firebase Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Click "Add project"
   - Follow the setup wizard

2. **Enable Authentication**
   - Go to Authentication → Sign-in method
   - Enable **Email/Password** authentication
   - Enable **Google** authentication (optional)

3. **Create Firestore Database**
   - Go to Firestore Database
   - Click "Create database"
   - Start in **test mode** (for development)
   - Choose your preferred location

4. **Set Up Storage**
   - Go to Storage
   - Click "Get started"
   - Use default security rules (for development)

5. **Get Configuration Values**
   - Go to Project Settings → General
   - Scroll to "Your apps"
   - Click the web icon (`</>`) to add a web app
   - Copy the configuration values to your `.env` file

### Security Rules (Production)

Before deploying to production, update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Products collection
    match /products/{productId} {
      allow read, write: if request.auth != null;
    }
    
    // Repairs collection
    match /repairs/{repairId} {
      allow read, write: if request.auth != null;
    }
    
    // Sales collection
    match /sales/{saleId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 🚀 Usage

### First Time Setup

1. **Start the development server**: `npm run dev`
2. **Open the app** in your browser: `http://localhost:5173`
3. **Sign up** as the owner:
   - Click "Sign up"
   - Enter your name, email, and password
   - You'll be created with `pending` role
4. **Set yourself as owner**:
   - Go to Firebase Console → Firestore Database
   - Find your user document in the `users` collection
   - Change `role` field from `pending` to `owner`
5. **Refresh the app** - You now have owner access!

### Adding Products

1. Navigate to **Inventory** page
2. Click **"Add Product"**
3. Fill in product details:
   - Barcode (auto-generated or manual)
   - Brand, Type, Condition
   - Selling Price
   - Acquisition details
   - Customer phone (optional)
   - Notes (optional)
4. Click **"Add Product"**

### Scanning Products

1. Navigate to **Scan** page
2. Click **"Open Camera Scanner"**
3. Point camera at barcode
4. Product details appear automatically after scan

### Managing Repairs

1. From **Inventory** or **Scan** page, click **"Repair"** on a product
2. Fill in repair details:
   - Customer name and phone
   - Product condition
   - Delivery date
   - Fault description
   - Voice note (optional)
3. Click **"Create Repair"**
4. Track repair status in **Repairs** page using drag-and-drop

### Recording Sales

1. From **Inventory** or **Scan** page, click **"Sell"** on a product
2. Enter sale price and sold by information
3. Click **"Mark as Sold"**
4. View sales history in **Sales** page

---

## 📱 Mobile App & PWA

### Install as PWA

1. **On Desktop (Chrome/Edge)**:
   - Visit the app URL
   - Click the install icon in the address bar
   - Or go to Menu → Install App

2. **On Mobile (Android/iOS)**:
   - Visit the app URL in browser
   - Tap the menu (three dots)
   - Select "Add to Home Screen" or "Install App"

### Build Android APK

1. **Install Capacitor CLI**:
   ```bash
   npm install -g @capacitor/cli
   ```

2. **Sync Capacitor**:
   ```bash
   npm run build
   npx cap sync android
   ```

3. **Open in Android Studio**:
   ```bash
   npx cap open android
   ```

4. **Build APK**:
   - In Android Studio, go to Build → Build Bundle(s) / APK(s) → Build APK(s)
   - APK will be in `android/app/build/outputs/apk/`

### GitHub Actions Build

The repository includes a GitHub Actions workflow that automatically builds APK on push to the `main` branch. Check the **Actions** tab for build status and download links.

---

## 🔐 Authentication Setup

### Email/Password Authentication

1. Go to Firebase Console → Authentication → Sign-in method
2. Enable **Email/Password**
3. Users can now sign up and sign in with email/password

### Google Sign-In Setup

1. **Firebase Console**:
   - Go to Authentication → Sign-in method
   - Enable **Google** provider
   - Add authorized domains:
     - `localhost`
     - Your hosting domain (e.g., `your-app.web.app`)

2. **Google Cloud Console**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Select your Firebase project
   - Navigate to APIs & Services → Credentials
   - Find your OAuth 2.0 Client ID
   - Add authorized redirect URIs:
     - `https://your-project.firebaseapp.com/__/auth/handler`
     - `https://your-project.web.app/__/auth/handler`
     - `http://localhost:5173/__/auth/handler` (for development)

### User Roles

- **Owner**: Full access including Settings page and user management
- **Staff**: Access to all features except Settings
- **Pending**: New users awaiting owner approval

---

## 🏗 Project Structure

```
gamewala-app/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── TopNav.tsx      # Navigation bar
│   │   ├── UnifiedScanner.tsx  # Barcode scanner
│   │   ├── ScannerModal.tsx    # Scanner popup modal
│   │   └── AutocompleteInput.tsx # Smart input with suggestions
│   ├── pages/              # Page components
│   │   ├── dashboard.tsx   # Dashboard/home page
│   │   ├── inventory.tsx   # Inventory management
│   │   ├── scan.tsx        # Barcode scanning
│   │   ├── repairs.tsx     # Repair management
│   │   ├── sales.tsx       # Sales tracking
│   │   └── settings.tsx    # User management (owner only)
│   ├── services/           # API/service layer
│   │   ├── inventory.ts   # Product CRUD operations
│   │   ├── repairs.ts     # Repair operations
│   │   └── sales.ts        # Sales operations
│   ├── hooks/              # Custom React hooks
│   │   └── useAuth.tsx     # Authentication logic
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   │   ├── autocomplete.ts # Autocomplete suggestions
│   │   └── environment.ts  # Environment detection
│   ├── firebaseConfig.ts  # Firebase initialization
│   └── App.tsx            # Main app component
├── public/                 # Static assets
├── android/               # Android native project
├── package.json           # Dependencies
└── README.md             # This file
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use meaningful variable and function names
- Add comments for complex logic
- Ensure mobile responsiveness
- Test on multiple devices/browsers

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/)
- Powered by [Firebase](https://firebase.google.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Barcode scanning by [html5-qrcode](https://github.com/mebjas/html5-qrcode)

---

<div align="center">

**Made with ❤️ for gaming console shops**

[Report Bug](https://github.com/YOUR_USERNAME/GameWala/issues) • [Request Feature](https://github.com/YOUR_USERNAME/GameWala/issues)

</div>
