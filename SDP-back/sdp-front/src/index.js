// frontend/src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import './index.css';
import { BrowserRouter } from 'react-router-dom'; // ⭐⭐⭐ BrowserRouter 다시 임포트 ⭐⭐⭐

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        {/*  */}
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>,
);