import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';
import { Input } from './Input';
import { Modal } from './Modal';

export const CambiarClaveModal: React.FC = () => {
  const { isPasswordModalOpen, closePasswordModal, debeCambiarClave, cambiarClave } = useAuth();

  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!debeCambiarClave && !actual) {
      setError('Ingresá tu contraseña actual');
      return;
    }

    if (nueva.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (nueva !== confirmar) {
      setError('Las nuevas contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    try {
      await cambiarClave(debeCambiarClave ? undefined : actual, nueva, confirmar);
      setSuccess('¡Contraseña modificada con éxito!');
      setActual('');
      setNueva('');
      setConfirmar('');
      setTimeout(() => {
        closePasswordModal();
        setSuccess(null);
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  const title = debeCambiarClave ? 'Cambio de clave obligatorio' : 'Cambiar mi contraseña';

  return (
    <Modal
      isOpen={isPasswordModalOpen}
      onClose={closePasswordModal}
      title={title}
      preventClose={debeCambiarClave}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {debeCambiarClave && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
            <strong>Primer ingreso:</strong> El administrador te asignó una contraseña provisoria. Por tu seguridad, debés ingresar una contraseña nueva de al menos 8 caracteres para continuar.
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-800 font-medium">
            {success}
          </div>
        )}

        {!debeCambiarClave && (
          <Input
            label="Contraseña actual"
            type={showActual ? 'text' : 'password'}
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            placeholder="Tu clave actual"
            required
            leftIcon={<KeyRound className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowActual(!showActual)}
                className="text-gray-400 hover:text-gray-700"
              >
                {showActual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
        )}

        <Input
          label="Nueva contraseña"
          type={showNueva ? 'text' : 'password'}
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          placeholder="Mínimo 8 caracteres"
          required
          helperText="Al menos 8 caracteres combinando letras y números"
          leftIcon={<KeyRound className="w-4 h-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowNueva(!showNueva)}
              className="text-gray-400 hover:text-gray-700"
            >
              {showNueva ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />

        <Input
          label="Confirmar nueva contraseña"
          type={showConfirmar ? 'text' : 'password'}
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          placeholder="Repetí la nueva clave"
          required
          leftIcon={<KeyRound className="w-4 h-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowConfirmar(!showConfirmar)}
              className="text-gray-400 hover:text-gray-700"
            >
              {showConfirmar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />

        <div className="flex gap-2 pt-2">
          {!debeCambiarClave && (
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={closePasswordModal}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          )}
          <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
            Guardar contraseña
          </Button>
        </div>
      </form>
    </Modal>
  );
};
