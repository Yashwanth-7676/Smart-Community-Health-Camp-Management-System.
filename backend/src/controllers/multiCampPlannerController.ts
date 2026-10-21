// backend/src/controllers/multiCampPlannerController.ts
import { Request, Response, NextFunction } from 'express';
import { DEMO_CAMPS } from '../utils/mockStore';
import { calculateStraightLineDistance } from './campController';

export interface MultiCampStop {
  campId?: string;
  name: string;
  location: string;
  district: string;
  latitude: number;
  longitude: number;
  plannedDate: string; // ISO date
  targetCapacity: number;
  services: string[];
  assignedStaff: string[];
}

export interface MultiCampPlan {
  id: string;
  title: string;
  targetRegion: string;
  status: 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  stops: MultiCampStop[];
  totalEstimatedPatients: number;
  totalCircuitDistanceKm: number;
  estimatedTransitHours: number;
  scheduleConflicts: string[];
  resourceWarnings: string[];
  createdByAdmin: string;
  createdAt: string;
  updatedAt: string;
  notes: string;
  disclaimer: string;
}

// In-memory store for draft multi-camp plans
let MULTI_CAMP_PLANS: MultiCampPlan[] = [
  {
    id: 'mplan-1',
    title: 'North Karnataka Mobile Specialist Circuit',
    targetRegion: 'North Karnataka',
    status: 'DRAFT',
    stops: [
      {
        campId: 'camp-7',
        name: 'Hubballi Industrial Health Screening',
        location: 'APMC Yard, Hubballi',
        district: 'Hubballi-Dharwad',
        latitude: 15.3647,
        longitude: 75.124,
        plannedDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        targetCapacity: 160,
        services: ['General Medicine', 'Pulmonology', 'Occupational Health'],
        assignedStaff: ['Dr. Ramesh Patil', 'Volunteer Team A'],
      },
      {
        campId: 'camp-8',
        name: 'Belagavi Rural Preventive Camp',
        location: 'Taluk Hospital Grounds, Belagavi',
        district: 'Belagavi',
        latitude: 15.8497,
        longitude: 74.4977,
        plannedDate: new Date(Date.now() + 9 * 86400000).toISOString(),
        targetCapacity: 200,
        services: ['General Medicine', 'Pediatrics', 'Diabetes Screening'],
        assignedStaff: ['Dr. Anita Desai', 'Volunteer Team B'],
      },
      {
        campId: 'camp-10',
        name: 'Kalaburagi Community Diagnostic Outreach',
        location: 'Sedam Road Community Center',
        district: 'Kalaburagi',
        latitude: 17.3297,
        longitude: 76.8343,
        plannedDate: new Date(Date.now() + 12 * 86400000).toISOString(),
        targetCapacity: 180,
        services: ['Cardiology', 'General Medicine', 'Eye Screening'],
        assignedStaff: ['Dr. Ramesh Patil', 'Volunteer Team C'],
      },
    ],
    totalEstimatedPatients: 540,
    totalCircuitDistanceKm: 420.5,
    estimatedTransitHours: 8.5,
    scheduleConflicts: [],
    resourceWarnings: ['Inter-district transit between Belagavi and Kalaburagi exceeds 300 km (requires overnight transit rest).'],
    createdByAdmin: 'admin@healthcamp.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: 'Draft outreach initiative designed to bridge specialist access across Northern Karnataka taluks.',
    disclaimer:
      'Proposed multi-camp itinerary is an operational proposal and does not represent confirmed public camp deployments until administrative approval.',
  },
  {
    id: 'mplan-2',
    title: 'Coastal Preventive Mobile Mission',
    targetRegion: 'Coastal Karnataka',
    status: 'UNDER_REVIEW',
    stops: [
      {
        campId: 'camp-6',
        name: 'Mangaluru Fisherfolk Health Clinic',
        location: 'Old Port Road, Mangaluru',
        district: 'Dakshina Kannada',
        latitude: 12.8703,
        longitude: 74.8806,
        plannedDate: new Date(Date.now() + 14 * 86400000).toISOString(),
        targetCapacity: 140,
        services: ['General Medicine', 'Dermatology', 'Vision Screening'],
        assignedStaff: ['Dr. Sunita Rao', 'Coastal Volunteer Group'],
      },
      {
        campId: 'camp-15',
        name: 'Udupi Coastal Senior Care Camp',
        location: 'Town Hall, Udupi',
        district: 'Udupi',
        latitude: 13.3409,
        longitude: 74.7421,
        plannedDate: new Date(Date.now() + 16 * 86400000).toISOString(),
        targetCapacity: 120,
        services: ['Geriatric Care', 'Orthopedics', 'Cardiology'],
        assignedStaff: ['Dr. Sunita Rao', 'Udupi Volunteer Team'],
      },
    ],
    totalEstimatedPatients: 260,
    totalCircuitDistanceKm: 58.2,
    estimatedTransitHours: 1.5,
    scheduleConflicts: [],
    resourceWarnings: [],
    createdByAdmin: 'admin@healthcamp.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: 'Coastal outreach linking secondary screening to Government Wenlock Hospital referral hub.',
    disclaimer:
      'Proposed multi-camp itinerary is an operational proposal and does not represent confirmed public camp deployments until administrative approval.',
  },
];

