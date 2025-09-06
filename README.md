# myreminder - Personal AI Assistant

myreminder is a modern, responsive web application that acts as a personal AI assistant. It leverages the power of Google's Gemini API to help users manage reminders, discover recipes, and get service recommendations through a natural language interface. The app is built with React, TypeScript, and Supabase for backend services, using a Vite build process.

By default, this app can run in a **Demo Mode** with mock data, allowing you to explore all features immediately without any backend setup.

## ✨ Features

- **AI-Powered Reminders**: Create reminders by typing naturally (e.g., "Pay electricity bill next Tuesday at 8 PM").
- **Intelligent Actions**: Each reminder comes with AI-suggested actions, like finding gift vendors for a birthday or booking services for an appointment.
- **Recipe Discovery**: Get daily, AI-curated meal plans, search for recipes by name, or find recipes based on ingredients.
- **Service Integration**: For any recipe, get AI suggestions for vendors to buy ingredients, order the prepared dish, or hire a professional chef.
- **Calendar View**: A full-featured calendar to visualize all your reminders.
- **User Authentication**: Secure user login and profile management powered by Supabase Auth.
- **Light & Dark Mode**: Themed for your viewing preference.
- **Credential-Free Demo Mode**: Can be run with sample data, no setup required.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **AI**: Google Gemini API
- **Backend-as-a-Service**: Supabase (Authentication, PostgreSQL Database, Storage)
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
    - Push the database schema to your project.
      ```bash
      supabase db push
      ```

4.  **Configure Frontend Credentials:**
    - **Supabase Credentials**: Open the `src/config.ts` file and replace the placeholder `SUPABASE_URL` and `SUPABASE_ANON_KEY` with your project's credentials.
    - **Gemini API Key**: The application expects the Gemini API key to be available in the execution environment as `process.env.API_KEY`. You must configure your deployment environment to provide this variable.
    - In `src/config.ts`, ensure `USE_MOCK_DATA` is set to `false`.

5.  **Run the application locally:**
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