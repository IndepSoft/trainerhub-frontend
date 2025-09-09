import React from 'react';
import ReactDOM from 'react-dom/client';
import { useAuthStore } from './app/stores/authStore';
import App from './App';
import './index.css'


const authToken = localStorage.getItem('authToken');
if (authToken) {
  useAuthStore.getState().login(authToken); 
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App/>
  </React.StrictMode>
);