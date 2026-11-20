import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center p-4">
        <img
          src="/LogoFN.jpg"
          alt="Faro Norte"
          className="w-16 h-16 rounded-2xl shadow-xl border border-neutral-700 animate-pulse mb-4"
        />
        <div className="flex items-center gap-2 text-neutral-400 text-sm">
          <div className="w-2 h-2 rounded-full bg-[#E8863A] animate-ping" />
          <span>Cargando Faro Norte...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
