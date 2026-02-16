import { z } from 'zod';
import { BHANDARA_STATUS } from '../config/constants';

export const createBhandaraBodySchema = z.object({
  name: z
    .string()
    .min(3, 'Bhandara name must be at least 3 characters')
    .max(200, 'Bhandara name must be at most 200 characters')
    .trim(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      const d = new Date(date);
      return !isNaN(d.getTime());
    }, 'Invalid date format')
});

export const updateBhandaraBodySchema = z.object({
  name: z
    .string()
    .min(3, 'Bhandara name must be at least 3 characters')
    .max(200, 'Bhandara name must be at most 200 characters')
    .trim()
    .optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      const d = new Date(date);
      return !isNaN(d.getTime());
    }, 'Invalid date format')
    .optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field (name or date) must be provided'
});

export const bhandaraIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid bhandara ID')
});

export const updateBhandaraStatusBodySchema = z.object({
  status: z.enum([BHANDARA_STATUS.ACTIVE, BHANDARA_STATUS.CLOSED])
});

