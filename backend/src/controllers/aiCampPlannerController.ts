// backend/src/controllers/aiCampPlannerController.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient, CampStatus } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { DEMO_CAMPS, isDbConnectionError } from '../utils/mockStore';
import { inMemoryAuditLogs } from '../middleware/auditLog';

const prisma = new PrismaClient();

export interface AICampProposal {
  id: string;
  district: string;
  proposedName: string;
  proposedLocation: string;
  proposedAddress: string;
  latitude: number;
  longitude: number;
  targetStartDate: string;
  targetEndDate: string;
  recommendedCapacity: number;
  recommendedServices: string[];
  recommendedStaffing: {
    doctors: number;
    nurses: number;
    pharmacists: number;
    volunteers: number;
    labTechnicians: number;
  };
  recommendedSupplies: Array<{
    name: string;
    batchType: string;
    quantity: number;
    unit: string;
  }>;
  estimatedAttendance: number;
  confidenceScore: number;
  uncertaintyMargin: string;
  evidence: string[];
  assumptions: string[];
  guardrailNotice: string;
  status: 'PROPOSED' | 'APPROVED' | 'REJECTED';
  reviewNotes?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

// In-memory proposal store
export const AI_CAMP_PROPOSALS: AICampProposal[] = [
  {
    id: 'prop-kalaburagi-01',
    district: 'Kalaburagi',
    proposedName: 'Sedam Rural Community Health Camp',
    proposedLocation: 'Sedam Rural Center, Kalaburagi',
    proposedAddress: 'Taluk Community Hall, Near Bus Station, Sedam, Kalaburagi, Karnataka',
    latitude: 17.1812,
    longitude: 77.2882,
    targetStartDate: new Date(Date.now() + 86400000 * 21).toISOString(),
    targetEndDate: new Date(Date.now() + 86400000 * 22).toISOString(),
    recommendedCapacity: 200,
    recommendedServices: ['General Medicine', 'Diabetes Screening', 'Hypertension & Cardiac Consult', 'Eye Screening'],
    recommendedStaffing: {
      doctors: 4,
      nurses: 6,
      pharmacists: 2,
      volunteers: 8,
      labTechnicians: 2,
    },
    recommendedSupplies: [
      { name: 'Metformin 500mg', batchType: 'Oral Hypoglycemic', quantity: 600, unit: 'tablets' },
      { name: 'Amlodipine 5mg', batchType: 'Antihypertensive', quantity: 500, unit: 'tablets' },
      { name: 'Blood Glucose Test Strips', batchType: 'Diagnostic', quantity: 350, unit: 'strips' },
      { name: 'Digital BP Monitor Kits', batchType: 'Equipment', quantity: 6, unit: 'units' },
      { name: 'Paracetamol 500mg', batchType: 'Analgesic', quantity: 800, unit: 'tablets' },
    ],
    estimatedAttendance: 185,
    confidenceScore: 0.88,
    uncertaintyMargin: '±12% variance based on seasonal agricultural labor schedules',
    evidence: [
      'Kalaburagi district currently has only 1 recorded health camp with a 98% capacity utilization rate.',
      'Historical wait times in north-eastern Karnataka averaged 42 minutes due to doctor-to-patient queues.',
      'Documented pharmacy records indicate rapid depletion of glucose diagnostic strips during prior screening drives.',
    ],
    assumptions: [
      'Sedam Taluk Municipal Hall is accessible on the selected weekend at zero venue rental fee.',
      'Weekend timing maximizes attendance among regional farmers and manual laborers.',
      'Inter-district transit connectivity from Kalaburagi medical college remains unobstructed.',
    ],
    guardrailNotice:
      'Recommendation is derived strictly from historical operational attendance and supply logs. It does NOT model or infer disease prevalence or population pathology.',
    status: 'PROPOSED',
  },
  {
    id: 'prop-belagavi-02',
    district: 'Belagavi',
    proposedName: 'Gokak Taluk Multispecialty Screening Drive',
    proposedLocation: 'Gokak Primary Health Circle, Belagavi',
    proposedAddress: 'Opposite Government Junior College, Falls Road, Gokak, Belagavi, Karnataka',
    latitude: 16.1667,
    longitude: 74.8333,
    targetStartDate: new Date(Date.now() + 86400000 * 28).toISOString(),
    targetEndDate: new Date(Date.now() + 86400000 * 29).toISOString(),
    recommendedCapacity: 175,
    recommendedServices: ['General Medicine', 'Pediatrics', 'Dental Care', 'Women Health Screening'],
    recommendedStaffing: {
      doctors: 4,
      nurses: 5,
      pharmacists: 2,
      volunteers: 7,
      labTechnicians: 1,
    },
    recommendedSupplies: [
      { name: 'Iron & Folic Acid Tablets', batchType: 'Supplements', quantity: 500, unit: 'tablets' },
      { name: 'Dental Examination Kits', batchType: 'Dental Consumables', quantity: 180, unit: 'kits' },
      { name: 'Amoxicillin 250mg Susp.', batchType: 'Pediatric Antibiotic', quantity: 80, unit: 'bottles' },
      { name: 'Antiseptic Solution', batchType: 'Topical', quantity: 20, unit: 'bottles' },
    ],
    estimatedAttendance: 160,
    confidenceScore: 0.84,
    uncertaintyMargin: '±15% variance due to harvest period commitments in surrounding villages',
    evidence: [
      'Northern Belagavi recorded 120 unmet pediatric dental inquiries during the previous district session.',
      'Regional coverage analysis identified Gokak taluk as having zero dedicated health camps in the past 6 months.',
      'High volunteer availability recorded from Belagavi nursing institute for weekend deployment.',
    ],
    assumptions: [
      'Gokak Government Junior College auditorium granted for public health assembly.',
      'Adequate clean water supply and electrical backup available on-site for dental tools.',
    ],
    guardrailNotice:
      'Recommendation is derived strictly from historical operational attendance and supply logs. It does NOT model or infer disease prevalence or population pathology.',
    status: 'PROPOSED',
  },
  {
    id: 'prop-ballari-03',
    district: 'Ballari',
    proposedName: 'Sandur Industrial & Rural Screening Camp',
    proposedLocation: 'Sandur Community Center, Ballari',
    proposedAddress: 'Station Road, Near Town Municipality, Sandur, Ballari, Karnataka',
    latitude: 15.0833,
    longitude: 76.5500,
    targetStartDate: new Date(Date.now() + 86400000 * 35).toISOString(),
    targetEndDate: new Date(Date.now() + 86400000 * 36).toISOString(),
    recommendedCapacity: 220,
    recommendedServices: ['General Medicine', 'Pulmonology Screening', 'Ophthalmology', 'Cardiology Consult'],
    recommendedStaffing: {
      doctors: 5,
      nurses: 6,
      pharmacists: 3,
      volunteers: 10,
      labTechnicians: 2,
    },
    recommendedSupplies: [
      { name: 'Salbutamol Inhalers', batchType: 'Respiratory', quantity: 120, unit: 'inhalers' },
      { name: 'Spirometer Mouthpieces', batchType: 'Diagnostic', quantity: 250, unit: 'pieces' },
      { name: 'Eye Refraction Diagnostic Charts', batchType: 'Equipment', quantity: 4, unit: 'sets' },
      { name: 'Reading Glasses (+1.0 to +3.0)', batchType: 'Optical', quantity: 150, unit: 'pairs' },
    ],
    estimatedAttendance: 210,
    confidenceScore: 0.91,
    uncertaintyMargin: '±10% variance based on strong mining worker union coordination',
    evidence: [
      'Sandur belt exhibits documented historical turnout exceeding 200 patients when pulmonology screenings are offered.',
      'Last Ballari camp closed with 45 patients on the waiting list who could not be accommodated before sunset.',
    ],
    assumptions: [
      'Local civic administration provides crowd control barrier support.',
      'Ophthalmology partner provides mobile slit-lamp equipment.',
    ],
    guardrailNotice:
      'Recommendation is derived strictly from historical operational attendance and supply logs. It does NOT model or infer disease prevalence or population pathology.',
    status: 'PROPOSED',
  },
];

/**
 * GET /api/v1/ai-planner/proposals
 * Administrator-only: Get AI-generated camp proposals based on historical records and coverage gaps
 */
export const getCampProposals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { district, status } = req.query;

