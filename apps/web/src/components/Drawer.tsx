import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  CalendarCheck,
  CreditCard,
  Eye,
  FileText,
  Home,
  KeyRound,
  Landmark,
  LogOut,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLES_LABEL: Record<string, string> = {
  administrador: 'Administrador',
  tesorero: 'Tesorero',
  secretario: 'Secretario',
  profe: 'Profe',
};

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose }) => {
  const { user, logout, openPasswordModal } = useAuth();

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const rol = user?.rol || '';

  const links = [
    { to: '/', label: 'Inicio', icon: Home, end: true, roles: ['administrador', 'tesorero', 'secretario', 'profe'] },
    { to: '/socios', label: 'Socios', icon: Users, roles: ['administrador', 'tesorero', 'secretario', 'profe'] },
    { to: '/cuotas', label: 'Cuotas', icon: CalendarCheck, roles: ['administrador', 'tesorero'] },
    { to: '/cobros', label: 'Cobros', icon: CreditCard, roles: ['administrador', 'tesorero'] },
    { to: '/tesoreria', label: 'Tesorería', icon: Landmark, roles: ['administrador', 'tesorero'] },
    { to: '/reportes', label: 'Reportes', icon: FileText, roles: ['administrador', 'tesorero'] },
    { to: '/transparencia-admin', label: 'Transparencia', icon: Eye, roles: ['administrador'] },
    { to: '/configuracion', label: 'Configuración', icon: Settings, roles: ['administrador'] },
  ].filter((l) => l.roles.includes(rol));

  const handleLogout = async () => {
    if (window.confirm('¿Seguro que querés cerrar sesión?')) {
      onClose();
      await logout();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-72 max-w-[82vw] bg-white border-r border-gray-200 flex flex-col h-full z-10 shadow-2xl animate-slide-in-left">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-orange-50">
          <div className="flex items-center gap-2.5">
            <img
              src="/LogoFN.jpg"
              alt="Faro Norte"
              className="w-8 h-8 rounded-lg object-cover border border-orange-200 shadow-sm"
            />
            <div>
              <h2 className="text-sm font-extrabold uppercase text-gray-900 tracking-wide">Faro Norte</h2>
              <p className="text-[10px] text-orange-500 font-semibold tracking-wider uppercase">Gestión del Club</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Perfil */}
        {user && (
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-bold text-gray-900 truncate">{user.nombre}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
            <span className="inline-block mt-1.5 text-xs font-semibold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
              {ROLES_LABEL[user.rol] || user.rol}
            </span>
          </div>
        )}

        {/* Links */}
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-orange-50 text-orange-600 font-semibold border border-orange-100'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          <button
            onClick={() => { onClose(); openPasswordModal(); }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors font-medium"
          >
            <KeyRound className="w-4 h-4 text-gray-400" />
            <span>Cambiar contraseña</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
};
