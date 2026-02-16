import { getDatabase } from '../config/database';
import { COLLECTIONS, PAYMENT_MODE, BHANDARA_STATUS } from '../config/constants';

export interface OverallStats {
  totalBhandaras: number;
  activeBhandaras: number;
  totalDonors: number;
  totalDonations: number;
  totalCollectedAmount: number;
  totalPendingAmount: number;
  recentDonations: number;
}

export interface BhandaraStats {
  bhandaraId: string;
  bhandaraName: string;
  totalCollected: number;
  totalPending: number;
  totalDonations: number;
  donorCount: number;
  paymentModeBreakdown: {
    cash: number;
    upi: number;
    bank: number;
  };
}

export interface StatsResponse {
  overall: OverallStats;
  bhandaras: BhandaraStats[];
}

export class StatsService {
  static async getStats(): Promise<StatsResponse> {
    const overall = await this.getOverallStats();
    const bhandaras = await this.getBhandaraStats();

    return {
      overall,
      bhandaras
    };
  }

  static async getOverallStats(): Promise<OverallStats> {
    const db = getDatabase();

    const totalBhandaras = await db.collection(COLLECTIONS.BHANDARAS).countDocuments();
    const activeBhandaras = await db.collection(COLLECTIONS.BHANDARAS).countDocuments({
      status: BHANDARA_STATUS.ACTIVE
    });
    const totalDonors = await db.collection(COLLECTIONS.DONORS).countDocuments();
    const totalDonations = await db.collection(COLLECTIONS.DONATIONS).countDocuments();

    const totalAmountResult = await db.collection(COLLECTIONS.DONATIONS).aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]).toArray();

    const totalAmount = totalAmountResult.length > 0 ? totalAmountResult[0].total : 0;
    const totalCollectedAmount = totalAmount;
    const totalPendingAmount = 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentDonations = await db.collection(COLLECTIONS.DONATIONS).countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    return {
      totalBhandaras,
      activeBhandaras,
      totalDonors,
      totalDonations,
      totalCollectedAmount,
      totalPendingAmount,
      recentDonations
    };
  }

  static async getBhandaraStats(): Promise<BhandaraStats[]> {
    const db = getDatabase();

    const stats = await db.collection(COLLECTIONS.DONATIONS).aggregate([
      {
        $lookup: {
          from: COLLECTIONS.BHANDARAS,
          localField: 'bhandara',
          foreignField: '_id',
          as: 'bhandaraData'
        }
      },
      {
        $unwind: '$bhandaraData'
      },
      {
        $group: {
          _id: '$bhandara',
          bhandaraName: { $first: '$bhandaraData.name' },
          totalCollected: {
            $sum: '$amount'
          },
          totalDonations: { $sum: 1 },
          donorCount: { $addToSet: '$donor' },
          cashAmount: {
            $sum: {
              $cond: [
                { $eq: ['$paymentMode', PAYMENT_MODE.CASH] },
                '$amount',
                0
              ]
            }
          },
          upiAmount: {
            $sum: {
              $cond: [
                { $eq: ['$paymentMode', PAYMENT_MODE.UPI] },
                '$amount',
                0
              ]
            }
          },
          bankAmount: {
            $sum: {
              $cond: [
                { $eq: ['$paymentMode', PAYMENT_MODE.BANK] },
                '$amount',
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          bhandaraId: { $toString: '$_id' },
          bhandaraName: 1,
          totalCollected: 1,
          totalPending: { $literal: 0 },
          totalDonations: 1,
          donorCount: { $size: '$donorCount' },
          paymentModeBreakdown: {
            cash: '$cashAmount',
            upi: '$upiAmount',
            bank: '$bankAmount'
          }
        }
      },
      {
        $sort: { totalCollected: -1 }
      }
    ]).toArray();

    return stats.map(stat => ({
      bhandaraId: stat.bhandaraId,
      bhandaraName: stat.bhandaraName,
      totalCollected: stat.totalCollected,
      totalPending: stat.totalPending,
      totalDonations: stat.totalDonations,
      donorCount: stat.donorCount,
      paymentModeBreakdown: stat.paymentModeBreakdown
    }));
  }
}

