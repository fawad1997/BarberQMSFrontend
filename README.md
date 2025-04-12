# WalkInOnline - Barbershop Queue Management System

WalkInOnline is a streamlined, AI-powered queue and appointment management platform for barbershops, enabling real-time wait time estimates, service selection, and appointment booking.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Installation](#installation)
  - [Method 1: Local Development](#method-1-local-development)
  - [Method 2: Using Docker](#method-2-using-docker)
- [Project Structure](#project-structure)
- [Features](#features)
- [Available Scripts](#available-scripts)
- [Authentication](#authentication)
- [Configuration](#configuration)
- [Real-Time Updates](#real-time-updates)
- [Contributing](#contributing)
- [License](#license)
- [Website Configuration](#configure-the-website)

## Prerequisites

Before you begin, ensure you have installed:
- **Node.js** (v18 or later)
- **npm** (comes with Node.js)
- **Docker** (optional, for containerization)

## Environment Setup

1. Clone the repository:

```bash
git clone https://github.com/fawad1997/BarberQMSFrontend.git
cd BarberQMSFrontend
```

2. Create a `.env` file in the root directory with the following content:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXTAUTH_URL=http://localhost:8000
NEXTAUTH_SECRET=your-secret-key-here
```

## Installation

### Method 1: Local Development

1. Install dependencies:

    ```bash
    npm install
    ```

2. Start the development server:

    ```bash
    npm run dev
    ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Method 2: Using Docker

1. Build the Docker image:

    ```bash
    docker build -t walkinonline .
    ```

2. Run the Docker container:

    ```bash
    docker run -p 3000:3000 walkinonline
    ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.


## Project Structure

walkinonline/
├── app/ # Next.js 13 app directory
├── components/ # Reusable React components
├── config/ # Configuration files
│ ├── contents.ts # Website content
│ ├── settings.ts # Site settings
│ └── site.ts # Site-wide information
├── public/ # Static assets
└── types/ # TypeScript type definitions


## Features

- AI-powered queue estimation
- Real-time queue updates with WebSockets
- Dynamic position updates during queue reordering
- Live notifications for new customers and appointments
- User feedback system
- Appointment scheduling
- Shop owner dashboard
- Barber management
- Service management
- Dark/Light theme support

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production application
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Authentication

The application uses **NextAuth.js** for authentication. Available roles:
- **Shop Owner**
- **Customer**
- **Barber**

### Single Sign-On (SSO)

The application supports multiple SSO providers for authentication:

#### Google SSO
1. Obtain Google OAuth credentials from the [Google Cloud Console](https://console.cloud.google.com/):
   - Create a new project
   - Set up OAuth consent screen
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs: `http://localhost:8000/sso/google/callback`
2. Update your `.env.local` with the Google Client ID and Secret

#### Facebook SSO
1. Obtain Facebook OAuth credentials from the [Facebook Developer Portal](https://developers.facebook.com/):
   - Create a new app
   - Set up the Facebook Login product
   - Configure OAuth settings
   - Add authorized redirect URIs: `http://localhost:8000/sso/facebook/callback`
2. Update your `.env.local` with the Facebook Client ID and Secret

#### Microsoft SSO
1. Obtain Microsoft OAuth credentials from the [Microsoft Azure Portal](https://portal.azure.com/):
   - Register a new application in Azure Active Directory
   - Configure platform settings for web
   - Add redirect URIs: `http://localhost:8000/sso/microsoft/callback`
2. Update your `.env.local` with the Microsoft Client ID and Secret

#### Environment Setup
Update your `.env.local` with all provider credentials using the provided template:
```
# SSO Provider Credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
```

Users can now log in through any of the supported SSO providers using the corresponding buttons on the login page.

## Configuration

You can customize the website by modifying the following files:
- `config/contents.ts` - Manage website content
- `config/settings.ts` - Modify site settings
- `config/site.ts` - Update site-wide information

## Real-Time Updates

The application now supports real-time updates using WebSockets for queue management:

- **Queue Position Updates**: Position numbers update in real-time during drag and drop operations
- **Live Queue Additions**: New customers appear in the queue instantly
- **WebSocket Fallback**: Falls back to polling if WebSockets are unavailable
- **Appointment Status Updates**: Receive instant updates when appointment statuses change

For detailed WebSocket implementation information, see [WebSocket Setup Documentation](./docs/websocket-setup.md).

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


# Configure the website

This folder contains essential configuration files used to modify the contents and settings of the website.

- contents.ts: Manage the content displayed on the website.
- settings.ts: Customize various settings, such as disabling theme toggle.
- site.ts: Contains general site-wide information.

```ts
export const siteConfig: SiteConfig = {
  name: "WalkInOnline",
  author: "Fawad",
  description:
    "WalkInOnline: A streamlined, AI-powered queue and appointment management platform for barbershops, enabling real-time wait time estimates, service selection, and appointment booking, built with Next.js and shadcn/ui.",
keywords: [
    "Barbershop Queue Management",
    "Appointment Scheduling",
    "Real-Time Wait Times",
    "Service Selection",
    "Customer Check-In",
    "Feedback and Ratings",
    "Barber Performance Tracking",
    "Shop Owner Dashboard",
    "Barber Scheduling",
    "Queue Position Tracking",
    "Appointment Reminders",
    "Customer Engagement",
    "AI Wait Time Prediction",
    "Shop Analytics",
    "User-Friendly Experience",
    "Real-Time Notifications",
    "Appointment Rescheduling",
    "Customer Service Feedback",
    "Performance Reports"
  ],
  url: {
    base: baseUrl,
    author: "https://walkinonline.com",
  },
  ogImage: `${baseUrl}/og.jpg`,
}
```


## Project Collaboration Guidelines
This section outlines the steps for working on the project. Follow these steps to ensure a smooth workflow and to prevent any conflicts with the production code.

## 1. Clone the Repository

Clone the repository to your local machine:
```bash
git clone https://github.com/fawad1997/BarberQMSFrontend
```

## 2. Create the Develop Branch (Only Fawad)
For the first time if we dont have a `develop` branch yet, create it from the main branch:

```bash
git checkout -b develop
git push -u origin develop
```
The `develop` branch is where all new changes are made and tested before merging into production.

## 2. Switch to the Develop Branch

As a junior developer, you will only work on `develop` branch.
```bash
git checkout develop
git pull origin develop
```

## 3. Develop Your Feature/Work
Make the necessary changes in your local working environment. Once you have made changes:
1. Stage your changes:
```bash
git add .
```
2. Commit your changes:
```bash
git commit -m "Describe your changes or feature"
```
3. Pull if there are any changes on Develop baranch
```bash
git pull origin develop
```
4. Push Your work to GitHub
```bash
git push -u origin develop
```
