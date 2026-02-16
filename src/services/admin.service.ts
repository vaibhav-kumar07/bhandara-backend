import bcrypt from 'bcryptjs';
import { AdminModel } from '../models/admin.model';
import { ADMIN_ROLE } from '../config/constants';

export interface CreateAdminRequest {
  username: string;
  pin: string;
  role?: typeof ADMIN_ROLE.ADMIN | typeof ADMIN_ROLE.SUPER_ADMIN;
}

export interface AdminResponse {
  id: string;
  username: string;
  role: typeof ADMIN_ROLE.ADMIN | typeof ADMIN_ROLE.SUPER_ADMIN;
  createdAt: string;
}

export class AdminService {
  static async createAdmin(request: CreateAdminRequest): Promise<AdminResponse> {
    const username = request.username.trim().toUpperCase();

    const existingAdmin = await AdminModel.findByUsername(username);
    if (existingAdmin) {
      throw new Error('Username already exists');
    }

    const saltRounds = 12;
    const hashedPin = await bcrypt.hash(request.pin, saltRounds);

    const adminId = await AdminModel.create({
      username,
      pin: hashedPin,
      role: request.role || ADMIN_ROLE.ADMIN
    });

    const admin = await AdminModel.findById(adminId.toString());
    if (!admin) {
      throw new Error('Failed to create admin');
    }

    return {
      id: admin._id!.toString(),
      username: admin.username,
      role: admin.role as typeof ADMIN_ROLE.ADMIN | typeof ADMIN_ROLE.SUPER_ADMIN,
      createdAt: admin.createdAt.toISOString()
    };
  }

  static async verifyAdmin(username: string, pin: string): Promise<AdminResponse | null> {
    const usernameUpper = username.trim().toUpperCase();
    
    const admin = await AdminModel.findByUsername(usernameUpper);
    if (!admin) {
      return null;
    }

    const isPinValid = await bcrypt.compare(pin, admin.pin);
    if (!isPinValid) {
      return null;
    }

    return {
      id: admin._id!.toString(),
      username: admin.username,
      role: admin.role as typeof ADMIN_ROLE.ADMIN | typeof ADMIN_ROLE.SUPER_ADMIN,
      createdAt: admin.createdAt.toISOString()
    };
  }

  static async getAdminById(id: string): Promise<AdminResponse | null> {
    const admin = await AdminModel.findById(id);
    if (!admin) return null;

    return {
      id: admin._id!.toString(),
      username: admin.username,
      role: admin.role as typeof ADMIN_ROLE.ADMIN | typeof ADMIN_ROLE.SUPER_ADMIN,
      createdAt: admin.createdAt.toISOString()
    };
  }
}

