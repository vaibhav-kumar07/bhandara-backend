import { z } from 'zod';
import { ADMIN_ROLE } from '../config/constants';

export const createAdminBodySchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .trim(),
  pin: z
    .string()
    .length(5, 'PIN must be exactly 5 digits')
    .regex(/^\d{5}$/, 'PIN must contain exactly 5 digits'),
  role: z
    .enum([ADMIN_ROLE.ADMIN, ADMIN_ROLE.SUPER_ADMIN])
    .optional()
    .default(ADMIN_ROLE.ADMIN)
});

export const loginAdminBodySchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .trim(),
  pin: z
    .string()
    .length(5, 'PIN must be exactly 5 digits')
    .regex(/^\d{5}$/, 'PIN must contain exactly 5 digits')
});

