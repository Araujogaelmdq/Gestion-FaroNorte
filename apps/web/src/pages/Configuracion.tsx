import React, { useEffect, useRef, useState } from 'react';
import {
  Building2,
  Check,
  CreditCard,
  DollarSign,
  Edit2,
  Eye,
  EyeOff,
  FolderTree,
  Plus,
  RefreshCw,
  Save,
  Tag,
  Trash2,
  Upload,
  Wallet,
} from 'lucide-react';
import {
  Categoria,
  Cuenta,
  CuentaInput,
  Rubro,
  RubroInput,
  TipoRubro,
  formatearMoneda,
} from '@faronorte/shared';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Select } from '../components/Select';
import { Tabs } from '../components/Tabs';
import { useAuth } from '../context/AuthContext';
import { useClub } from '../context/ClubContext';
import {
  createCategoria,
  createCuenta,
  createRubro,
  deleteCategoria,
  deleteCuenta,
  deleteRubro,
  getCategorias,
  getCuentas,
  getRubros,
  updateCategoria,
  updateCuenta,
  updateRubro,
} from '../services/configuracion';
import { usuariosService } from '../services/modulos';

export const Configuracion: React.FC = () => {
  const { user } = useAuth();
  const { club, updateClubData, refreshClub } = useClub();

  const [activeTab, setActiveTab] = useState('club');

  // Estado formulario Club
  const [nombreClub, setNombreClub] = useState('');
  const [contactoClub, setContactoClub] = useState('');
  const [diaVencimiento, setDiaVencimiento] = useState(10);
  const [descuentoFamiliar, setDescuentoFamiliar] = useState(0);
  const [escudoUrl, setEscudoUrl] = useState('');
  const [guardandoClub, setGuardandoClub] = useState(false);
  const [mensajeClub, setMensajeClub] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(
    null
  );

  // Estado Categorías
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(false);
  const [modalCategoriaAbierto, setModalCategoriaAbierto] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null);
  const [nombreCategoria, setNombreCategoria] = useState('');
  const [valorCuota, setValorCuota] = useState<number | ''>(18000);
  const [categoriaActiva, setCategoriaActiva] = useState(true);
  const [guardandoCategoria, setGuardandoCategoria] = useState(false);
  const [errorCategoria, setErrorCategoria] = useState<string | null>(null);

  // Estado Cuentas
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [cargandoCuentas, setCargandoCuentas] = useState(false);
  const [modalCuentaAbierto, setModalCuentaAbierto] = useState(false);
  const [cuentaEditando, setCuentaEditando] = useState<Cuenta | null>(null);
  const [nombreCuenta, setNombreCuenta] = useState('');
  const [saldoInicialCuenta, setSaldoInicialCuenta] = useState<number | ''>(0);
  const [cuentaActiva, setCuentaActiva] = useState(true);
  const [guardandoCuenta, setGuardandoCuenta] = useState(false);
  const [errorCuenta, setErrorCuenta] = useState<string | null>(null);

  // Estado Rubros
  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [cargandoRubros, setCargandoRubros] = useState(false);
  const [filtroTipoRubro, setFiltroTipoRubro] = useState<'todos' | 'ingreso' | 'gasto'>('todos');
  const [modalRubroAbierto, setModalRubroAbierto] = useState(false);
  const [rubroEditando, setRubroEditando] = useState<Rubro | null>(null);
  const [nombreRubro, setNombreRubro] = useState('');
  const [tipoRubro, setTipoRubro] = useState<TipoRubro>('ingreso');
  const [rubroPrivado, setRubroPrivado] = useState(false);
  const [rubroActivo, setRubroActivo] = useState(true);
  const [guardandoRubro, setGuardandoRubro] = useState(false);
  const [errorRubro, setErrorRubro] = useState<string | null>(null);

  // Estado Usuarios
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [modalUsuarioAbierto, setModalUsuarioAbierto] = useState(false);
  const [nuevoUsuEmail, setNuevoUsuEmail] = useState('');
  const [nuevoUsuNombre, setNuevoUsuNombre] = useState('');
  const [nuevoUsuRol, setNuevoUsuRol] = useState('secretario');
  const [guardandoUsuario, setGuardandoUsuario] = useState(false);
  const [errorUsuario, setErrorUsuario] = useState<string | null>(null);
  const [claveTemp, setClaveTemp] = useState<string | null>(null);
  const [claveTempUsuario, setClaveTempUsuario] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const esAdmin = user?.rol === 'administrador';

  // Cargar datos del club en el formulario
  useEffect(() => {
    if (club) {
      setNombreClub(club.nombre || '');
      setContactoClub(club.contacto || '');
      setDiaVencimiento(club.dia_vencimiento || 10);
      setDescuentoFamiliar(club.descuento_familiar_pct || 0);
      setEscudoUrl(club.escudo_url || '/LogoFN.jpg');
    }
  }, [club]);

  // Cargar categorías
  const cargarCategorias = async () => {
    setCargandoCategorias(true);
    try {
      const data = await getCategorias(false);
      setCategorias(data);
    } catch (err) {
      console.error('Error al cargar categorías:', err);
    } finally {
      setCargandoCategorias(false);
    }
  };

  // Cargar cuentas
  const cargarCuentas = async () => {
    setCargandoCuentas(true);
    try {
      const data = await getCuentas(false);
      setCuentas(data);
    } catch (err) {
      console.error('Error al cargar cuentas:', err);
    } finally {
      setCargandoCuentas(false);
    }
  };

  // Cargar rubros
  const cargarRubros = async () => {
    setCargandoRubros(true);
    try {
      const data = await getRubros(false);
      setRubros(data);
    } catch (err) {
      console.error('Error al cargar rubros:', err);
    } finally {
      setCargandoRubros(false);
    }
  };

  // Cargar usuarios
  const cargarUsuarios = async () => {
    try {
      const data = await usuariosService.listar();
      setUsuarios(data.usuarios || []);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
    }
  };

  useEffect(() => {
    cargarCategorias();
    cargarCuentas();
    cargarRubros();
  }, []);

  useEffect(() => {
    if (activeTab === 'usuarios' && esAdmin) {
      cargarUsuarios();
    }
  }, [activeTab, esAdmin]);

  // Subida de imagen para el escudo (conversión a Base64)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor seleccioná un archivo de imagen válido (PNG, JPG o WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen no debe superar los 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setEscudoUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Guardar datos del club
  const handleGuardarClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeClub(null);

    if (!nombreClub.trim()) {
      setMensajeClub({ tipo: 'error', texto: 'El nombre del club no puede estar vacío.' });
      return;
    }

    setGuardandoClub(true);
    try {
      await updateClubData({
        nombre: nombreClub.trim(),
        contacto: contactoClub.trim() || null,
        dia_vencimiento: Number(diaVencimiento) || 10,
        descuento_familiar_pct: Number(descuentoFamiliar) || 0,
        escudo_url: escudoUrl.trim() || '/LogoFN.jpg',
      });
      setMensajeClub({ tipo: 'ok', texto: '¡Datos del club guardados correctamente!' });
      await refreshClub();
    } catch (err: any) {
      setMensajeClub({
        tipo: 'error',
        texto: err.message || 'No se pudieron guardar los cambios.',
      });
    } finally {
      setGuardandoClub(false);
    }
  };

  // Categorías
  const handleAbrirCrearCategoria = () => {
    setCategoriaEditando(null);
    setNombreCategoria('');
    setValorCuota(18000);
    setCategoriaActiva(true);
    setErrorCategoria(null);
    setModalCategoriaAbierto(true);
  };

  const handleAbrirEditarCategoria = (cat: Categoria) => {
    setCategoriaEditando(cat);
    setNombreCategoria(cat.nombre);
    setValorCuota(cat.valor_cuota_centavos);
    setCategoriaActiva(cat.activa);
    setErrorCategoria(null);
    setModalCategoriaAbierto(true);
  };

  const handleGuardarCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCategoria(null);

    if (!nombreCategoria.trim()) {
      setErrorCategoria('Ingresá el nombre de la categoría.');
      return;
    }

    if (valorCuota === '' || valorCuota < 0) {
      setErrorCategoria('El valor de la cuota debe ser mayor o igual a 0.');
      return;
    }

    setGuardandoCategoria(true);
    try {
      if (categoriaEditando) {
        await updateCategoria(categoriaEditando.id, {
          nombre: nombreCategoria.trim(),
          valor_cuota_centavos: Number(valorCuota),
          activa: categoriaActiva,
        });
      } else {
        await createCategoria({
          nombre: nombreCategoria.trim(),
          valor_cuota_centavos: Number(valorCuota),
          activa: categoriaActiva,
        });
      }
      setModalCategoriaAbierto(false);
      await cargarCategorias();
    } catch (err: any) {
      setErrorCategoria(err.message || 'Ocurrió un error al guardar la categoría.');
    } finally {
      setGuardandoCategoria(false);
    }
  };

  const handleToggleActiva = async (cat: Categoria) => {
    try {
      await updateCategoria(cat.id, { activa: !cat.activa });
      await cargarCategorias();
    } catch (err: any) {
      alert(err.message || 'No se pudo cambiar el estado de la categoría');
    }
  };

  const handleEliminarCategoria = async (cat: Categoria) => {
    const confirmar = window.confirm(
      `¿Seguro que querés eliminar la categoría "${cat.nombre}"?\nSi tiene socios asociados pasará a estar inactiva para no afectar el historial.`
    );
    if (!confirmar) return;

    try {
      const res = await deleteCategoria(cat.id);
      alert(res.mensaje);
      await cargarCategorias();
    } catch (err: any) {
      alert(err.message || 'No se pudo eliminar la categoría');
    }
  };

  // Cuentas
  const handleAbrirCrearCuenta = () => {
    setCuentaEditando(null);
    setNombreCuenta('');
    setSaldoInicialCuenta(0);
    setCuentaActiva(true);
    setErrorCuenta(null);
    setModalCuentaAbierto(true);
  };

  const handleAbrirEditarCuenta = (c: Cuenta) => {
    setCuentaEditando(c);
    setNombreCuenta(c.nombre);
    setSaldoInicialCuenta(c.saldo_inicial);
    setCuentaActiva(c.activa);
    setErrorCuenta(null);
    setModalCuentaAbierto(true);
  };

  const handleGuardarCuenta = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCuenta(null);

    if (!nombreCuenta.trim()) {
      setErrorCuenta('Ingresá el nombre de la cuenta.');
      return;
    }

    setGuardandoCuenta(true);
    try {
      if (cuentaEditando) {
        await updateCuenta(cuentaEditando.id, {
          nombre: nombreCuenta.trim(),
          saldo_inicial: Number(saldoInicialCuenta || 0),
          activa: cuentaActiva,
        });
      } else {
        await createCuenta({
          nombre: nombreCuenta.trim(),
          saldo_inicial: Number(saldoInicialCuenta || 0),
          activa: cuentaActiva,
        });
      }
      setModalCuentaAbierto(false);
      await cargarCuentas();
    } catch (err: any) {
      setErrorCuenta(err.message || 'Ocurrió un error al guardar la cuenta.');
    } finally {
      setGuardandoCuenta(false);
    }
  };

  const handleToggleActivaCuenta = async (c: Cuenta) => {
    try {
      await updateCuenta(c.id, { activa: !c.activa });
      await cargarCuentas();
    } catch (err: any) {
      alert(err.message || 'No se pudo cambiar el estado de la cuenta');
    }
  };

  const handleEliminarCuenta = async (c: Cuenta) => {
    const confirmar = window.confirm(
      `¿Seguro que querés eliminar la cuenta "${c.nombre}"?\nSi tiene movimientos o cobros registrados pasará a estar inactiva para cuidar el registro.`
    );
    if (!confirmar) return;

    try {
      const res = await deleteCuenta(c.id);
      alert(res.mensaje);
      await cargarCuentas();
    } catch (err: any) {
      alert(err.message || 'No se pudo eliminar la cuenta');
    }
  };

  // Rubros
  const handleAbrirCrearRubro = () => {
    setRubroEditando(null);
    setNombreRubro('');
    setTipoRubro('ingreso');
    setRubroPrivado(false);
    setRubroActivo(true);
    setErrorRubro(null);
    setModalRubroAbierto(true);
  };

  const handleAbrirEditarRubro = (r: Rubro) => {
    setRubroEditando(r);
    setNombreRubro(r.nombre);
    setTipoRubro(r.tipo);
    setRubroPrivado(r.privado);
    setRubroActivo(r.activo);
    setErrorRubro(null);
    setModalRubroAbierto(true);
  };

  const handleGuardarRubro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorRubro(null);

    if (!nombreRubro.trim()) {
      setErrorRubro('Ingresá el nombre del rubro.');
      return;
    }

    setGuardandoRubro(true);
    try {
      if (rubroEditando) {
        await updateRubro(rubroEditando.id, {
          nombre: nombreRubro.trim(),
          tipo: tipoRubro,
          privado: rubroPrivado,
          activo: rubroActivo,
        });
      } else {
        await createRubro({
          nombre: nombreRubro.trim(),
          tipo: tipoRubro,
          privado: rubroPrivado,
          activo: rubroActivo,
        });
      }
      setModalRubroAbierto(false);
      await cargarRubros();
    } catch (err: any) {
      setErrorRubro(err.message || 'Ocurrió un error al guardar el rubro.');
    } finally {
      setGuardandoRubro(false);
    }
  };

  const handleToggleActivoRubro = async (r: Rubro) => {
    try {
      await updateRubro(r.id, { activo: !r.activo });
      await cargarRubros();
    } catch (err: any) {
      alert(err.message || 'No se pudo cambiar el estado del rubro');
    }
  };

  const handleEliminarRubro = async (r: Rubro) => {
    const confirmar = window.confirm(
      `¿Seguro que querés eliminar el rubro "${r.nombre}"?\nSi tiene movimientos registrados pasará a estar inactivo para mantener los balances históricos.`
    );
    if (!confirmar) return;

    try {
      const res = await deleteRubro(r.id);
      alert(res.mensaje);
      await cargarRubros();
    } catch (err: any) {
      alert(err.message || 'No se pudo eliminar el rubro');
    }
  };

  const rubrosFiltrados = rubros.filter((r) => {
    if (filtroTipoRubro === 'todos') return true;
    return r.tipo === filtroTipoRubro;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2.5">
          <Building2 className="w-6 h-6 text-[#E8863A]" />
          Configuración
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Parámetros institucionales, categorías de socios, cuentas y rubros de tesorería
        </p>
      </div>

      {!esAdmin && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
          <strong>Aviso:</strong> Estás navegando como {user?.rol}. Solo el usuario con rol{' '}
          <strong>administrador</strong> puede realizar cambios en la configuración.
        </div>
      )}

      {/* Pestañas de secciones */}
      <Tabs
        tabs={[
          { id: 'club', label: 'Datos del Club' },
          { id: 'categorias', label: 'Categorías y Cuotas', count: categorias.length },
          { id: 'cuentas', label: 'Cuentas', count: cuentas.length },
          { id: 'rubros', label: 'Rubros', count: rubros.length },
          ...(esAdmin ? [{ id: 'usuarios', label: 'Usuarios' }] : []),
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* SECCIÓN 1: DATOS DEL CLUB */}
      {activeTab === 'club' && (
        <form onSubmit={handleGuardarClub} className="space-y-6">
          <Card padding="lg" className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#E8863A]" />
                Identidad y datos institucionales
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Esta información se utiliza en los encabezados, la pantalla de login y los recibos.
              </p>
            </div>

            {/* Escudo del club */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Escudo del Club
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <img
                  src={escudoUrl || '/LogoFN.jpg'}
                  alt="Escudo del Club"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-200 shadow-md bg-gray-100"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/LogoFN.jpg';
                  }}
                />
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <p className="text-xs text-gray-700 font-medium">
                    Subí una imagen cuadrada en formato PNG, JPG o WebP (máx. 2 MB).
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={!esAdmin}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      icon={<Upload className="w-3.5 h-3.5" />}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!esAdmin}
                    >
                      Elegir imagen
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEscudoUrl('/LogoFN.jpg')}
                      disabled={!esAdmin || escudoUrl === '/LogoFN.jpg'}
                    >
                      Restaurar predeterminado
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Campos de texto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nombre del Club"
                value={nombreClub}
                onChange={(e) => setNombreClub(e.target.value)}
                placeholder="Ej: Faro Norte"
                required
                disabled={!esAdmin}
              />

              <Input
                label="Contacto institucional (Email / Teléfono)"
                value={contactoClub}
                onChange={(e) => setContactoClub(e.target.value)}
                placeholder="Ej: contacto@faronorte.club"
                disabled={!esAdmin}
              />
            </div>

            {/* Parámetros de cobro */}
            <div className="pt-2 border-t border-gray-200">
              <h3 className="text-sm font-bold text-gray-800 mb-1">
                Parámetros de cuotas sociales
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Configuración del vencimiento regular y reglas de cobro.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Día de vencimiento mensual de las cuotas"
                    type="number"
                    min={1}
                    max={28}
                    value={diaVencimiento}
                    onChange={(e) => setDiaVencimiento(Number(e.target.value))}
                    required
                    disabled={!esAdmin}
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Por defecto día 10 de cada mes (entre 1 y 28).
                  </span>
                </div>

                <div>
                  <Input
                    label="Descuento familiar (%)"
                    type="number"
                    min={0}
                    max={100}
                    value={descuentoFamiliar}
                    onChange={(e) => setDescuentoFamiliar(Number(e.target.value))}
                    disabled={!esAdmin}
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Porcentaje aplicable a cuotas de familias asociadas.
                  </span>
                </div>
              </div>
            </div>

            {/* Mensajes de resultado */}
            {mensajeClub && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  mensajeClub.tipo === 'ok'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                {mensajeClub.tipo === 'ok' && <Check className="w-4 h-4 shrink-0" />}
                <span>{mensajeClub.texto}</span>
              </div>
            )}

            {/* Botón de guardado */}
            {esAdmin && (
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={guardandoClub}
                  icon={<Save className="w-4 h-4" />}
                >
                  Guardar cambios del club
                </Button>
              </div>
            )}
          </Card>
        </form>
      )}

      {/* SECCIÓN 2: CATEGORÍAS Y VALORES DE CUOTAS */}
      {activeTab === 'categorias' && (
        <div className="space-y-4">
          <Card padding="lg" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[#5BB8C4]" />
                  Categorías de socios y valor de cuota
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Establecen el monto que se generará en la cuota de cada socio según su categoría.
                </p>
              </div>

              {esAdmin && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={handleAbrirCrearCategoria}
                >
                  Nueva categoría
                </Button>
              )}
            </div>

            {/* Listado de categorías */}
            {cargandoCategorias ? (
              <div className="py-12 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#E8863A]" />
                Cargando categorías...
              </div>
            ) : categorias.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl">
                <Tag className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">No hay categorías cargadas</p>
                <p className="text-xs text-gray-400 mt-1">
                  Creá la primera categoría para poder asociar socios y generar sus cuotas.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {categorias.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-gray-200 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100/80 border border-gray-200/60 flex items-center justify-center shrink-0">
                        <Tag className="w-5 h-5 text-[#5BB8C4]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-900">{cat.nombre}</span>
                          <Badge variant={cat.activa ? 'success' : 'warning'} size="sm">
                            {cat.activa ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500 mt-0.5 block">
                          Valor mensual de la cuota:{' '}
                          <strong className="text-gray-800">
                            {formatearMoneda(cat.valor_cuota_centavos)}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {esAdmin && (
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Edit2 className="w-3.5 h-3.5" />}
                          onClick={() => handleAbrirEditarCategoria(cat)}
                        >
                          Editar
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleToggleActiva(cat)}
                        >
                          {cat.activa ? 'Desactivar' : 'Activar'}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                          onClick={() => handleEliminarCategoria(cat)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* SECCIÓN 3: CUENTAS DE TESORERÍA */}
      {activeTab === 'cuentas' && (
        <div className="space-y-4">
          <Card padding="lg" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-[#E8863A]" />
                  Cuentas de tesorería y cajas
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Cuentas bancarias, billeteras electrónicas y cajas físicas donde ingresa y sale dinero.
                </p>
              </div>

              {esAdmin && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={handleAbrirCrearCuenta}
                >
                  Nueva cuenta
                </Button>
              )}
            </div>

            {/* Listado de cuentas */}
            {cargandoCuentas ? (
              <div className="py-12 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#E8863A]" />
                Cargando cuentas...
              </div>
            ) : cuentas.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl">
                <Wallet className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">No hay cuentas cargadas</p>
                <p className="text-xs text-gray-400 mt-1">
                  Creá las cuentas iniciales como Caja efectivo, Banco o Mercado Pago.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {cuentas.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-gray-200 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100/80 border border-gray-200/60 flex items-center justify-center shrink-0">
                        <CreditCard className="w-5 h-5 text-[#E8863A]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-900">{c.nombre}</span>
                          <Badge variant={c.activa ? 'success' : 'warning'} size="sm">
                            {c.activa ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500 mt-0.5 block">
                          Saldo inicial declarado:{' '}
                          <strong className="text-gray-800">
                            {formatearMoneda(c.saldo_inicial)}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {esAdmin && (
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Edit2 className="w-3.5 h-3.5" />}
                          onClick={() => handleAbrirEditarCuenta(c)}
                        >
                          Editar
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleToggleActivaCuenta(c)}
                        >
                          {c.activa ? 'Desactivar' : 'Activar'}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                          onClick={() => handleEliminarCuenta(c)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* SECCIÓN 4: RUBROS */}
      {activeTab === 'rubros' && (
        <div className="space-y-4">
          <Card padding="lg" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-[#5BB8C4]" />
                  Rubros de ingresos y gastos
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Clasificación para registrar movimientos de dinero y publicar en la página de transparencia.
                </p>
              </div>

              {esAdmin && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={handleAbrirCrearRubro}
                >
                  Nuevo rubro
                </Button>
              )}
            </div>

            {/* Filtros de tipo */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setFiltroTipoRubro('todos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filtroTipoRubro === 'todos'
                    ? 'bg-[#E8863A] text-white'
                    : 'bg-gray-100/80 text-gray-500 hover:text-gray-800'
                }`}
              >
                Todos ({rubros.length})
              </button>
              <button
                onClick={() => setFiltroTipoRubro('ingreso')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filtroTipoRubro === 'ingreso'
                    ? 'bg-[#5BB8C4] text-[#1A1A1A]'
                    : 'bg-gray-100/80 text-gray-500 hover:text-gray-800'
                }`}
              >
                Solo ingresos ({rubros.filter((r) => r.tipo === 'ingreso').length})
              </button>
              <button
                onClick={() => setFiltroTipoRubro('gasto')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filtroTipoRubro === 'gasto'
                    ? 'bg-rose-600 text-white'
                    : 'bg-gray-100/80 text-gray-500 hover:text-gray-800'
                }`}
              >
                Solo gastos ({rubros.filter((r) => r.tipo === 'gasto').length})
              </button>
            </div>

            {/* Listado de rubros */}
            {cargandoRubros ? (
              <div className="py-12 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#E8863A]" />
                Cargando rubros...
              </div>
            ) : rubrosFiltrados.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl">
                <FolderTree className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">No hay rubros en este filtro</p>
                <p className="text-xs text-gray-400 mt-1">
                  Creá un nuevo rubro para clasificar los movimientos de dinero.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {rubrosFiltrados.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-gray-200 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100/80 border border-gray-200/60 flex items-center justify-center shrink-0">
                        {r.tipo === 'ingreso' ? (
                          <DollarSign className="w-5 h-5 text-[#5BB8C4]" />
                        ) : (
                          <DollarSign className="w-5 h-5 text-rose-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-gray-900">{r.nombre}</span>
                          <Badge
                            variant={r.tipo === 'ingreso' ? 'teal' : 'danger'}
                            size="sm"
                          >
                            {r.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}
                          </Badge>
                          {r.privado ? (
                            <Badge variant="warning" size="sm">
                              Privado
                            </Badge>
                          ) : (
                            <Badge variant="default" size="sm">
                              Público
                            </Badge>
                          )}
                          <Badge variant={r.activo ? 'success' : 'warning'} size="sm">
                            {r.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-gray-400 mt-1 block">
                          {r.privado
                            ? 'Este rubro se excluye de la página de transparencia pública.'
                            : 'Se publica en los totales del portal de transparencia.'}
                        </span>
                      </div>
                    </div>

                    {esAdmin && (
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Edit2 className="w-3.5 h-3.5" />}
                          onClick={() => handleAbrirEditarRubro(r)}
                        >
                          Editar
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleToggleActivoRubro(r)}
                        >
                          {r.activo ? 'Desactivar' : 'Activar'}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                          onClick={() => handleEliminarRubro(r)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Modal para Crear / Editar Categoría */}
      <Modal
        isOpen={modalCategoriaAbierto}
        onClose={() => setModalCategoriaAbierto(false)}
        title={categoriaEditando ? 'Editar categoría' : 'Nueva categoría de socio'}
      >
        <form onSubmit={handleGuardarCategoria} className="space-y-4">
          <Input
            label="Nombre de la categoría"
            placeholder="Ej: Mayor, Menor, Cadete, Familiar..."
            value={nombreCategoria}
            onChange={(e) => setNombreCategoria(e.target.value)}
            required
            autoFocus
          />

          <div>
            <Input
              label="Valor de la cuota mensual ($)"
              type="number"
              min={0}
              step={100}
              placeholder="18000"
              value={valorCuota}
              onChange={(e) =>
                setValorCuota(e.target.value === '' ? '' : Math.round(Number(e.target.value)))
              }
              required
            />
            {typeof valorCuota === 'number' && valorCuota >= 0 && (
              <span className="text-xs text-[#5BB8C4] font-medium mt-1 block">
                Se mostrará como: {formatearMoneda(valorCuota)}
              </span>
            )}
          </div>

          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-100 border border-gray-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={categoriaActiva}
              onChange={(e) => setCategoriaActiva(e.target.checked)}
              className="w-4 h-4 rounded text-[#E8863A] bg-gray-100 border-gray-200 focus:ring-[#E8863A]"
            />
            <span className="text-xs font-semibold text-gray-800">
              Categoría habilitada para nuevos socios
            </span>
          </label>

          {errorCategoria && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              {errorCategoria}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setModalCategoriaAbierto(false)}
              disabled={guardandoCategoria}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={guardandoCategoria}
              icon={<Save className="w-4 h-4" />}
            >
              {categoriaEditando ? 'Guardar cambios' : 'Crear categoría'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal para Crear / Editar Cuenta */}
      <Modal
        isOpen={modalCuentaAbierto}
        onClose={() => setModalCuentaAbierto(false)}
        title={cuentaEditando ? 'Editar cuenta de tesorería' : 'Nueva cuenta de tesorería'}
      >
        <form onSubmit={handleGuardarCuenta} className="space-y-4">
          <Input
            label="Nombre de la cuenta"
            placeholder="Ej: Caja efectivo, Banco Provincia, Mercado Pago..."
            value={nombreCuenta}
            onChange={(e) => setNombreCuenta(e.target.value)}
            required
            autoFocus
          />

          <div>
            <Input
              label="Saldo inicial ($)"
              type="number"
              step={100}
              placeholder="0"
              value={saldoInicialCuenta}
              onChange={(e) =>
                setSaldoInicialCuenta(
                  e.target.value === '' ? '' : Math.round(Number(e.target.value))
                )
              }
              required
            />
            {typeof saldoInicialCuenta === 'number' && (
              <span className="text-xs text-[#E8863A] font-medium mt-1 block">
                Saldo inicial: {formatearMoneda(saldoInicialCuenta)}
              </span>
            )}
          </div>

          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-100 border border-gray-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={cuentaActiva}
              onChange={(e) => setCuentaActiva(e.target.checked)}
              className="w-4 h-4 rounded text-[#E8863A] bg-gray-100 border-gray-200 focus:ring-[#E8863A]"
            />
            <span className="text-xs font-semibold text-gray-800">
              Cuenta habilitada para operar
            </span>
          </label>

          {errorCuenta && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              {errorCuenta}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setModalCuentaAbierto(false)}
              disabled={guardandoCuenta}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={guardandoCuenta}
              icon={<Save className="w-4 h-4" />}
            >
              {cuentaEditando ? 'Guardar cambios' : 'Crear cuenta'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal para Crear / Editar Rubro */}
      <Modal
        isOpen={modalRubroAbierto}
        onClose={() => setModalRubroAbierto(false)}
        title={rubroEditando ? 'Editar rubro' : 'Nuevo rubro de tesorería'}
      >
        <form onSubmit={handleGuardarRubro} className="space-y-4">
          <Input
            label="Nombre del rubro"
            placeholder="Ej: Cuotas sociales, Cantina, Mantenimiento..."
            value={nombreRubro}
            onChange={(e) => setNombreRubro(e.target.value)}
            required
            autoFocus
          />

          <Select
            label="Tipo de movimiento"
            value={tipoRubro}
            onChange={(e) => setTipoRubro(e.target.value as TipoRubro)}
            options={[
              { value: 'ingreso', label: 'Ingreso (Entrada de dinero)' },
              { value: 'gasto', label: 'Gasto (Salida de dinero)' },
            ]}
          />

          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-100 border border-gray-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rubroPrivado}
              onChange={(e) => setRubroPrivado(e.target.checked)}
              className="w-4 h-4 rounded text-[#E8863A] bg-gray-100 border-gray-200 focus:ring-[#E8863A] mt-0.5"
            />
            <div>
              <span className="text-xs font-semibold text-gray-800 block">
                Marcar como rubro privado
              </span>
              <span className="text-[11px] text-gray-500 block mt-0.5">
                Si está marcado, los movimientos bajo este rubro no se mostrarán en el portal de
                transparencia pública.
              </span>
            </div>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-100 border border-gray-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rubroActivo}
              onChange={(e) => setRubroActivo(e.target.checked)}
              className="w-4 h-4 rounded text-[#E8863A] bg-gray-100 border-gray-200 focus:ring-[#E8863A]"
            />
            <span className="text-xs font-semibold text-gray-800">
              Rubro activo para registrar movimientos
            </span>
          </label>

          {errorRubro && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              {errorRubro}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setModalRubroAbierto(false)}
              disabled={guardandoRubro}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={guardandoRubro}
              icon={<Save className="w-4 h-4" />}
            >
              {rubroEditando ? 'Guardar cambios' : 'Crear rubro'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* SECCIÓN 5: USUARIOS (Solo admin) */}
      {activeTab === 'usuarios' && esAdmin && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Usuarios del sistema</h2>
              <p className="text-xs text-gray-500">
                Gestioná el acceso de la comisión directiva, secretaría y profesores
              </p>
            </div>
            <Button
              onClick={() => {
                setModalUsuarioAbierto(true);
                setErrorUsuario(null);
                setNuevoUsuEmail('');
                setNuevoUsuNombre('');
                setNuevoUsuRol('secretario');
                setClaveTemp(null);
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              Nuevo usuario
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {usuarios.map((u: any) => (
              <Card key={u.id} className="p-4 border border-gray-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{u.nombre}</p>
                      <Badge variant={u.activo ? (u.rol === 'administrador' ? 'accent' : 'default') : 'danger'} size="sm">
                        {u.rol}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">{u.email}</p>
                    <p className="text-[11px] text-gray-400">
                      Estado: {u.activo ? 'Activo' : 'Inactivo'} {u.debe_cambiar_clave ? '· Debe cambiar clave' : ''}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const r = await usuariosService.generarClave(u.id);
                          setClaveTempUsuario(r.contrasena_temporal);
                        } catch (err: any) {
                          alert(err.message || 'Error al generar clave');
                        }
                      }}
                      className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Nueva clave
                    </button>
                    {u.id !== user?.id && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await usuariosService.actualizar(u.id, { activo: !u.activo });
                            await cargarUsuarios();
                          } catch (err: any) {
                            alert(err.message || 'Error al actualizar usuario');
                          }
                        }}
                        className={`text-xs font-medium ${u.activo ? 'text-red-500 hover:text-red-600' : 'text-green-600 hover:text-green-700'}`}
                      >
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Modal nuevo usuario */}
          <Modal
            isOpen={modalUsuarioAbierto}
            onClose={() => setModalUsuarioAbierto(false)}
            title="Crear nuevo usuario"
          >
            <div className="space-y-4">
              {errorUsuario && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl font-medium">
                  {errorUsuario}
                </div>
              )}

              {claveTemp && (
                <div className="bg-green-50 border border-green-200 text-green-800 text-xs p-3 rounded-xl space-y-1">
                  <p className="font-semibold">¡Usuario creado con éxito!</p>
                  <p>Contraseña temporal asignada:</p>
                  <p className="font-mono text-base font-bold text-green-900 bg-white p-2 rounded border border-green-300 select-all">
                    {claveTemp}
                  </p>
                  <p className="text-[11px] text-green-700">
                    Copiá esta clave y enviasela al usuario. Al ingresar por primera vez se le pedirá cambiarla.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre completo</label>
                <Input
                  value={nuevoUsuNombre}
                  onChange={(e) => setNuevoUsuNombre(e.target.value)}
                  placeholder="Ej: Laura Martínez"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                <Input
                  type="email"
                  value={nuevoUsuEmail}
                  onChange={(e) => setNuevoUsuEmail(e.target.value)}
                  placeholder="laura@faronorte.club"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Rol</label>
                <select
                  value={nuevoUsuRol}
                  onChange={(e) => setNuevoUsuRol(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-sm"
                >
                  <option value="administrador">Administrador (acceso total)</option>
                  <option value="tesorero">Tesorero (cobros, cuotas, tesorería)</option>
                  <option value="secretario">Secretario (socios, cobros, cuotas)</option>
                  <option value="profe">Profesor (consulta de socios activos)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={async () => {
                    setErrorUsuario(null);
                    if (!nuevoUsuNombre.trim() || !nuevoUsuEmail.trim()) {
                      setErrorUsuario('Completá nombre y email.');
                      return;
                    }
                    setGuardandoUsuario(true);
                    try {
                      const r = await usuariosService.crear({
                        email: nuevoUsuEmail.trim(),
                        nombre: nuevoUsuNombre.trim(),
                        rol: nuevoUsuRol as any,
                      });
                      setClaveTemp(r.contrasena_temporal);
                      await cargarUsuarios();
                    } catch (e: any) {
                      setErrorUsuario(e.message || 'Error al crear usuario');
                    } finally {
                      setGuardandoUsuario(false);
                    }
                  }}
                  disabled={guardandoUsuario}
                  className="flex-1"
                >
                  {guardandoUsuario ? 'Creando…' : 'Crear usuario'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setModalUsuarioAbierto(false)}
                  className="flex-1"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </Modal>

          {/* Modal clave temporal regenerada */}
          <Modal
            isOpen={!!claveTempUsuario}
            onClose={() => setClaveTempUsuario(null)}
            title="Nueva clave provisoria generada"
          >
            <div className="space-y-4 text-center">
              <p className="text-sm text-gray-600">
                Se generó una nueva contraseña temporal para este usuario:
              </p>
              <div className="font-mono text-xl font-bold bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 select-all">
                {claveTempUsuario}
              </div>
              <p className="text-xs text-gray-500">
                Copiá la clave y enviasela. El usuario deberá cambiarla obligatoriamente al iniciar sesión.
              </p>
              <Button onClick={() => setClaveTempUsuario(null)} className="w-full">
                Listo, ya la copié
              </Button>
            </div>
          </Modal>
        </div>
      )}
    </div>
  );
};
