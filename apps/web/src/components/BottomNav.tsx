import React from 'react';
import { NavLink } from 'react-router-dom';
import { CalendarCheck, CreditCard, Home, MoreHorizontal, Users } from 'lucide-react';

interface BottomNavProps {
  onOpenMore: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenMore }) => {
  const navItems = [
    { to: '/', label: 'Inicio', icon: Home },
    { to: '/socios', label: 'Socios', icon: Users },
    { to: '/cuotas', label: 'Cuotas', icon: CalendarCheck },
    { to: '/cobros', label: 'Cobros', icon: CreditCard },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-200/80 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="max-w-md mx-auto grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 transition-all duration-200 select-none relative tab-bounce
                ${isActive ? 'text-orange-500 font-semibold' : 'text-gray-400 hover:text-gray-600'}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute top-0 inset-x-4 h-1 bg-gradient-to-r from-orange-400 to-orange-500 rounded-b-full shadow-sm shadow-orange-500/30 animate-fade-in" />
                  )}
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-115 text-orange-500' : 'group-hover:scale-105'}`} />
                  <span className={`text-[11px] tracking-tight transition-all duration-150 ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}

        {/* Botón Más */}
        <button
          type="button"
          onClick={onOpenMore}
          className="flex flex-col items-center justify-center gap-0.5 text-gray-400 hover:text-orange-500 active:text-orange-600 transition-colors select-none tab-bounce"
          aria-label="Más opciones"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[11px] tracking-tight">Más</span>
        </button>
      </div>
    </nav>
  );
};