// Helper to compute sequential circuit distances
function computeCircuitMetrics(stops: MultiCampStop[]) {
  let totalKm = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    const s1 = stops[i];
    const s2 = stops[i + 1];
    const dist = calculateStraightLineDistance(s1.latitude, s1.longitude, s2.latitude, s2.longitude);
    // Estimated road distance factor ~1.28x of straight-line
    totalKm += Math.round(dist * 1.28 * 10) / 10;
  }
  const transitHours = Math.round((totalKm / 50) * 10) / 10; // ~50 km/h regional average
  return { totalKm, transitHours };
}

// Helper to detect date and staff schedule conflicts
function detectScheduleConflicts(stops: MultiCampStop[]): { conflicts: string[]; warnings: string[] } {
  const conflicts: string[] = [];
  const warnings: string[] = [];

  // Check same day overlap
  const dateMap = new Map<string, MultiCampStop[]>();
  stops.forEach((s) => {
    const dStr = new Date(s.plannedDate).toISOString().split('T')[0];
    if (!dateMap.has(dStr)) dateMap.set(dStr, []);
    dateMap.get(dStr)!.push(s);
  });

  dateMap.forEach((dayStops, dStr) => {
    if (dayStops.length > 1) {
      conflicts.push(
        `Multiple camps scheduled on same date (${dStr}): ${dayStops.map((c) => c.name).join(' & ')}`
      );
    }
  });

  // Check staff double booking across adjacent days with long distance
  for (let i = 0; i < stops.length - 1; i++) {
    const s1 = stops[i];
    const s2 = stops[i + 1];
    const sharedStaff = s1.assignedStaff.filter((st) => s2.assignedStaff.includes(st));

    if (sharedStaff.length > 0) {
      const d1 = new Date(s1.plannedDate).getTime();
      const d2 = new Date(s2.plannedDate).getTime();
      const diffDays = Math.abs(d2 - d1) / 86400000;

      if (diffDays < 1) {
        conflicts.push(
          `Staff conflict: ${sharedStaff.join(', ')} assigned to both ${s1.name} and ${s2.name} on the same day.`
        );
      } else if (diffDays <= 1) {
        const dist = calculateStraightLineDistance(s1.latitude, s1.longitude, s2.latitude, s2.longitude);
        if (dist > 150) {
          warnings.push(
            `Transit strain: ${sharedStaff.join(', ')} must travel ${Math.round(dist)} km between ${s1.district} and ${s2.district} within 24 hours.`
          );
        }
      }
    }
  }

  return { conflicts, warnings };
}

/**
 * GET /api/v1/camps/multi-plans
 * Administrator: Retrieve all draft multi-camp mobile circuit plans
 */
