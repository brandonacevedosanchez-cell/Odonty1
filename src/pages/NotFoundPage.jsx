import { Link } from 'react-router-dom';
import { EmptyState } from '../components/Feedback.jsx';

export default function NotFoundPage() {
  return (
    <div className="panel panel--center">
      <EmptyState
        icon="search"
        title="Página no encontrada"
        text="La dirección que intentaste abrir no existe."
        action={
          <Link to="/" className="btn btn--primary">
            Volver al inicio
          </Link>
        }
      />
    </div>
  );
}
