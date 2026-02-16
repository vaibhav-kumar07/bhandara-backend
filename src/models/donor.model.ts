import { Collection, ObjectId } from 'mongodb';
import { getDatabase } from '../config/database';
import { COLLECTIONS } from '../config/constants';

export interface Donor {
  _id?: ObjectId;
  donorName: string;
  fatherName?: string;
  createdAt: Date;
}

export class DonorModel {
  private static getCollection(): Collection<Donor> {
    return getDatabase().collection<Donor>(COLLECTIONS.DONORS);
  }

  static async create(donor: Omit<Donor, '_id' | 'createdAt'>): Promise<ObjectId> {
    const collection = this.getCollection();
    const newDonor: Donor = {
      ...donor,
      createdAt: new Date()
    };
    
    const result = await collection.insertOne(newDonor);
    return result.insertedId;
  }

  static async findById(id: string): Promise<Donor | null> {
    const collection = this.getCollection();
    return await collection.findOne({ _id: new ObjectId(id) });
  }

  static async findAll(): Promise<Donor[]> {
    const collection = this.getCollection();
    return await collection.find({}).sort({ donorName: 1 }).toArray();
  }

  static async findByNameCombination(donorName: string, fatherName?: string): Promise<Donor[]> {
    const collection = this.getCollection();
    const query: any = {
      donorName: { $regex: new RegExp(donorName, 'i') }
    };
    if (fatherName) {
      query.fatherName = { $regex: new RegExp(fatherName, 'i') };
    } else {
      query.$or = [
        { fatherName: { $exists: false } },
        { fatherName: '' },
        { fatherName: null }
      ];
    }
    return await collection.find(query).toArray();
  }

  static async update(id: string, updates: { donorName?: string; fatherName?: string }): Promise<boolean> {
    const collection = this.getCollection();
    const setData: any = {};
    const unsetData: any = {};
    
    if (updates.donorName !== undefined) setData.donorName = updates.donorName;
    if (updates.fatherName !== undefined) {
      if (updates.fatherName === null || updates.fatherName === '') {
        unsetData.fatherName = '';
      } else {
        setData.fatherName = updates.fatherName;
      }
    }
    
    const updateOps: any = {};
    if (Object.keys(setData).length > 0) updateOps.$set = setData;
    if (Object.keys(unsetData).length > 0) updateOps.$unset = unsetData;
    
    if (Object.keys(updateOps).length === 0) return false;
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      updateOps
    );
    return result.modifiedCount > 0;
  }
}

