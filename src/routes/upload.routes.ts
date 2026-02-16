import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { bulkUploadDonationsBodySchema } from '../validations/donation.schema';
import { getDatabase } from '../config/database';
import { COLLECTIONS, PAYMENT_MODE, PAYMENT_STATUS } from '../config/constants';
import { ObjectId } from 'mongodb';
import { BhandaraModel } from '../models/bhandara.model';
import { isBhandaraLocked } from '../utils/utils';

const router = Router();

router.post(
  '/excel',
  authenticateToken,
  validateBody(bulkUploadDonationsBodySchema),
  async (req: AuthRequest, res, _next) => {
    try {
      if (!req.admin) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const { donorData, bhandaraId } = req.body;

      const bhandara = await BhandaraModel.findById(bhandaraId);
      if (!bhandara) {
        res.status(404).json({
          success: false,
          message: 'Bhandara not found',
          results: { success: 0, failed: 0, errors: ['Bhandara not found'] }
        });
        return;
      }

      if (isBhandaraLocked(bhandara.date)) {
        res.status(400).json({
          success: false,
          message: 'Bhandara is locked',
          results: { success: 0, failed: 0, errors: ['Bhandara is locked. Cannot add donations after the event date.'] }
        });
        return;
      }

      if (!donorData || donorData.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No data provided',
          results: { success: 0, failed: 0, errors: ['No valid data to upload'] }
        });
        return;
      }

      const db = getDatabase();
      const donorsCollection = db.collection(COLLECTIONS.DONORS);
      const donationsCollection = db.collection(COLLECTIONS.DONATIONS);

      const errors: string[] = [];
      const donorMap = new Map<string, ObjectId>();
      const donorBulkOps: any[] = [];
      const uniqueDonors = new Map<string, { firstName: string; lastName: string; rowNumbers: number[] }>();

      for (const row of donorData) {
        const normalizedFirstName = (row.firstName || '').trim();
        const normalizedLastName = (row.lastName || '').trim();
        const key = `${normalizedFirstName.toLowerCase()}|||${normalizedLastName.toLowerCase()}`;
        
        if (!uniqueDonors.has(key)) {
          uniqueDonors.set(key, { 
            firstName: normalizedFirstName,
            lastName: normalizedLastName,
            rowNumbers: [row.rowNumber] 
          });
        } else {
          uniqueDonors.get(key)!.rowNumbers.push(row.rowNumber);
        }
      }

      if (uniqueDonors.size > 0) {
        try {
          const donorQueries = Array.from(uniqueDonors.values()).map(donor => {
            if (donor.lastName && donor.lastName.trim().length > 0) {
              return {
                donorName: donor.firstName,
                fatherName: donor.lastName
              };
            } else {
              return {
                donorName: donor.firstName,
                $or: [
                  { fatherName: { $exists: false } },
                  { fatherName: '' },
                  { fatherName: null }
                ]
              };
            }
          });
          
          const existingDonors = await donorsCollection.find({
            $or: donorQueries
          }).toArray();

          existingDonors.forEach(donor => {
            const normalizedFatherName = (donor.fatherName || '').trim().toLowerCase();
            const key = `${(donor.donorName || '').toLowerCase()}|||${normalizedFatherName}`;
            donorMap.set(key, donor._id);
          });
        } catch (findError: any) {
          console.error('Error finding existing donors:', findError);
          throw new Error(`Failed to find existing donors: ${findError.message}`);
        }
      }

      for (const [key, donor] of uniqueDonors.entries()) {
        if (!donorMap.has(key)) {
          const filter: any = { donorName: donor.firstName };
          const setOnInsert: any = {
            donorName: donor.firstName,
            createdAt: new Date()
          };
          
          if (donor.lastName && donor.lastName.trim().length > 0) {
            filter.fatherName = donor.lastName;
            setOnInsert.fatherName = donor.lastName;
          } else {
            filter.$or = [
              { fatherName: { $exists: false } },
              { fatherName: '' },
              { fatherName: null }
            ];
          }
          
          donorBulkOps.push({
            updateOne: {
              filter,
              update: {
                $setOnInsert: setOnInsert
              },
              upsert: true
            }
          });
        }
      }

      if (donorBulkOps.length > 0) {
        try {
          const donorResult = await donorsCollection.bulkWrite(donorBulkOps, { ordered: false });
          
          if (donorResult.upsertedCount > 0 && donorResult.upsertedIds) {
            const upsertedIds = Object.values(donorResult.upsertedIds).filter(id => id) as ObjectId[];
            if (upsertedIds.length > 0) {
              const newDonors = await donorsCollection.find({
                _id: { $in: upsertedIds }
              }).toArray();
              
              newDonors.forEach(donor => {
                const normalizedFatherName = (donor.fatherName || '').trim().toLowerCase();
                const key = `${(donor.donorName || '').toLowerCase()}|||${normalizedFatherName}`;
                donorMap.set(key, donor._id);
              });
            }
          }
        } catch (bulkError: any) {
          console.error('Error in bulk write for donors:', bulkError);
          throw new Error(`Failed to create donors: ${bulkError.message}`);
        }
      }

      if (uniqueDonors.size > 0) {
        try {
          const missingDonors = Array.from(uniqueDonors.entries())
            .filter(([key]) => !donorMap.has(key))
            .map(([, donor]) => donor);
          
          if (missingDonors.length > 0) {
            const donorQueries = missingDonors.map(donor => {
              if (donor.lastName && donor.lastName.trim().length > 0) {
                return {
                  donorName: donor.firstName,
                  fatherName: donor.lastName
                };
              } else {
                return {
                  donorName: donor.firstName,
                  $or: [
                    { fatherName: { $exists: false } },
                    { fatherName: '' },
                    { fatherName: null }
                  ]
                };
              }
            });
            
            if (donorQueries.length > 0) {
              const allDonors = await donorsCollection.find({
                $or: donorQueries
              }).toArray();

              allDonors.forEach(donor => {
                const normalizedFatherName = (donor.fatherName || '').trim().toLowerCase();
                const key = `${(donor.donorName || '').toLowerCase()}|||${normalizedFatherName}`;
                if (!donorMap.has(key)) {
                  donorMap.set(key, donor._id);
                }
              });
            }
          }
        } catch (findError: any) {
          console.error('Error in final donor fetch:', findError);
        }
      }

      const donationDocs: any[] = [];
      const adminId = new ObjectId(req.admin.id);
      const bhandaraObjectId = new ObjectId(bhandaraId);
      const now = new Date();
      
      let donorSuccessCount = 0;
      let donationSuccessCount = 0;

      for (const row of donorData) {
        const normalizedFirstName = (row.firstName || '').trim().toLowerCase();
        const normalizedLastName = (row.lastName || '').trim().toLowerCase();
        const key = `${normalizedFirstName}|||${normalizedLastName}`;
        const donorId = donorMap.get(key);
        
        if (!donorId) {
          errors.push(`Row ${row.rowNumber}: Failed to find or create donor "${row.firstName} ${row.lastName || '(no last name)'}"`);
          continue;
        }

        donorSuccessCount++;

        if (row.amount === 0) {
          continue;
        }

        donationDocs.push({
          donor: donorId,
          bhandara: bhandaraObjectId,
          amount: row.amount,
          paymentStatus: PAYMENT_STATUS.DONE,
          paymentMode: PAYMENT_MODE.CASH,
          date: now,
          admin: adminId,
          isLocked: false,
          createdAt: now,
          updatedAt: now
        });
      }

      if (donationDocs.length > 0) {
        try {
          const donationResult = await donationsCollection.insertMany(donationDocs, { ordered: false });
          donationSuccessCount = donationResult.insertedCount;
        } catch (error: any) {
          if (error.writeErrors) {
            donationSuccessCount = donationDocs.length - error.writeErrors.length;
            error.writeErrors.forEach((writeError: any) => {
              const originalRow = donorData[writeError.index];
              errors.push(`Row ${originalRow?.rowNumber || writeError.index + 1}: ${writeError.errmsg || 'Failed to create donation'}`);
            });
          } else {
            throw error;
          }
        }
      }

      const totalSuccess = donorSuccessCount;
      const totalDonations = donationSuccessCount;
      const uniqueDonorCount = uniqueDonors.size;
      const totalRows = donorData.length;
      const duplicateCount = totalRows - uniqueDonorCount;

      let message = `Processed ${totalRows} row${totalRows !== 1 ? 's' : ''}`;
      
      if (duplicateCount > 0) {
        message += ` (${duplicateCount} duplicate${duplicateCount !== 1 ? 's' : ''} found)`;
      }
      
      message += `, created ${uniqueDonorCount} unique donor${uniqueDonorCount !== 1 ? 's' : ''}`;
      
      if (totalDonations > 0) {
        message += `, ${totalDonations} donation${totalDonations !== 1 ? 's' : ''} created`;
      }
      
      if (errors.length > 0) {
        message += `, ${errors.length} error${errors.length !== 1 ? 's' : ''}`;
      }

      res.json({
        success: true,
        message,
        results: {
          success: totalSuccess,
          failed: errors.length,
          errors
        }
      });
    } catch (error: any) {
      console.error('Error processing bulk upload:', error);
      const errorMessage = error?.message || error?.toString() || 'Failed to process bulk upload';
      res.status(500).json({
        success: false,
        message: errorMessage,
        results: {
          success: 0,
          failed: 0,
          errors: [errorMessage]
        }
      });
    }
  }
);

export default router;

