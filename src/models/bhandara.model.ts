import { Collection, ObjectId } from 'mongodb';
import { getDatabase } from '../config/database';
import { COLLECTIONS, BHANDARA_STATUS } from '../config/constants';

export interface Bhandara {
  _id?: ObjectId;
  name: string;
  date: Date;
  status: typeof BHANDARA_STATUS.ACTIVE | typeof BHANDARA_STATUS.CLOSED;
  createdAt: Date;
}

export class BhandaraModel {
  private static getCollection(): Collection<Bhandara> {
    return getDatabase().collection<Bhandara>(COLLECTIONS.BHANDARAS);
  }

  static async create(bhandara: Omit<Bhandara, '_id' | 'createdAt' | 'status'>): Promise<ObjectId> {
    const collection = this.getCollection();
    const newBhandara: Bhandara = {
      ...bhandara,
      status: BHANDARA_STATUS.ACTIVE,
      createdAt: new Date()
    };
    
    const result = await collection.insertOne(newBhandara);
    return result.insertedId;
  }

  static async findById(id: string): Promise<Bhandara | null> {
    const collection = this.getCollection();
    return await collection.findOne({ _id: new ObjectId(id) });
  }

  static async findAll(): Promise<Bhandara[]> {
    const collection = this.getCollection();
    return await collection.find({}).sort({ date: -1 }).toArray();
  }

  static async findActive(): Promise<Bhandara[]> {
    const collection = this.getCollection();
    return await collection.find({ status: BHANDARA_STATUS.ACTIVE }).sort({ date: -1 }).toArray();
  }

  static async updateStatus(id: string, status: typeof BHANDARA_STATUS.ACTIVE | typeof BHANDARA_STATUS.CLOSED): Promise<boolean> {
    const collection = this.getCollection();
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status } }
    );
    return result.modifiedCount > 0;
  }

  static async update(id: string, updates: { name?: string; date?: Date }): Promise<boolean> {
    const collection = this.getCollection();
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.date !== undefined) updateData.date = updates.date;
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    return result.modifiedCount > 0;
  }

  static async delete(id: string): Promise<boolean> {
    const collection = this.getCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }
}

