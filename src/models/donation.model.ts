import { Collection, ObjectId } from 'mongodb';
import { getDatabase } from '../config/database';
import { COLLECTIONS, PAYMENT_STATUS } from '../config/constants';

export interface Donation {
  _id?: ObjectId;
  donor: ObjectId;
  bhandara: ObjectId;
  amount: number;
  paymentStatus: typeof PAYMENT_STATUS.PENDING | typeof PAYMENT_STATUS.DONE;
  paymentMode: 'cash' | 'upi' | 'bank';
  date: Date;
  note?: string;
  admin: ObjectId;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class DonationModel {
  private static getCollection(): Collection<Donation> {
    return getDatabase().collection<Donation>(COLLECTIONS.DONATIONS);
  }

  static async create(donation: Omit<Donation, '_id' | 'createdAt' | 'updatedAt' | 'isLocked'>): Promise<ObjectId> {
    const collection = this.getCollection();
    const newDonation: Donation = {
      ...donation,
      isLocked: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await collection.insertOne(newDonation);
    return result.insertedId;
  }

  static async findById(id: string): Promise<Donation | null> {
    const collection = this.getCollection();
    return await collection.findOne({ _id: new ObjectId(id) });
  }

  static async findAll(): Promise<Donation[]> {
    const collection = this.getCollection();
    return await collection.find({}).sort({ date: -1 }).toArray();
  }

  static async findByBhandara(bhandaraId: string): Promise<Donation[]> {
    const collection = this.getCollection();
    return await collection.find({ bhandara: new ObjectId(bhandaraId) }).sort({ date: -1 }).toArray();
  }

  static async findByDonor(donorId: string): Promise<Donation[]> {
    const collection = this.getCollection();
    return await collection.find({ donor: new ObjectId(donorId) }).sort({ date: -1 }).toArray();
  }

  static async update(id: string, updates: Partial<Donation>, adminId: ObjectId): Promise<boolean> {
    const collection = this.getCollection();
    
    const existing = await this.findById(id);
    if (!existing) return false;
    if (existing.isLocked) return false;

    const updateData = {
      ...updates,
      updatedAt: new Date(),
      admin: adminId
    };

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    return result.modifiedCount > 0;
  }

  static async unlock(id: string): Promise<boolean> {
    const collection = this.getCollection();
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isLocked: false, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  static async findAllPopulated(): Promise<any[]> {
    const collection = this.getCollection();
    return await collection.aggregate([
      {
        $lookup: {
          from: COLLECTIONS.DONORS,
          localField: 'donor',
          foreignField: '_id',
          as: 'donorData'
        }
      },
      {
        $lookup: {
          from: COLLECTIONS.BHANDARAS,
          localField: 'bhandara',
          foreignField: '_id',
          as: 'bhandaraData'
        }
      },
      {
        $lookup: {
          from: COLLECTIONS.ADMINS,
          localField: 'admin',
          foreignField: '_id',
          as: 'adminData'
        }
      },
      {
        $unwind: '$donorData'
      },
      {
        $unwind: '$bhandaraData'
      },
      {
        $unwind: '$adminData'
      },
      {
        $sort: { date: -1 }
      }
    ]).toArray();
  }

  static async findByBhandaraPopulated(bhandaraId: string): Promise<any[]> {
    const collection = this.getCollection();
    return await collection.aggregate([
      {
        $match: { bhandara: new ObjectId(bhandaraId) }
      },
      {
        $lookup: {
          from: COLLECTIONS.DONORS,
          localField: 'donor',
          foreignField: '_id',
          as: 'donorData'
        }
      },
      {
        $lookup: {
          from: COLLECTIONS.BHANDARAS,
          localField: 'bhandara',
          foreignField: '_id',
          as: 'bhandaraData'
        }
      },
      {
        $lookup: {
          from: COLLECTIONS.ADMINS,
          localField: 'admin',
          foreignField: '_id',
          as: 'adminData'
        }
      },
      {
        $unwind: '$donorData'
      },
      {
        $unwind: '$bhandaraData'
      },
      {
        $unwind: '$adminData'
      },
      {
        $sort: { date: -1 }
      }
    ]).toArray();
  }

  static async findByDonorPopulated(donorId: string): Promise<any[]> {
    const collection = this.getCollection();
    return await collection.aggregate([
      {
        $match: { donor: new ObjectId(donorId) }
      },
      {
        $lookup: {
          from: COLLECTIONS.DONORS,
          localField: 'donor',
          foreignField: '_id',
          as: 'donorData'
        }
      },
      {
        $lookup: {
          from: COLLECTIONS.BHANDARAS,
          localField: 'bhandara',
          foreignField: '_id',
          as: 'bhandaraData'
        }
      },
      {
        $lookup: {
          from: COLLECTIONS.ADMINS,
          localField: 'admin',
          foreignField: '_id',
          as: 'adminData'
        }
      },
      {
        $unwind: '$donorData'
      },
      {
        $unwind: '$bhandaraData'
      },
      {
        $unwind: '$adminData'
      },
      {
        $sort: { date: -1 }
      }
    ]).toArray();
  }
}

