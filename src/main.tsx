import React from 'react';
import ReactDOM from 'react-dom/client';
import { setupIonicReact } from '@ionic/react';
import '@ionic/core/css/core.css';
import App from './App';

setupIonicReact();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
