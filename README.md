# myreminder - Personal AI Assistant

myreminder is a modern, responsive web application that acts as a personal AI assistant. It leverages the power of Google's Gemini API to help users manage reminders, discover recipes, and get service recommendations through a natural language interface. The app is built as a static Single-Page Application (SPA) using React, TypeScript, and Supabase for backend services.

## ✨ Features

- **AI-Powered Reminders**: Create reminders by typing naturally (e.g., "Pay electricity bill next Tuesday at 8 PM").
- **Intelligent Actions**: Each reminder comes with AI-suggested actions, like finding gift vendors for a birthday or booking services for an appointment.
- **Recipe Discovery**: Get daily, AI-curated meal plans (breakfast, lunch, dinner, etc.), search for recipes by name, or even find recipes based on the ingredients you have.
- **Service Integration**: For any recipe, get AI suggestions for vendors to buy ingredients, order the prepared dish, or even hire a professional chef.
- **Calendar View**: A full-featured calendar to visualize all your reminders.
- **Dynamic Cart & Orders**: Add services and products to a cart and simulate a checkout process.
- **User Authentication**: Secure user login and profile management powered by Supabase Auth.
- **Light & Dark Mode**: Themed for your viewing preference.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **AI**: Google Gemini API (`@google/genai`)
- **Backend-as-a-Service**: Supabase (Authentication, PostgreSQL Database, Storage)
- **Routing**: React Router
- **Icons**: Lucide React
- **Deployment**: Firebase Hosting

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You need to have an account with Supabase and Google AI Studio to get the required API keys.

- [Supabase](https://supabase.com/)
- [Google AI Studio (for Gemini API Key)](https://aistudio.google.com/)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/myreminder.git
   cd myreminder
   ```

2. **Create the environment file:**
   - Rename the `.env.example` file to `.env`.
   - Open the new `.env` file and add your credentials from Supabase and Google AI Studio.

   ```env
   # .env
   SUPABASE_URL=YOUR_SUPABASE_URL
   SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   API_KEY=YOUR_GEMINI_API_KEY
   ```

3. **Run the application:**
   - This project is set up as a static site and can be served with any simple HTTP server. A common choice is `serve`.
   - If you don't have `serve`, install it globally:
     ```bash
     npm install -g serve
     ```
   - Run the server from the project's root directory:
     ```bash
     serve -s .
     ```
   - Open your browser and navigate to the local address provided by the server (usually `http://localhost:3000`).

## ☁️ Deployment

This application is configured for easy deployment to **Firebase Hosting**.

1. **Install Firebase CLI:**
   If you don't have it, install it globally:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase:**
   ```bash
   firebase login
   ```

3. **Initialize Firebase (if not already done):**
   In your project root, run:
   ```bash
   firebase init hosting
   ```
   - Select an existing Firebase project or create a new one.
   - When asked for your public directory, enter `.` (a single dot for the root directory).
   - Configure as a single-page app by answering `Yes` to rewrite all URLs to `/index.html`. This is already configured in the provided `firebase.json`, so you can confirm the settings.

4. **Deploy the application:**
   ```bash
   firebase deploy --only hosting
   ```
   Firebase will provide you with a URL where your live application is hosted.
