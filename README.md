# myreminder - Personal AI Assistant

myreminder is a modern, responsive web application that acts as a personal AI assistant. It leverages the power of Google's Gemini API to help users manage reminders, discover recipes, and get service recommendations through a natural language interface. The app is built as a static Single-Page Application (SPA) using React, TypeScript, and Supabase for backend services.

By default, this app runs in a **Demo Mode** with mock data, so you can explore all features immediately without any setup.

## ✨ Features

- **AI-Powered Reminders**: Create reminders by typing naturally (e.g., "Pay electricity bill next Tuesday at 8 PM").
- **Intelligent Actions**: Each reminder comes with AI-suggested actions, like finding gift vendors for a birthday or booking services for an appointment.
- **Recipe Discovery**: Get daily, AI-curated meal plans, search for recipes by name, or find recipes based on ingredients.
- **Service Integration**: For any recipe, get AI suggestions for vendors to buy ingredients, order the prepared dish, or hire a professional chef.
- **Calendar View**: A full-featured calendar to visualize all your reminders.
- **Secure API Calls**: All communication with the AI is proxied through a secure Supabase Edge Function, ensuring API keys are never exposed.
- **User Authentication**: Secure user login and profile management powered by Supabase Auth.
- **Light & Dark Mode**: Themed for your viewing preference.
- **Credential-Free Demo Mode**: Runs out-of-the-box with sample data, no setup required.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **AI**: Google Gemini API (via Supabase Edge Function)
- **Backend-as-a-Service**: Supabase (Authentication, PostgreSQL Database, Storage, Edge Functions)
- **Routing**: React Router
- **Icons**: Lucide React
- **Deployment**: Firebase Hosting

## 🚀 Getting Started (Live Mode)

To connect the application to your own live backend, follow these instructions.

### Prerequisites

You will need accounts with the following services:
- [Supabase](https://supabase.com/) (for backend and database)
- [Google AI Studio](https://aistudio.google.com/) (to get a Gemini API Key)
- [Firebase](https://firebase.google.com/) (for hosting)
- [Node.js](https://nodejs.org/) and [Supabase CLI](https://supabase.com/docs/guides/cli) installed on your machine.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/myreminder.git
    cd myreminder
    ```

2.  **Set up Supabase Backend:**
    - Link your local repository to your Supabase project:
      ```bash
      supabase login
      supabase link --project-ref YOUR_PROJECT_REF
      ```
    - **Crucially, set your Gemini API key as a secret** in your Supabase project. This keeps it secure.
      ```bash
      supabase secrets set GEMINI_API_KEY=YOUR_GEMINI_API_KEY
      ```
    - Deploy the Gemini proxy Edge Function. This function handles all communication with the AI securely.
      ```bash
      supabase functions deploy gemini-proxy
      ```

3.  **Set up the Database Schema:**
    - The application requires a specific database structure. A schema file is provided in `supabase/migrations`. Push this to your Supabase project to create all the necessary tables and policies.
      ```bash
      supabase db push
      ```

4.  **Configure Frontend Credentials:**
    - Open the `config.ts` file.
    - Set `USE_MOCK_DATA` to `false`.
    - Replace the placeholder strings for `SUPABASE_URL` and `SUPABASE_ANON_KEY` with your actual credentials from your Supabase project's API settings.
    
    ```typescript
    // in config.ts
    export const USE_MOCK_DATA = false; // Switch to live mode
    export const SUPABASE_URL = 'https://your-project-ref.supabase.co';
    export const SUPABASE_ANON_KEY = 'your-public-anon-key';
    ```

5.  **Run the application locally:**
    - This project is a static site. The easiest way to serve it is with the `serve` package.
    - If you don't have `serve`, install it globally: `npm install -g serve`
    - Run the server from the project's root directory:
      ```bash
      serve -s .
      ```
    - Open your browser to the local address provided (usually `http://localhost:3000`).

## ☁️ Deployment to Firebase

This application is configured for easy deployment to **Firebase Hosting**.

1.  **Install Firebase CLI:**
    If you haven't already, install it globally:
    ```bash
    npm install -g firebase-tools
    ```

2.  **Login and Initialize Firebase:**
    ```bash
    firebase login
    firebase init hosting
    ```
    - Select your Firebase project.
    - For your public directory, enter `.` (a single dot).
    - Configure as a single-page app: `Yes`. The `firebase.json` file handles this for you.

3.  **Deploy the application:**
    ```bash
    firebase deploy --only hosting
    ```
    Firebase will provide the URL for your live application.
