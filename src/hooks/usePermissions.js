import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { assignableRoles, can, canAny, roleChangeAccess } from '../utils/permissions.js';

/** Acceso reutilizable a las comprobaciones de autorización del usuario autenticado. */
export function usePermissions() {
  const { user } = useAuth();

  return useMemo(
    () => ({
      user,
      role: user?.role_name ?? null,
      can: (permission) => can(user, permission),
      canAny: (permissions) => canAny(user, permissions),
      assignableRoles: assignableRoles(user),
      roleChangeAccess: (target) => roleChangeAccess(user, target),
    }),
    [user],
  );
}
