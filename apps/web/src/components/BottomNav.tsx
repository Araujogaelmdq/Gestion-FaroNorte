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
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 pb-safe shadow-[0_-2px_8px_rgba(0,0,0,0.08)]">
      <div className="max-w-md mx-auto grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 transition-colors select-none relative
                ${isActive ? 'text-orange-500 font-semibold' : 'text-gray-400 hover:text-gray-700'}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute top-0 inset-x-3 h-0.5 bg-orange-500 rounded-b-full" />
                  )}
                  <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                  <span className="text-[11px] tracking-tight">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}

        {/* Botón Más */}
        <button
          type="button"
          onClick={onOpenMore}
          className="flex flex-col items-center justify-center gap-0.5 text-gray-400 hover:text-blue-500 transition-colors select-none"
          aria-label="Más opciones"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[11px] tracking-tight">Más</span>
        </button>
      </div>
    </nav>
  );
};
