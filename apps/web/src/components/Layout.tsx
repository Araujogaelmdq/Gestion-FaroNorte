import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { CambiarClaveModal } from './CambiarClaveModal';
import { Drawer } from './Drawer';
import { Header } from './Header';
import { OfflineBanner } from './OfflineBanner';

export const Layout: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <OfflineBanner />
      <Header onOpenDrawer={() => setIsDrawerOpen(true)} />

      {/* Contenido principal */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-4 sm:py-6 pb-24">
        <Outlet />
      </main>

      {/* Navegación móvil inferior fija */}
      <BottomNav onOpenMore={() => setIsDrawerOpen(true)} />

      {/* Drawer lateral */}
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Modal cambiar clave */}
      <CambiarClaveModal />
    </div>
  );
};
