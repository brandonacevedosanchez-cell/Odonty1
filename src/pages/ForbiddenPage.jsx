import { Link } from 'react-router-dom';
import { EmptyState } from '../components/Feedback.jsx';

export default function ForbiddenPage() {
  return (
    <div className="panel panel--center">
      <EmptyState
        icon="lock"
        title="Acceso denegado"
        text="Tu rol no tiene permiso para ver esta sección. Si crees que es un error, contacta a un administrador."
        action={
          <Link to="/" className="btn btn--primary">
            Volver al inicio
          </Link>
        }
      />
    </div>
  );
}
