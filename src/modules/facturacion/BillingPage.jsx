import { useState } from 'react';
import { EmptyState } from '../../components/Feedback.jsx';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import ModuleApiNotice from '../comun/ModuleApiNotice.jsx';

export default function BillingPage() {
  const [query, setQuery] = useState('');

  return (
    <>
      <PageHeader
        title="Facturación y pagos"
        description="Consulta facturas, pagos y saldos asociados a los pacientes."
      />
      <ModuleApiNotice moduleName="Facturación y pagos">
        No hay endpoints financieros documentados. No se calculan ingresos ni saldos, no se registran pagos y no se integra facturación electrónica.
      </ModuleApiNotice>

      <section className="panel section">
        <div className="module-toolbar">
          <h2 className="panel__title">Facturas</h2>
          <label className="search module-search">
            <Icon name="search" size={17} />
            <input
              className="search__input"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por factura o paciente"
              aria-label="Buscar facturas"
            />
          </label>
        </div>
        <div className="billing-filters">
          <label className="field">
            <span className="field__label">Estado de pago</span>
            <select className="input" disabled><option>Estados por definir en el contrato</option></select>
          </label>
          <label className="field">
            <span className="field__label">Periodo</span>
            <select className="input" disabled><option>Filtro disponible al integrar facturas</option></select>
          </label>
        </div>
        <div className="table-wrap">
          <table className="table table--responsive">
            <thead>
              <tr>
                <th scope="col">Factura</th>
                <th scope="col">Paciente</th>
                <th scope="col">Emisión</th>
                <th scope="col">Vencimiento</th>
                <th scope="col">Concepto</th>
                <th scope="col">Total</th>
                <th scope="col">Pagado</th>
                <th scope="col">Saldo</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="9">
                  <EmptyState
                    icon="credit-card"
                    title={query ? 'No hay coincidencias disponibles' : 'No hay facturas para mostrar'}
                    text="El listado y los valores aparecerán cuando el backend disponga de recursos financieros reales."
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel section billing-detail" aria-labelledby="billing-detail-heading">
        <div className="module-section-heading">
          <div>
            <h2 className="panel__title" id="billing-detail-heading">Detalle de factura</h2>
            <p className="module-muted">El detalle, saldo y registro de pagos se habilitarán con el API financiero.</p>
          </div>
          <button type="button" className="btn btn--secondary" disabled title="Pendiente de endpoint de pagos">Registrar pago</button>
        </div>
        <EmptyState
          icon="file-text"
          title="Selecciona una factura"
          text="No hay registros reales para consultar."
        />
      </section>
    </>
  );
}
