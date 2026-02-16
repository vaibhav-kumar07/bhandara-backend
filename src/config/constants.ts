export const PAYMENT_STATUS = {
  PENDING: 'pending',
  DONE: 'done'
} as const;

export const PAYMENT_MODE = {
  CASH: 'cash',
  UPI: 'upi',
  BANK: 'bank'
} as const;

export const BHANDARA_STATUS = {
  ACTIVE: 'active',
  CLOSED: 'closed'
} as const;

export const ADMIN_ROLE = {
  ADMIN: 'admin',
  SUPER_ADMIN: 'super-admin'
} as const;

export const COLLECTIONS = {
  DONORS: 'donors',
  BHANDARAS: 'bhandaras',
  DONATIONS: 'donations',
  ADMINS: 'admins'
} as const;

