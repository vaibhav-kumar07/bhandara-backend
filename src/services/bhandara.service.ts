import { BhandaraModel } from '../models/bhandara.model';
import { DonationModel } from '../models/donation.model';
import { sanitizeString, isBhandaraLocked, isValidObjectId } from '../utils/utils';
import { BHANDARA_STATUS } from '../config/constants';

export interface CreateBhandaraRequest {
  name: string;
  date: string;
}

export interface UpdateBhandaraRequest {
  name?: string;
  date?: string;
}

export interface BhandaraResponse {
  id: string;
  name: string;
  date: string;
  status: typeof BHANDARA_STATUS.ACTIVE | typeof BHANDARA_STATUS.CLOSED;
  createdAt: string;
  isLocked?: boolean;
}

export class BhandaraService {
  static async createBhandara(request: CreateBhandaraRequest): Promise<BhandaraResponse> {
    const sanitized = sanitizeString(request.name);
    const name = sanitized.charAt(0).toUpperCase() + sanitized.slice(1).toLowerCase();

    if (!name || name.length < 3) {
      throw new Error('Bhandara name must be at least 3 characters');
    }

    const date = new Date(request.date);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format');
    }

    const bhandaraId = await BhandaraModel.create({
      name,
      date
    });

    const bhandara = await BhandaraModel.findById(bhandaraId.toString());
    if (!bhandara) {
      throw new Error('Failed to create bhandara');
    }

    const dateStr = bhandara.date.toISOString().split('T')[0];
    return {
      id: bhandara._id!.toString(),
      name: bhandara.name,
      date: dateStr,
      status: bhandara.status,
      createdAt: bhandara.createdAt.toISOString(),
      isLocked: isBhandaraLocked(bhandara.date)
    };
  }

  static async getAllBhandaras(): Promise<BhandaraResponse[]> {
    const bhandaras = await BhandaraModel.findAll();
    return bhandaras.map(bhandara => {
      const dateStr = bhandara.date.toISOString().split('T')[0];
      return {
        id: bhandara._id!.toString(),
        name: bhandara.name,
        date: dateStr,
        status: bhandara.status,
        createdAt: bhandara.createdAt.toISOString(),
        isLocked: isBhandaraLocked(bhandara.date)
      };
    });
  }

  static async getBhandaraById(id: string): Promise<BhandaraResponse | null> {
    const bhandara = await BhandaraModel.findById(id);
    if (!bhandara) return null;

    const dateStr = bhandara.date.toISOString().split('T')[0];
    return {
      id: bhandara._id!.toString(),
      name: bhandara.name,
      date: dateStr,
      status: bhandara.status,
      createdAt: bhandara.createdAt.toISOString(),
      isLocked: isBhandaraLocked(bhandara.date)
    };
  }

  static async updateBhandara(id: string, request: UpdateBhandaraRequest): Promise<BhandaraResponse> {
    const existing = await BhandaraModel.findById(id);
    if (!existing) {
      throw new Error('Bhandara not found');
    }
    
    if (isBhandaraLocked(existing.date)) {
      throw new Error('Bhandara is locked. Cannot update information after the event date.');
    }

    const updateData: { name?: string; date?: Date } = {};

    if (request.name !== undefined) {
      const sanitized = sanitizeString(request.name);
      const name = sanitized.charAt(0).toUpperCase() + sanitized.slice(1).toLowerCase();
      if (!name || name.length < 3) {
        throw new Error('Bhandara name must be at least 3 characters');
      }
      updateData.name = name;
    }

    if (request.date !== undefined) {
      const date = new Date(request.date);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format');
      }
      updateData.date = date;
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('No fields to update');
    }

    const updated = await BhandaraModel.update(id, updateData);
    if (!updated) {
      throw new Error('Bhandara not found or no changes made');
    }

    const bhandara = await BhandaraModel.findById(id);
    if (!bhandara) {
      throw new Error('Failed to fetch updated bhandara');
    }

    const dateStr = bhandara.date.toISOString().split('T')[0];
    return {
      id: bhandara._id!.toString(),
      name: bhandara.name,
      date: dateStr,
      status: bhandara.status,
      createdAt: bhandara.createdAt.toISOString(),
      isLocked: isBhandaraLocked(bhandara.date)
    };
  }

  static async deleteBhandara(id: string): Promise<void> {
    if (!isValidObjectId(id)) {
      throw new Error('Invalid bhandara ID');
    }

    const bhandara = await BhandaraModel.findById(id);
    if (!bhandara) {
      throw new Error('Bhandara not found');
    }

    const donations = await DonationModel.findByBhandara(id);
    if (donations.length > 0) {
      throw new Error('Cannot delete bhandara. There are donations associated with this bhandara.');
    }

    const deleted = await BhandaraModel.delete(id);
    if (!deleted) {
      throw new Error('Failed to delete bhandara');
    }
  }
}