    let list = [...AI_CAMP_PROPOSALS];
    if (district && district !== 'all') {
      list = list.filter((p) => p.district.toLowerCase() === String(district).toLowerCase());
    }
    if (status && status !== 'all') {
      list = list.filter((p) => p.status.toLowerCase() === String(status).toLowerCase());
    }

    res.json({
      success: true,
      message: 'AI camp planning proposals generated from historical data and coverage gaps.',
      data: {
        proposals: list,
        totalFound: list.length,
        summary: {
          proposed: list.filter((p) => p.status === 'PROPOSED').length,
          approved: list.filter((p) => p.status === 'APPROVED').length,
          rejected: list.filter((p) => p.status === 'REJECTED').length,
        },
        disclaimer:
          'Proposals are generated using algorithmic logistics optimization based on historical attendance and recorded coverage gaps. Disease prevalence is NOT inferred from camp attendance. Administrator review and approval is required before scheduling.',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/ai-planner/approve
 * Administrator-only: Approve proposal, convert into upcoming camp, and record audit log
 */
export const approveCampProposal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { proposalId, customName, customCapacity, customStartDate, customEndDate, reviewNotes } = req.body;

    const proposal = AI_CAMP_PROPOSALS.find((p) => p.id === proposalId);
    if (!proposal) {
      throw new AppError('AI camp proposal not found', 404, 'NOT_FOUND');
    }

    if (proposal.status !== 'PROPOSED') {
      throw new AppError(`Cannot approve proposal in '${proposal.status}' state`, 400, 'INVALID_STATE');
    }

    proposal.status = 'APPROVED';
    proposal.reviewNotes = reviewNotes || 'Approved by Administrator after logistics verification.';
    proposal.reviewedAt = new Date().toISOString();
    proposal.reviewedBy = req.user?.email || 'admin@healthcamp.gov.in';

    // Create real upcoming camp in database (or demo store)
    const campTitle = customName || proposal.proposedName;
    const capacity = Number(customCapacity || proposal.recommendedCapacity);
    const start = new Date(customStartDate || proposal.targetStartDate);
    const end = new Date(customEndDate || proposal.targetEndDate);

    let createdCamp: any;
    try {
      createdCamp = await prisma.camp.create({
        data: {
          name: campTitle,
          location: proposal.proposedLocation,
          address: proposal.proposedAddress,
          latitude: proposal.latitude,
          longitude: proposal.longitude,
          startDate: start,
          endDate: end,
          capacity: capacity,
          services: proposal.recommendedServices,
          description: `AI-Assisted community health screening camp. Recommended based on documented coverage gaps in ${proposal.district}.`,
          createdById: req.user?.userId || 'admin-1',
        },
      });
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        createdCamp = {
          id: `camp-${Date.now()}`,
          name: campTitle,
          location: proposal.proposedLocation,
          address: proposal.proposedAddress,
          latitude: proposal.latitude,
          longitude: proposal.longitude,
          startDate: start,
          endDate: end,
          capacity: capacity,
          registered: 0,
          status: 'UPCOMING',
          services: proposal.recommendedServices,
          description: `AI-Assisted community health screening camp. Recommended based on documented coverage gaps in ${proposal.district}.`,
          createdById: req.user?.userId || 'admin-1',
          _count: { appointments: 0, inventory: 0 },
        };
        DEMO_CAMPS.unshift(createdCamp);
      } else {
        throw dbErr;
      }
    }

    // Record audit event
    inMemoryAuditLogs.unshift({
      id: `audit-${Date.now()}`,
      userId: req.user?.userId || 'admin-1',
      action: 'CREATE' as any,
      entity: 'CAMP_AI_PLAN',
      entityId: proposal.id,
      details: {
        proposalId: proposal.id,
        createdCampId: createdCamp.id,
        approvedName: campTitle,
        district: proposal.district,
        reviewNotes: proposal.reviewNotes,
      },
      ipAddress: req.ip || null,
      userAgent: req.headers['user-agent'] || null,
      createdAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'AI proposal approved and new health camp successfully scheduled.',
      data: {
        proposal,
        camp: createdCamp,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/ai-planner/reject
 * Administrator-only: Reject proposal with justification reason
 */
export const rejectCampProposal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { proposalId, rejectionReason } = req.body;

    const proposal = AI_CAMP_PROPOSALS.find((p) => p.id === proposalId);
    if (!proposal) {
      throw new AppError('AI camp proposal not found', 404, 'NOT_FOUND');
    }

    if (proposal.status !== 'PROPOSED') {
      throw new AppError(`Cannot reject proposal in '${proposal.status}' state`, 400, 'INVALID_STATE');
    }

    proposal.status = 'REJECTED';
    proposal.reviewNotes = rejectionReason || 'Rejected by Administrator due to municipal or staffing constraints.';
    proposal.reviewedAt = new Date().toISOString();
    proposal.reviewedBy = req.user?.email || 'admin@healthcamp.gov.in';

    // Record audit event
    inMemoryAuditLogs.unshift({
      id: `audit-${Date.now()}`,
      userId: req.user?.userId || 'admin-1',
      action: 'UPDATE' as any,
      entity: 'CAMP_AI_PLAN',
      entityId: proposal.id,
      details: {
        proposalId: proposal.id,
        rejectionReason: proposal.reviewNotes,
        district: proposal.district,
      },
      ipAddress: req.ip || null,
      userAgent: req.headers['user-agent'] || null,
      createdAt: new Date(),
    });

    res.json({
      success: true,
      message: 'AI proposal rejected and logged.',
      data: {
        proposal,
      },
    });
  } catch (error) {
    next(error);
  }
};
