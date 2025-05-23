import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';  // <-- Import BrowserRouter
import { SupabaseProvider } from './context/SupabaseContext';
import App from './App.tsx';
import './index.css';
import 'react-calendar/dist/Calendar.css'; // Import react-calendar CSS

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SupabaseProvider>
      <BrowserRouter>  {/* Wrap App with BrowserRouter */}
        <App />
      </BrowserRouter>
    </SupabaseProvider>
  </StrictMode>
);
