import type { UserRole } from '@/db/schema';

import { useAuth } from '../auth-context';

type Props = {
  role: UserRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

/**
 * Render `children` only when the signed-in user has `role`. Use it to gate
 * admin-only sections/controls. Navigation also hides admin routes, but this is
 * the in-component guard for finer-grained access.
 */
export const RoleGate = ({ role, children, fallback = null }: Props) => {
  const { hasRole } = useAuth();
  return <>{hasRole(role) ? children : fallback}</>;
};
