import React, { createContext, useContext, useEffect, useState } from 'react';
import { UsuarioSesion } from '@faronorte/shared';
import {
  cambiarClaveApi,
  getMeApi,
  loginApi,
  logoutApi,
} from '../services/auth';

interface AuthContextType {
  user: UsuarioSesion | null;
  loading: boolean;
  debeCambiarClave: boolean;
  isPasswordModalOpen: boolean;
  openPasswordModal: () => void;
  closePasswordModal: () => void;
  login: (email: string, contrasena: string) => Promise<void>;
  logout: () => Promise<void>;
  cambiarClave: (
    actual: string | undefined,
    nueva: string,
    confirmar: string,
  ) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UsuarioSesion | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const checkAuth = async () => {
    try {
      const res = await getMeApi();
      setUser(res.usuario);
      if (res.usuario.debe_cambiar_clave) {
        setIsPasswordModalOpen(true);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, contrasena: string) => {
    const res = await loginApi(email, contrasena);
    setUser(res.usuario);
    if (res.usuario.debe_cambiar_clave) {
      setIsPasswordModalOpen(true);
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } finally {
      setUser(null);
      setIsPasswordModalOpen(false);
    }
  };

  const cambiarClave = async (
    actual: string | undefined,
    nueva: string,
    confirmar: string,
  ) => {
    await cambiarClaveApi(actual, nueva, confirmar);
    if (user) {
      setUser({ ...user, debe_cambiar_clave: false });
    }
    setIsPasswordModalOpen(false);
  };

  const openPasswordModal = () => setIsPasswordModalOpen(true);
  const closePasswordModal = () => {
    // Si debe cambiar clave forzosamente, no puede cerrar el modal sin cambiarla
    if (!user?.debe_cambiar_clave) {
      setIsPasswordModalOpen(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        debeCambiarClave: !!user?.debe_cambiar_clave,
        isPasswordModalOpen,
        openPasswordModal,
        closePasswordModal,
        login,
        logout,
        cambiarClave,
        refreshUser: checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
