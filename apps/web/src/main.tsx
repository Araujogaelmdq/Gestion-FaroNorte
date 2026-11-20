import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ClubProvider } from './context/ClubContext';
import { router } from './router';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClubProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ClubProvider>
  </React.StrictMode>,
);
