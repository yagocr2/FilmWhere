// main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import React from 'react';
import './Index.css';
import App from './App';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>
);