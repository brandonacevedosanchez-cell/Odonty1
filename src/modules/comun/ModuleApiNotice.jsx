import { Alert } from '../../components/Feedback.jsx';

export default function ModuleApiNotice({ moduleName, children }) {
  return (
    <Alert type="info">
      <strong>API pendiente:</strong> {moduleName} aún no está documentado en el contrato del backend. {children}
    </Alert>
  );
}
