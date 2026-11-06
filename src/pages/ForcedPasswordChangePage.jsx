import { useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell.jsx';
import ChangePasswordForm from '../components/ChangePasswordForm.jsx';
import { Alert } from '../components/Feedback.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

/** Pantalla independiente: mientras must_change_password sea true no se permite otra navegación. */
export default function ForcedPasswordChangePage() {
  const { signOut } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  function handleSuccess() {
    toast.success('Contraseña actualizada. Inicia sesión de nuevo con tu nueva contraseña.');
    navigate('/login', { replace: true });
  }

  return (
    <AuthShell
      title="Cambia tu contraseña"
      subtitle="Por seguridad, debes reemplazar la contraseña temporal antes de usar el sistema."
      footer={
        <button type="button" className="link-button" onClick={signOut}>
          Cerrar sesión
        </button>
      }
    >
      <Alert type="info">
        Usa como contraseña actual la temporal que llegó a tu correo. Al terminar, deberás iniciar sesión de nuevo.
      </Alert>
      <ChangePasswordForm onSuccess={handleSuccess} currentLabel="Contraseña temporal (actual)" />
    </AuthShell>
  );
}
