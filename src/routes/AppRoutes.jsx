import { Route, Routes } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout.jsx';
import AppointmentsPage from '../modules/citas/AppointmentsPage.jsx';
import BillingPage from '../modules/facturacion/BillingPage.jsx';
import ClinicalHistoryPage from '../modules/historia-clinica/ClinicalHistoryPage.jsx';
import NotificationsPage from '../modules/notificaciones/NotificationsPage.jsx';
import OdontogramPage from '../modules/odontograma/OdontogramPage.jsx';
import PatientsPage from '../modules/pacientes/PatientsPage.jsx';
import AuditPage from '../modules/auditoria/AuditPage.jsx';
import ClinicsPage from '../modules/clinicas/ClinicsPage.jsx';
import RegisterClinicPage from '../modules/clinicas/RegisterClinicPage.jsx';
import RolesPage from '../modules/roles/RolesPage.jsx';
import CreateUserPage from '../modules/usuarios/CreateUserPage.jsx';
import UsersPage from '../modules/usuarios/UsersPage.jsx';
import ForcedPasswordChangePage from '../pages/ForcedPasswordChangePage.jsx';
import ForgotPasswordPage from '../pages/ForgotPasswordPage.jsx';
import HomePage from '../pages/HomePage.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import MfaPage from '../pages/MfaPage.jsx';
import MyClinicalHistoryPage from '../pages/MyClinicalHistoryPage.jsx';
import MyPatientProfilePage from '../pages/MyPatientProfilePage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import RegisterPatientPage from '../pages/RegisterPatientPage.jsx';
import SettingsPage from '../pages/SettingsPage.jsx';
import { PERMISSIONS } from '../utils/permissions.js';
import { GuestRoute, ProtectedRoute, RequirePermission } from './guards.jsx';
import { CLINICAL_MODULES } from './navigation.js';

const CLINICAL_PAGES = {
  pacientes: PatientsPage,
  citas: AppointmentsPage,
  historia: ClinicalHistoryPage,
  odontograma: OdontogramPage,
  facturacion: BillingPage,
  notificaciones: NotificationsPage,
};

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/registro-clinica" element={<RegisterClinicPage />} />
      <Route path="/registro" element={<RegisterPatientPage />} />

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verificar-mfa" element={<MfaPage />} />
        <Route path="/recuperar" element={<ForgotPasswordPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/cambiar-contrasena" element={<ForcedPasswordChangePage />} />

        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />

          <Route element={<RequirePermission permission={PERMISSIONS.USERS_VIEW} />}>
            <Route path="usuarios" element={<UsersPage />} />
            <Route path="roles" element={<RolesPage />} />
          </Route>
          <Route element={<RequirePermission permission={PERMISSIONS.USERS_CREATE} />}>
            <Route path="usuarios/nuevo" element={<CreateUserPage />} />
          </Route>
          <Route element={<RequirePermission permission={PERMISSIONS.AUDIT_VIEW} />}>
            <Route path="auditoria" element={<AuditPage />} />
          </Route>
          <Route element={<RequirePermission permission={PERMISSIONS.CLINICS_REVIEW} strict />}>
            <Route path="clinicas" element={<ClinicsPage />} />
          </Route>

          <Route element={<RequirePermission permission={PERMISSIONS.PATIENTS_SELF} strict />}>
            <Route path="mi-perfil" element={<MyPatientProfilePage />} />
          </Route>
          <Route element={<RequirePermission permission={PERMISSIONS.CLINICAL_HISTORY_SELF} strict />}>
            <Route path="mi-historia" element={<MyClinicalHistoryPage />} />
          </Route>

          {CLINICAL_MODULES.map((module) => {
            const Page = CLINICAL_PAGES[module.id];
            return (
              <Route key={module.id} element={<RequirePermission permission={module.permission} strict />}>
                <Route path={module.path.slice(1)} element={<Page />} />
              </Route>
            );
          })}

          <Route path="configuracion" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
