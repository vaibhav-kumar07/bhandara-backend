import { ObjectId } from 'mongodb';
import { DonationModel } from '../models/donation.model';
import { DonorModel } from '../models/donor.model';
import { BhandaraModel } from '../models/bhandara.model';
import { validateAmount, isValidObjectId, isBhandaraLocked } from '../utils/utils';
import { PAYMENT_STATUS, PAYMENT_MODE } from '../config/constants';
import { AdminSession, isSuperAdmin } from '../utils/auth';

export interface CreateDonationRequest {
  donorId: string;
  bhandaraId: string;
  amount: number;
  paymentMode: typeof PAYMENT_MODE.CASH | typeof PAYMENT_MODE.UPI;
}

export interface UpdateDonationRequest {
  amount?: number;
  paymentMode?: typeof PAYMENT_MODE.CASH | typeof PAYMENT_MODE.UPI;
  note: string;
}

export interface DonationResponse {
  id: string;
  donor: {
    id: string;
    donorName: string;
    fatherName?: string;
  };
  bhandara: {
    id: string;
    name: string;
    date: string;
    isLocked?: boolean;
  };
  amount: number;
  paymentStatus: typeof PAYMENT_STATUS.PENDING | typeof PAYMENT_STATUS.DONE;
  paymentMode: typeof PAYMENT_MODE.CASH | typeof PAYMENT_MODE.UPI | typeof PAYMENT_MODE.BANK;
  date: string;
  note?: string;
  admin: {
    id: string;
    username: string;
  };
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export class DonationService {
  static async createDonation(request: CreateDonationRequest, admin: AdminSession): Promise<DonationResponse> {
    if (!isValidObjectId(request.donorId)) {
      throw new Error('Invalid donor ID');
    }
    if (!isValidObjectId(request.bhandaraId)) {
      throw new Error('Invalid bhandara ID');
    }
    if (!validateAmount(request.amount)) {
      throw new Error('Invalid amount');
    }
    if (!Object.values(PAYMENT_MODE).includes(request.paymentMode)) {
      throw new Error('Invalid payment mode');
    }

    const donor = await DonorModel.findById(request.donorId);
    if (!donor) {
      throw new Error('Donor not found');
    }

    const bhandara = await BhandaraModel.findById(request.bhandaraId);
    if (!bhandara) {
      throw new Error('Bhandara not found');
    }

    if (isBhandaraLocked(bhandara.date)) {
      throw new Error('Bhandara is locked. Cannot add donations after the event date.');
    }

    const donationId = await DonationModel.create({
      donor: new ObjectId(request.donorId),
      bhandara: new ObjectId(request.bhandaraId),
      amount: request.amount,
      paymentStatus: PAYMENT_STATUS.DONE,
      paymentMode: request.paymentMode,
      date: new Date(),
      admin: new ObjectId(admin.id)
    });

    const donations = await DonationModel.findAllPopulated();
    const donation = donations.find(d => d._id.toString() === donationId.toString());
    
    if (!donation) {
      throw new Error('Failed to create donation');
    }

    return this.formatDonationResponse(donation);
  }

  static async getAllDonations(): Promise<DonationResponse[]> {
    const donations = await DonationModel.findAllPopulated();
    return donations.map(donation => this.formatDonationResponse(donation));
  }

  static async getDonationsByBhandara(bhandaraId: string): Promise<DonationResponse[]> {
    if (!isValidObjectId(bhandaraId)) {
      throw new Error('Invalid bhandara ID');
    }

    const donations = await DonationModel.findByBhandaraPopulated(bhandaraId);
    return donations.map(donation => this.formatDonationResponse(donation));
  }

  static async getDonationsByDonor(donorId: string): Promise<DonationResponse[]> {
    if (!isValidObjectId(donorId)) {
      throw new Error('Invalid donor ID');
    }

    const donations = await DonationModel.findByDonorPopulated(donorId);
    return donations.map(donation => this.formatDonationResponse(donation));
  }

  static async getDonationById(id: string): Promise<DonationResponse | null> {
    if (!isValidObjectId(id)) {
      throw new Error('Invalid donation ID');
    }

    const donations = await DonationModel.findAllPopulated();
    const donation = donations.find(d => d._id.toString() === id);
    
    if (!donation) return null;
    return this.formatDonationResponse(donation);
  }

  static async updateDonation(id: string, request: UpdateDonationRequest, admin: AdminSession): Promise<DonationResponse> {
    if (!isValidObjectId(id)) {
      throw new Error('Invalid donation ID');
    }

    if (!request.note || request.note.trim().length < 5) {
      throw new Error('Note is mandatory and must be at least 5 characters');
    }

    if (request.amount !== undefined && !validateAmount(request.amount)) {
      throw new Error('Invalid amount');
    }

    if (request.paymentMode && !Object.values(PAYMENT_MODE).includes(request.paymentMode)) {
      throw new Error('Invalid payment mode');
    }

    const existing = await DonationModel.findById(id);
    if (!existing) {
      throw new Error('Donation not found');
    }

    const bhandara = await BhandaraModel.findById(existing.bhandara.toString());
    if (!bhandara) {
      throw new Error('Bhandara not found');
    }

    if (isBhandaraLocked(bhandara.date)) {
      throw new Error('Bhandara is locked. Cannot update donations after the event date.');
    }

    if (existing.isLocked && !isSuperAdmin(admin)) {
      throw new Error('Donation is locked. Only super-admin can modify locked donations.');
    }

    const updated = await DonationModel.update(id, {
      ...(request.amount !== undefined && { amount: request.amount }),
      paymentStatus: PAYMENT_STATUS.DONE,
      ...(request.paymentMode && { paymentMode: request.paymentMode }),
      note: request.note
    }, new ObjectId(admin.id));

    if (!updated) {
      throw new Error('Failed to update donation');
    }

    const donations = await DonationModel.findAllPopulated();
    const donation = donations.find(d => d._id.toString() === id);
    
    if (!donation) {
      throw new Error('Failed to fetch updated donation');
    }

    return this.formatDonationResponse(donation);
  }

  private static formatDonationResponse(donation: any): DonationResponse {
    const bhandaraDate = donation.bhandaraData.date.toISOString().split('T')[0];
    const isBhandaraDateLocked = isBhandaraLocked(donation.bhandaraData.date);
    
    return {
      id: donation._id.toString(),
      donor: {
        id: donation.donorData._id.toString(),
        donorName: donation.donorData.donorName,
        fatherName: donation.donorData.fatherName
      },
      bhandara: {
        id: donation.bhandaraData._id.toString(),
        name: donation.bhandaraData.name,
        date: bhandaraDate,
        isLocked: isBhandaraDateLocked
      },
      amount: donation.amount,
      paymentStatus: donation.paymentStatus,
      paymentMode: donation.paymentMode,
      date: donation.date.toISOString().split('T')[0],
      note: donation.note,
      admin: {
        id: donation.adminData._id.toString(),
        username: donation.adminData.username
      },
      isLocked: donation.isLocked,
      createdAt: donation.createdAt.toISOString(),
      updatedAt: donation.updatedAt.toISOString()
    };
  }
}

