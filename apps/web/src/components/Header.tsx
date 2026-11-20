import React from 'react';
import { Lock, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useClub } from '../context/ClubContext';

interface HeaderProps {
  onOpenDrawer: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenDrawer }) => {
  const { openPasswordModal, logout, user } = useAuth();
  const { club } = useClub();

  const handleLogout = async () => {
    if (window.confirm('¿Seguro que querés cerrar sesión?')) {
      await logout();
    }
  };

  const escudoSrc = club?.escudo_url || '/LogoFN.jpg';
  const nombreClub = club?.nombre || 'Faro Norte';

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Izquierda: Hamburguesa + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenDrawer}
            className="p-2 -ml-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors focus:outline-none"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <img
              src={escudoSrc}
              alt={`Escudo ${nombreClub}`}
              className="w-8 h-8 object-cover rounded-lg border border-gray-200 shadow-sm"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/LogoFN.jpg';
              }}
            />
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-sm text-gray-900 uppercase tracking-wide">
                {nombreClub}
              </span>
              <span className="text-[10px] text-blue-500 font-medium tracking-wider uppercase">
                Gestión del Club
              </span>
            </div>
          </div>
        </div>

        {/* Derecha: acciones */}
        {user && (
          <div className="flex items-center gap-1">
            <button
              onClick={openPasswordModal}
              className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-colors"
              title="Cambiar contraseña"
            >
              <Lock className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
