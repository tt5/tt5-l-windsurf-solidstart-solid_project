import "./app.css";
import { Suspense, onMount } from "solid-js";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { MetaProvider, Title } from "@solidjs/meta";

import Navbar from "./components/Navbar";
import { AuthProvider } from "./contexts/auth";

// Initialize the database when the app starts
async function initializeDatabase() {
  try {
    const response = await fetch('/api/init-db');
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to initialize database');
    }
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

export default function App() {
  onMount(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      initializeDatabase();
    }
  });
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <AuthProvider>
            <Title>tt5</Title>
            <Navbar />
            <Suspense>{props.children}</Suspense>
          </AuthProvider>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
