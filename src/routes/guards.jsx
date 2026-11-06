import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ErrorState, LoadingState } from '../components/Feedback.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import ForbiddenPage from '../pages/ForbiddenPage.jsx';
import { can, getPermissions } from '../utils/permissions.js';

const FORCED_CHANGE_PATH = '/cambiar-contrasena';

function FullScreen({ children }) {
  return <div className="fullscreen">{children}</div>;
}

/** Solo usuarios autenticados. Si debe cambiar la contraseña, no puede navegar a nada más. */
export function ProtectedRoute() {
  const { status, isAuthenticated, user, initError, retryBootstrap } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <FullScreen>
        <LoadingState message="Restaurando tu sesión…" />
      </FullScreen>
    );
  }

  if (status === 'error') {
    return (
      <FullScreen>
        <ErrorState
          title="No pudimos conectar con el servidor"
          message={initError?.message}
          onRetry={retryBootstrap}
        />
      </FullScreen>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const onForcedPage = location.pathname === FORCED_CHANGE_PATH;
  if (user.must_change_password && !onForcedPage) return <Navigate to={FORCED_CHANGE_PATH} replace />;
  if (!user.must_change_password && onForcedPage) return <Navigate to="/" replace />;

  return <Outlet />;
}

/** Pantallas públicas (login, MFA): si ya hay sesión se redirige al interior. */
export function GuestRoute() {
  const { status, isAuthenticated } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <FullScreen>
        <LoadingState message="Conectando…" />
      </FullScreen>
    );
  }
  if (isAuthenticated) {
    const target = typeof location.state?.from === 'string' ? location.state.from : '/';
    return <Navigate to={target} replace />;
  }
  return <Outlet />;
}

/** Rutas protegidas: sin permiso se muestra "acceso denegado" y no se consulta ningún dato. */
export function RequirePermission({ permission, strict = false }) {
  const { user } = useAuth();
  if (!(strict ? getPermissions(user).includes(permission) : can(user, permission))) return <ForbiddenPage />;
  return <Outlet />;
}
