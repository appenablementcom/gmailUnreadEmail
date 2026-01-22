'use client';

import { useEffect, useState } from 'react';
import Login from '../components/Login';
import Dashboard from '../components/Dashboard';
import { checkAuth } from '../lib/api';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check for token in URL (from OAuth callback)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');

      if (urlToken) {
        setToken(urlToken);
        localStorage.setItem('auth_token', urlToken);
        setIsAuthenticated(true);
        setChecking(false);
        // Clean URL
        window.history.replaceState({}, '', '/');
        return;
      }

      // Check localStorage
      const localToken = localStorage.getItem('auth_token');
      if (localToken) {
        // Verify it works? Or just trust it for now to be fast.
        // Optional: Verify with verify() call but for now assume valid to avoid flicker
        setToken(localToken);
        setIsAuthenticated(true);
        setChecking(false);
        return;
      }
    }

    setChecking(false);
  }, []);

  const handleLogin = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('auth_token', newToken);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    window.location.reload();
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              DT
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">DT Inbox Cleaner</h1>
          </div>
        </header>

        {isAuthenticated ? (
          <Dashboard token={token || ''} onLogout={handleLogout} />
        ) : (
          <Login onLogin={handleLogin} />
        )}
      </div>
    </main>
  );
}
