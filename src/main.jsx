import React from 'react';
import { createRoot } from 'react-dom/client';
import { applyDocumentLanguage } from './i18n/translate.js';
import App from './components/App.jsx';
import './styles/index.css';
import './styles/exploration.css';
import './styles/menu.css';
import './styles/campaign.css';

applyDocumentLanguage();
createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
