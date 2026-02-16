import { z } from 'zod';

export const createDonorBodySchema = z.object({
  donorName: z
    .string()
    .min(2, 'Donor name must be at least 2 characters')
    .max(200, 'Donor name must be at most 200 characters')
    .trim(),
  fatherName: z
    .string()
    .min(2, 'Father name must be at least 2 characters')
    .max(200, 'Father name must be at most 200 characters')
    .trim()
    .optional()
});

export const updateDonorBodySchema = z.object({
  donorName: z
    .string()
    .min(2, 'Donor name must be at least 2 characters')
    .max(200, 'Donor name must be at most 200 characters')
    .trim()
    .optional(),
  fatherName: z
    .string()
    .min(2, 'Father name must be at least 2 characters')
    .max(200, 'Father name must be at most 200 characters')
    .trim()
    .nullable()
    .optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field (donorName or fatherName) must be provided'
});

export const donorIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid donor ID')
});

