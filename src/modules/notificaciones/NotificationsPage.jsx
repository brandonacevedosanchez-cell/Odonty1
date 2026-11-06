import { useState } from 'react';
import { EmptyState } from '../../components/Feedback.jsx';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import ModuleApiNotice from '../comun/ModuleApiNotice.jsx';

export default function NotificationsPage() {
  const [filter, setFilter] = useState('all');

  return (
    <>
      <PageHeader
        title="Notificaciones"
        description="Consulta avisos del sistema y actualizaciones relevantes."
      />
      <ModuleApiNotice moduleName="Notificaciones">
        No hay API de notificaciones. No se simulan avisos, estados de lectura ni envíos por correo o mensajería.
      </ModuleApiNotice>

      <section className="panel section notifications-panel">
        <div className="notifications-toolbar">
          <div>
            <h2 className="panel__title">Centro de notificaciones</h2>
            <p className="module-muted">Indicador de no leídas: no disponible hasta integrar la API.</p>
          </div>
          <div className="module-segmented" role="group" aria-label="Filtrar notificaciones">
            {[
              ['all', 'Todas'],
              ['unread', 'Sin leer'],
            ].map(([key, label]) => (
              <button
                type="button"
                key={key}
                className={filter === key ? 'module-segmented__active' : ''}
                aria-pressed={filter === key}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="notifications-content">
          <div className="notifications-list">
            <div className="notification-list-head" aria-hidden="true">
              <span>Fecha y hora</span>
              <span>Tipo y descripción</span>
              <span>Lectura</span>
            </div>
            <EmptyState
              icon="bell"
              title="No hay notificaciones disponibles"
              text="Los avisos y su estado de lectura se cargarán desde el backend cuando exista el servicio."
            />
          </div>
          <aside className="notification-detail" aria-live="polite">
            <span className="notification-detail__icon"><Icon name="file-text" size={21} /></span>
            <h3>Detalle</h3>
            <p className="module-muted">Selecciona una notificación para consultar su descripción y fecha cuando haya datos disponibles.</p>
          </aside>
        </div>
      </section>
    </>
  );
}