export const getMultiCampPlans = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json({
      success: true,
      data: MULTI_CAMP_PLANS,
      count: MULTI_CAMP_PLANS.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/camps/multi-plans
 * Administrator: Create a new draft multi-camp mobile circuit plan
 */
export const createMultiCampPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, targetRegion, stops, notes } = req.body;

    if (!title || !Array.isArray(stops) || stops.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Plan title and at least one stop are required.',
      });
      return;
    }

    const { totalKm, transitHours } = computeCircuitMetrics(stops);
    const { conflicts, warnings } = detectScheduleConflicts(stops);

    const totalPatients = stops.reduce((acc: number, s: MultiCampStop) => acc + (s.targetCapacity || 100), 0);

    const newPlan: MultiCampPlan = {
      id: `mplan-${Date.now()}`,
      title,
      targetRegion: targetRegion || 'Karnataka Regional',
      status: 'DRAFT',
      stops,
      totalEstimatedPatients: totalPatients,
      totalCircuitDistanceKm: totalKm,
      estimatedTransitHours: transitHours,
      scheduleConflicts: conflicts,
      resourceWarnings: warnings,
      createdByAdmin: (req as any).user?.email || 'admin@healthcamp.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: notes || '',
      disclaimer:
        'Proposed multi-camp itinerary is an operational proposal and does not represent confirmed public camp deployments until administrative approval.',
    };

    MULTI_CAMP_PLANS.unshift(newPlan);

    res.status(201).json({
      success: true,
      message: 'Draft multi-camp mobile circuit plan created successfully.',
      data: newPlan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/camps/multi-plans/:id/approve
 * Administrator: Explicitly approve a draft multi-camp plan and promote to scheduled camps
 */
export const approveMultiCampPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const plan = MULTI_CAMP_PLANS.find((p) => p.id === id);

    if (!plan) {
      res.status(404).json({ success: false, message: 'Multi-camp plan not found.' });
      return;
    }

    if (plan.scheduleConflicts.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot approve plan with unresolved schedule conflicts.',
        conflicts: plan.scheduleConflicts,
      });
      return;
    }

    plan.status = 'APPROVED';
    plan.updatedAt = new Date().toISOString();

    // Promote stops to DEMO_CAMPS if needed
    plan.stops.forEach((stop, i) => {
      const existing = DEMO_CAMPS.find((c) => c.name === stop.name);
      if (!existing) {
        DEMO_CAMPS.push({
          id: `camp-promoted-${Date.now()}-${i}`,
          name: stop.name,
          location: stop.location,
          address: `${stop.location}, ${stop.district}, Karnataka`,
          latitude: stop.latitude,
          longitude: stop.longitude,
          startDate: new Date(stop.plannedDate),
          endDate: new Date(new Date(stop.plannedDate).getTime() + 8 * 3600000),
          capacity: stop.targetCapacity,
          registered: 0,
          status: 'UPCOMING',
          services: stop.services,
          description: `Approved from multi-camp circuit "${plan.title}".`,
          createdBy: { id: 'admin', firstName: 'Admin', lastName: 'Superintendent', email: 'admin@healthcamp.com' },
          _count: { appointments: 0, inventory: 0 },
        });
      }
    });

    res.json({
      success: true,
      message: `Multi-camp plan "${plan.title}" approved and registered into upcoming healthcare schedules.`,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/camps/multi-plans/:id
 * Administrator: Delete a draft multi-camp plan
 */
export const deleteMultiCampPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const idx = MULTI_CAMP_PLANS.findIndex((p) => p.id === id);
    if (idx === -1) {
      res.status(404).json({ success: false, message: 'Plan not found.' });
      return;
    }

    const removed = MULTI_CAMP_PLANS.splice(idx, 1)[0];
    res.json({
      success: true,
      message: `Multi-camp plan "${removed.title}" deleted successfully.`,
      data: removed,
    });
  } catch (error) {
    next(error);
  }
};
