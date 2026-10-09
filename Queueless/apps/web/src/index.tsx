import React from 'react';
import ReactDOM from 'react-dom/client';
// @ts-ignore TS2882: side-effect CSS import is resolved by the bundler
import './index.css'; // Global styles including Tailwind
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
