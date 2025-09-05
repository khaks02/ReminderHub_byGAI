# myreminder - Personal AI Assistant

myreminder is a modern, responsive web application that acts as a personal AI assistant. It leverages the power of Google's Gemini API to help users manage reminders, discover recipes, and get service recommendations through a natural language interface. The app is built with React, TypeScript, and Supabase for backend services, using a Vite build process.

To enhance reliability, the app features an automatic fallback to OpenAI's GPT model if the Gemini API is unavailable.

By default, this app can run in a **Demo Mode** with mock data, allowing you to explore all features immediately without any backend setup.

## ✨ Features

- **AI-Powered Reminders**: Create reminders by typing naturally (e.g., "Pay electricity bill next Tuesday at 8 PM").
- **Reliable AI with Fallback**: Automatically switches from Gemini to OpenAI if the primary service is down, ensuring high availability.
- **Intelligent Actions**: Each reminder comes with AI-suggested actions, like finding gift vendors for a birthday or booking services for an appointment.
- **Recipe Discovery**: Get daily, AI-curated meal plans, search for recipes by name, or find recipes based on ingredients.
- **Service Integration**: For any recipe, get AI suggestions for vendors to buy ingredients, order the prepared dish, or hire a professional chef.
- **Calendar View**: A full-featured calendar to visualize all your reminders.
- **Secure API Calls**: All communication with the AI is proxied through a secure Supabase Edge Function, ensuring API keys are never exposed on the client.
- **User Authentication**: Secure user login and profile management powered by Supabase Auth.
- **Light & Dark Mode**: Themed for your viewing preference.
- **Credential-Free Demo Mode**: Can be run with sample data, no setup required.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **AI**: Google Gemini API & OpenAI GPT (via Supabase Edge Functions)
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
- [OpenAI](https://platform.openai.com/signup) (to get an API Key for fallback)
- [Firebase](https://firebase.google.com/) (for hosting)
- [Node.js](https://nodejs.org/) and [Supabase CLI](https://supabase.com/docs/guides/cli) installed on your machine.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/myreminder.git
    cd myreminder
    ```
    
2. **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Supabase Backend:**
    - Link your local repository to your Supabase project:
      ```bash
      supabase login
      supabase link --project-ref YOUR_PROJECT_REF
      ```
    - **Crucially, set your AI API keys as secrets** in your Supabase project. This keeps them secure.
      ```bash
      supabase secrets set GEMINI_API_KEY=YOUR_GEMINI_API_KEY
      supabase secrets set OPENAI_API_KEY=YOUR_OPENAI_API_KEY
      ```
    - Deploy the Edge Functions. These functions handle all communication with the AI securely.
      ```bash
      supabase functions deploy gemini-proxy
      supabase functions deploy openai-proxy
      ```

4.  **Set up the Database Schema:**
    - A schema file is provided in `supabase/migrations`. Push this to your Supabase project to create all the necessary tables and policies.
      ```bash
      supabase db push
      ```

5.  **Configure Frontend Credentials:**
    - Create a `.env.local` file in the project root.
    - Add your Supabase credentials to this file. Vite will automatically load these variables for local development.
    ```
    # in .env.local
    VITE_SUPABASE_URL=https://your-project-ref.supabase.co
    VITE_SUPABASE_ANON_KEY=your-public-anon-key
    ```
    - Open the `src/config.ts` file and set `USE_MOCK_DATA` to `false`. The app is now configured to read your credentials from the environment variables.

6.  **Run the application locally:**
    ```bash
    npm run dev
    ```
    - Open your browser to the local address provided (usually `http://localhost:5173`).

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
    - For your public directory, enter `dist`. This is Vite's build output directory.
    - Configure as a single-page app: `Yes`. The `firebase.json` file handles this for you.

3. **Build the application:**
    ```bash
    npm run build
    ```

4.  **Deploy the application:**
    ```bash
    firebase deploy --only hosting
    ```
    Firebase will provide the URL for your live application.
