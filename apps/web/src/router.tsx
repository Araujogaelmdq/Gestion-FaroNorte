import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Cobros } from './pages/Cobros';
import { Configuracion } from './pages/Configuracion';
import { Cuotas } from './pages/Cuotas';
import { Inicio } from './pages/Inicio';
import { Login } from './pages/Login';
import { Reportes } from './pages/Reportes';
import { Socios } from './pages/Socios';
import { Tesoreria } from './pages/Tesoreria';
import { Transparencia } from './pages/Transparencia';
import { TransparenciaPublica } from './pages/TransparenciaPublica';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/transparencia',
    element: <TransparenciaPublica />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: '/', element: <Inicio /> },
          { path: '/socios', element: <Socios /> },
          { path: '/cuotas', element: <Cuotas /> },
          { path: '/cobros', element: <Cobros /> },
          { path: '/tesoreria', element: <Tesoreria /> },
          { path: '/reportes', element: <Reportes /> },
          { path: '/transparencia-admin', element: <Transparencia /> },
          { path: '/configuracion', element: <Configuracion /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
