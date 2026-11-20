import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { useClub } from '../context/ClubContext';

export const Login: React.FC = () => {
  const { user, login } = useAuth();
  const { club } = useClub();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const escudoSrc = club?.escudo_url || '/LogoFN.jpg';
  const nombreClub = club?.nombre || 'Faro Norte';

  // Si ya tiene sesión activa, redirigir a inicio
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !contrasena) {
      setError('Por favor completá todos los campos.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, contrasena);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Credenciales incorrectas');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex flex-col justify-center items-center px-4 py-8">
      {/* Tarjeta de Login */}
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-block relative mb-3">
            <img
              src={escudoSrc}
              alt={`Club ${nombreClub}`}
              className="w-24 h-24 mx-auto rounded-2xl shadow-lg border-2 border-orange-200 object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/LogoFN.jpg';
              }}
            />
            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-500 rounded-full border-2 border-white" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-gray-900">
            {nombreClub}
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Ingreso de la comisión y el personal
          </p>
        </div>

        <Card padding="lg" className="shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@faronorte.club"
              required
              autoComplete="email"
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="Tu contraseña"
              required
              autoComplete="current-password"
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="hover:text-gray-700 transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              isLoading={isLoading}
              className="font-bold tracking-wide shadow-md"
            >
              Entrar
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500 leading-relaxed">
              ¿Olvidaste la contraseña? Pedile al administrador del club que te genere una nueva.
            </p>
          </div>
        </Card>

        {/* Pie informativo */}
        <p className="text-center text-[11px] text-gray-400 mt-6 tracking-wide">
          Club Social y Deportivo Faro Norte · Mar del Plata
        </p>
      </div>
    </div>
  );
};
