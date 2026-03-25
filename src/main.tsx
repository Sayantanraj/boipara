import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

// Preload critical resources
const preloadCriticalResources = () => {
  // Preload fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'preload';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap';
  fontLink.as = 'style';
  document.head.appendChild(fontLink);
  
  // Preload API endpoint
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  fetch(`${apiUrl}/health`).catch(() => {});
};

// Start preloading immediately
preloadCriticalResources();

// Ultra-fast render
const root = createRoot(document.getElementById("root")!);
root.render(<App />);