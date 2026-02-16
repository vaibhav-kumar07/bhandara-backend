import { DonorModel } from '../models/donor.model';
import { sanitizeString } from '../utils/utils';

export interface CreateDonorRequest {
  donorName: string;
  fatherName?: string;
}

export interface DonorResponse {
  id: string;
  donorName: string;
  fatherName?: string;
  createdAt: string;
}

export class DonorService {
  static async createDonor(request: CreateDonorRequest): Promise<DonorResponse> {
    const donorName = sanitizeString(request.donorName);
    const fatherName = request.fatherName ? sanitizeString(request.fatherName) : undefined;

    if (!donorName || donorName.length < 2) {
      throw new Error('Donor name must be at least 2 characters');
    }
    if (fatherName && fatherName.length < 2) {
      throw new Error('Father name must be at least 2 characters if provided');
    }

    const donorId = await DonorModel.create({
      donorName,
      ...(fatherName && { fatherName })
    });

    const donor = await DonorModel.findById(donorId.toString());
    if (!donor) {
      throw new Error('Failed to create donor');
    }

    return {
      id: donor._id!.toString(),
      donorName: donor.donorName,
      fatherName: donor.fatherName,
      createdAt: donor.createdAt.toISOString()
    };
  }

  static async getAllDonors(): Promise<DonorResponse[]> {
    const donors = await DonorModel.findAll();
    return donors.map(donor => ({
      id: donor._id!.toString(),
      donorName: donor.donorName,
      fatherName: donor.fatherName,
      createdAt: donor.createdAt.toISOString()
    }));
  }

  static async getDonorById(id: string): Promise<DonorResponse | null> {
    const donor = await DonorModel.findById(id);
    if (!donor) return null;

    return {
      id: donor._id!.toString(),
      donorName: donor.donorName,
      fatherName: donor.fatherName,
      createdAt: donor.createdAt.toISOString()
    };
  }

  static async updateDonor(id: string, request: { donorName?: string; fatherName?: string | null }): Promise<DonorResponse> {
    const updateData: { donorName?: string; fatherName?: string } = {};

    if (request.donorName !== undefined) {
      const donorName = sanitizeString(request.donorName);
      if (!donorName || donorName.length < 2) {
        throw new Error('Donor name must be at least 2 characters');
      }
      updateData.donorName = donorName;
    }

    if (request.fatherName !== undefined) {
      if (request.fatherName === '' || request.fatherName === null) {
        updateData.fatherName = undefined;
      } else {
        const fatherName = sanitizeString(request.fatherName);
        if (fatherName.length < 2) {
          throw new Error('Father name must be at least 2 characters if provided');
        }
        updateData.fatherName = fatherName;
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('No fields to update');
    }

    const updated = await DonorModel.update(id, updateData);
    if (!updated) {
      throw new Error('Donor not found or no changes made');
    }

    const donor = await DonorModel.findById(id);
    if (!donor) {
      throw new Error('Failed to fetch updated donor');
    }

    return {
      id: donor._id!.toString(),
      donorName: donor.donorName,
      fatherName: donor.fatherName,
      createdAt: donor.createdAt.toISOString()
    };
  }
}

