import { ADMIN_ROLE } from '../config/constants';

export interface AdminSession {
  id: string;
  username: string;
  role: typeof ADMIN_ROLE.ADMIN | typeof ADMIN_ROLE.SUPER_ADMIN;
}

export function isSuperAdmin(admin: AdminSession): boolean {
  return admin.role === ADMIN_ROLE.SUPER_ADMIN;
}

