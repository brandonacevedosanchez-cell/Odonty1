import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { PREVIEW_MODE } from '../config/preview.js';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

export default function AppLayout() {
  const { signOut } = useAuth();
  const toast = useToast();
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const onKey = (event) => event.key === 'Escape' && setSidebarOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sidebarOpen]);

  const handleSignOut = useCallback(async () => {
    if (PREVIEW_MODE) {
      toast.info('El cierre de sesión está desactivado en la vista previa.');
      return;
    }
    await signOut();
    toast.info('Cerraste sesión correctamente.');
  }, [signOut, toast]);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onSignOut={handleSignOut} />
      <div className="app-shell__main">
        <Topbar onMenu={() => setSidebarOpen(true)} onSignOut={handleSignOut} />
        <main className="content" id="contenido">
          {PREVIEW_MODE && (
            <div className="alert alert--info" role="status">
              Vista previa de solo lectura: no se requiere conexión con el servidor y los cambios no se guardan.
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
