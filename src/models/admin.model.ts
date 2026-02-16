import { Collection, ObjectId } from 'mongodb';
import { getDatabase } from '../config/database';
import { COLLECTIONS } from '../config/constants';

export interface Admin {
  _id?: ObjectId;
  username: string;
  pin: string; // Hashed PIN
  role: typeof COLLECTIONS.ADMINS extends string ? string : 'admin' | 'super-admin';
  createdAt: Date;
}

export class AdminModel {
  private static getCollection(): Collection<Admin> {
    return getDatabase().collection<Admin>(COLLECTIONS.ADMINS);
  }

  static async create(admin: Omit<Admin, '_id' | 'createdAt'>): Promise<ObjectId> {
    const collection = this.getCollection();
    const newAdmin: Admin = {
      ...admin,
      createdAt: new Date()
    };
    
    const result = await collection.insertOne(newAdmin);
    return result.insertedId;
  }

  static async findById(id: string): Promise<Admin | null> {
    const collection = this.getCollection();
    return await collection.findOne({ _id: new ObjectId(id) });
  }

  static async findAll(): Promise<Admin[]> {
    const collection = this.getCollection();
    return await collection.find({}).sort({ createdAt: -1 }).toArray();
  }

  static async findByUsername(username: string): Promise<Admin | null> {
    const collection = this.getCollection();
    return await collection.findOne({ username });
  }
}

