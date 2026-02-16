import { z } from 'zod';
import { PAYMENT_MODE } from '../config/constants';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const createDonationBodySchema = z.object({
  donorId: objectIdSchema,
  bhandaraId: objectIdSchema,
  amount: z
    .number()
    .positive('Amount must be positive')
    .finite('Amount must be a finite number')
    .refine((val) => val > 0, 'Amount must be greater than 0'),
  paymentMode: z.enum([PAYMENT_MODE.CASH, PAYMENT_MODE.UPI])
});

export const updateDonationBodySchema = z.object({
  amount: z
    .number()
    .positive('Amount must be positive')
    .finite('Amount must be a finite number')
    .optional(),
  paymentMode: z.enum([PAYMENT_MODE.CASH, PAYMENT_MODE.UPI]).optional(),
  note: z
    .string()
    .min(5, 'Note is mandatory and must be at least 5 characters')
    .max(1000, 'Note must be at most 1000 characters')
    .trim()
});

export const donationIdParamSchema = z.object({
  id: objectIdSchema
});

export const bulkUploadDonationsBodySchema = z.object({
  donorData: z.array(
    z.object({
      firstName: z.string().min(1, 'First name is required').trim(),
      lastName: z.string().trim().optional(),
      amount: z.number().min(0, 'Amount must be non-negative').finite(),
      rowNumber: z.number().int().positive()
    })
  ).min(1, 'At least one donor record is required'),
  bhandaraId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid bhandara ID')
});

