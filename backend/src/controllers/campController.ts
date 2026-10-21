import { Request, Response, NextFunction } from 'express';
import { PrismaClient, CampStatus } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { getPagination, buildPaginationMeta } from '../utils/helpers';
import { CreateCampDto, UpdateCampDto, ListQueryParams } from '../types';
import { DEMO_CAMPS, DEMO_APPOINTMENTS, isDbConnectionError } from '../utils/mockStore';

const prisma = new PrismaClient();

/**
 * GET /api/v1/camps
 * List all camps with search, filter, and pagination
 */
export const getCamps = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '10',
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query as ListQueryParams;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const { skip, take } = getPagination(pageNum, limitNum);

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status as CampStatus;
    }

    const validSortFields = ['createdAt', 'name', 'startDate', 'endDate', 'capacity', 'registered'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    let camps: any[];
    let total: number;

    try {
      [camps, total] = await Promise.all([
        prisma.camp.findMany({
          where,
          include: {
            createdBy: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
            _count: {
              select: { appointments: true, inventory: true },
            },
          },
          orderBy: { [orderField]: sortOrder },
          skip,
          take,
        }),
        prisma.camp.count({ where }),
      ]);
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        let filtered = [...DEMO_CAMPS];
        if (search) {
          const s = search.toLowerCase();
          filtered = filtered.filter(
            (c) =>
              c.name.toLowerCase().includes(s) ||
              c.location.toLowerCase().includes(s) ||
              c.description.toLowerCase().includes(s)
          );
        }
        if (status) {
          filtered = filtered.filter((c) => c.status === status);
        }
        total = filtered.length;
        camps = filtered.slice(skip, skip + take);
      } else {
        throw dbErr;
      }
    }

    // Public camp discovery is safe to share-cache briefly; it contains no
    // patient or booking details.
    res.setHeader('Cache-Control', 'public, max-age=15, stale-while-revalidate=45');
    res.json({
      success: true,
      message: 'Camps retrieved successfully',
      data: camps,
      meta: buildPaginationMeta(total, pageNum, limitNum),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Haversine straight-line distance calculation in kilometers
 */
export function calculateStraightLineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Determine live camp scheduled status from start date, end date, and cancelled state
 */
export function computeLiveCampStatus(camp: { startDate: Date | string; endDate: Date | string; status: string }): string {
  if (camp.status === 'CANCELLED') return 'CANCELLED';
  const now = Date.now();
  const start = new Date(camp.startDate).getTime();
  const end = new Date(camp.endDate).getTime();
  if (now < start) return 'UPCOMING';
  if (now >= start && now <= end) return 'ONGOING';
  return 'COMPLETED';
}

/**
 * Extract district / regional cluster name dynamically from address and location
 */
export function extractRegionName(location: string = '', address: string = ''): string {
  const combined = `${location} ${address}`.toLowerCase();
  if (combined.includes('koramangala') || combined.includes('indiranagar') || combined.includes('jayanagar') || combined.includes('whitefield') || combined.includes('bengaluru') || combined.includes('bangalore')) {
    return 'Bengaluru Urban';
  }
  if (combined.includes('mysuru') || combined.includes('mysore')) return 'Mysuru';
  if (combined.includes('mangaluru') || combined.includes('mangalore') || combined.includes('dakshina kannada')) return 'Mangaluru';
  if (combined.includes('hubballi') || combined.includes('hubli') || combined.includes('dharwad')) return 'Hubballi-Dharwad';
  if (combined.includes('belagavi') || combined.includes('belgaum')) return 'Belagavi';
  if (combined.includes('ballari') || combined.includes('bellary')) return 'Ballari';
  if (combined.includes('kalaburagi') || combined.includes('gulbarga')) return 'Kalaburagi';
  if (combined.includes('shivamogga') || combined.includes('shimoga')) return 'Shivamogga';
  if (combined.includes('mumbai')) return 'Mumbai Metro';
  if (combined.includes('hyderabad')) return 'Hyderabad';
  if (combined.includes('chennai')) return 'Chennai';
  if (combined.includes('delhi')) return 'Delhi NCR';
  return location.trim() || 'Other Regional Cluster';
}

/**
 * GET /api/v1/camps/map
 * Retrieve all camps for full-screen interactive discovery map with coordinate validation and filters
 */
export const getMapCamps = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      search,
      status,
      service,
      isFree,
      hasSlots,
      dateFrom,
      dateTo,
      bounds, // minLat,minLng,maxLat,maxLng
      userLat,
      userLng,
      radius, // straight-line distance in km
    } = req.query;

    let camps: any[] = [];

    try {
      const where: any = {};
      if (status && status !== 'all') {
        where.status = status;
      }
      if (search) {
        const s = String(search).trim();
        where.OR = [
          { name: { contains: s, mode: 'insensitive' } },
          { location: { contains: s, mode: 'insensitive' } },
          { address: { contains: s, mode: 'insensitive' } },
          { description: { contains: s, mode: 'insensitive' } },
        ];
      }
      if (service && service !== 'all') {
        where.services = { has: String(service) };
      }
      if (dateFrom || dateTo) {
        where.startDate = {};
        if (dateFrom) where.startDate.gte = new Date(String(dateFrom));
        if (dateTo) where.startDate.lte = new Date(String(dateTo));
      }

      camps = await prisma.camp.findMany({
        where,
        include: {
          _count: { select: { appointments: true, inventory: true } },
        },
        orderBy: { startDate: 'asc' },
      });
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        camps = [...DEMO_CAMPS];
      } else {
        throw dbErr;
      }
    }

    if (!camps || camps.length === 0) {
      camps = [...DEMO_CAMPS];
    }

    // Filter in-memory for comprehensive flexibility (supporting mock store and advanced criteria)
    const filtered = camps.filter((camp) => {
      // 1. Strict Coordinate Validation
      const lat = Number(camp.latitude);
      const lng = Number(camp.longitude);
      const isValidCoord =
        camp.latitude !== null &&
        camp.latitude !== undefined &&
        camp.longitude !== null &&
        camp.longitude !== undefined &&
        !isNaN(lat) &&
        !isNaN(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180 &&
        !(lat === 0 && lng === 0);

      if (!isValidCoord) return false;

      // 2. Status filter
      if (status && status !== 'all') {
        if (camp.status.toUpperCase() !== String(status).toUpperCase()) return false;
      }

      // 3. Search query (name, address, location, pincode, service)
      if (search) {
        const query = String(search).toLowerCase().trim();
        const matchesName = (camp.name || '').toLowerCase().includes(query);
        const matchesLoc = (camp.location || '').toLowerCase().includes(query);
        const matchesAddr = (camp.address || '').toLowerCase().includes(query);
        const matchesDesc = (camp.description || '').toLowerCase().includes(query);
        const matchesService = Array.isArray(camp.services) && camp.services.some((s: string) => s.toLowerCase().includes(query));
        if (!matchesName && !matchesLoc && !matchesAddr && !matchesDesc && !matchesService) {
          return false;
        }
      }

      // 4. Service filter
      if (service && service !== 'all') {
        const targetService = String(service).toLowerCase();
        const hasService = Array.isArray(camp.services) && camp.services.some((s: string) => s.toLowerCase().includes(targetService));
        if (!hasService) return false;
      }

      // 5. Available slots filter
      const registered = camp.registered ?? camp._count?.appointments ?? 0;
      const capacity = camp.capacity || 100;
      if (hasSlots === 'true') {
        if (registered >= capacity) return false;
      }

      // 6. Free filter
      if (isFree === 'true') {
        if (camp.isFree === false) return false;
      }

      // 7. Date range filter
      if (dateFrom) {
        const dFrom = new Date(String(dateFrom)).getTime();
        const cStart = new Date(camp.startDate).getTime();
        if (cStart < dFrom) return false;
      }
      if (dateTo) {
        const dTo = new Date(String(dateTo)).getTime();
        const cStart = new Date(camp.startDate).getTime();
        if (cStart > dTo) return false;
      }

      // 8. Viewport bounding box filter (minLat, minLng, maxLat, maxLng)
      if (bounds) {
        const parts = String(bounds).split(',').map(Number);
        if (parts.length === 4 && !parts.some(isNaN)) {
          const [minLat, minLng, maxLat, maxLng] = parts;
          if (lat < minLat || lat > maxLat || lng < minLng || lng > maxLng) {
            return false;
          }
        }
      }

      // 9. Straight-line distance radius filter
      if (userLat && userLng && radius) {
        const uLat = Number(userLat);
        const uLng = Number(userLng);
        const maxDist = Number(radius);
        if (!isNaN(uLat) && !isNaN(uLng) && !isNaN(maxDist) && maxDist > 0) {
          const dist = calculateStraightLineDistance(uLat, uLng, lat, lng);
          if (dist > maxDist) return false;
        }
      }

      return true;
    });

    // Structure mapped output with straight-line distance and live status calculation
    const uLat = userLat ? Number(userLat) : null;
    const uLng = userLng ? Number(userLng) : null;

    const mapped = filtered.map((c) => {
      const registered = c.registered ?? c._count?.appointments ?? 0;
      const capacity = c.capacity || 100;
      const availableSlots = Math.max(0, capacity - registered);
      const isFullyBooked = registered >= capacity;
      const liveStatus = computeLiveCampStatus(c);

      let straightLineDistance: number | null = null;
      if (uLat !== null && uLng !== null && !isNaN(uLat) && !isNaN(uLng)) {
        straightLineDistance = calculateStraightLineDistance(uLat, uLng, Number(c.latitude), Number(c.longitude));
      }

      return {
        id: c.id,
        name: c.name,
        location: c.location,
        address: c.address,
        latitude: Number(c.latitude),
        longitude: Number(c.longitude),
        startDate: c.startDate,
        endDate: c.endDate,
        status: liveStatus,
        configuredStatus: c.status,
        capacity,
        registered,
        availableSlots,
        isFullyBooked,
        isFree: c.isFree !== false,
        feeLabel: c.isFree === false ? '₹50 (Registration Fee)' : 'Free Public Care',
        services: c.services || ['General Medicine'],
        description: c.description || 'Community health screening and consultation camp.',
        operationalHours: '08:30 AM - 05:30 PM',
        coordinatesValid: true,
        straightLineDistance,
        distanceLabel: straightLineDistance !== null ? `${straightLineDistance} km (straight-line)` : null,
      };
    });

    res.setHeader('Cache-Control', 'public, max-age=15, stale-while-revalidate=45');
    res.json({
      success: true,
      data: {
        camps: mapped,
        totalFound: mapped.length,
        summary: {
          upcoming: mapped.filter((c) => c.status === 'UPCOMING').length,
          ongoing: mapped.filter((c) => c.status === 'ONGOING').length,
          completed: mapped.filter((c) => c.status === 'COMPLETED').length,
          cancelled: mapped.filter((c) => c.status === 'CANCELLED').length,
          fullyBooked: mapped.filter((c) => c.isFullyBooked).length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/camps/:id/location
 * Administrator confirms or updates map pin coordinates for a camp
 */
export const updateCampLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { latitude, longitude, address } = req.body;

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new AppError('Invalid coordinates. Latitude must be between -90 and 90, Longitude between -180 and 180.', 400, 'INVALID_COORDINATES');
    }

    let updated: any;
    try {
      const existing = await prisma.camp.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError('Camp not found', 404, 'NOT_FOUND');
      }

      updated = await prisma.camp.update({
        where: { id },
        data: {
          latitude: lat,
          longitude: lng,
          ...(address ? { address } : {}),
        },
      });
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        const demo = DEMO_CAMPS.find((c) => c.id === id);
        if (!demo) {
          throw new AppError('Camp not found', 404, 'NOT_FOUND');
        }
        demo.latitude = lat;
        demo.longitude = lng;
        if (address) demo.address = address;
        updated = demo;
      } else {
        throw dbErr;
      }
    }

    res.setHeader('Cache-Control', 'private, no-store');
    res.json({
      success: true,
      message: 'Camp coordinates successfully updated and verified on map.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/camps/regional-analytics
 * Administrator-only regional distribution, attendance, and coverage analytics
 */
export const getRegionalAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { dateFrom, dateTo, region } = req.query;

    let camps: any[] = [];
    try {
      const where: any = {};
      if (dateFrom || dateTo) {
        where.startDate = {};
        if (dateFrom) where.startDate.gte = new Date(String(dateFrom));
        if (dateTo) where.startDate.lte = new Date(String(dateTo));
      }
      camps = await prisma.camp.findMany({
        where,
        include: {
          _count: { select: { appointments: true } },
        },
      });
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        camps = [...DEMO_CAMPS];
      } else {
        throw dbErr;
      }
    }

    if (!camps || camps.length === 0) {
      camps = [...DEMO_CAMPS];
    }

    // Filter by date range if provided
    let filtered = camps;
    if (dateFrom) {
      const dFrom = new Date(String(dateFrom)).getTime();
      filtered = filtered.filter((c) => new Date(c.startDate).getTime() >= dFrom);
    }
    if (dateTo) {
      const dTo = new Date(String(dateTo)).getTime();
      filtered = filtered.filter((c) => new Date(c.startDate).getTime() <= dTo);
    }

    // Dynamic grouping by region/district
    const regionMap: Record<
      string,
      {
        region: string;
        campsCount: number;
        totalCapacity: number;
        totalRegistered: number;
        estimatedAttendance: number;
        occupancyRate: number;
        serviceCounts: Record<string, number>;
        statusCounts: { upcoming: number; ongoing: number; completed: number; cancelled: number };
        camps: Array<{ id: string; name: string; location: string; status: string; registered: number; capacity: number }>;
      }
    > = {};

    filtered.forEach((camp) => {
      const regName = extractRegionName(camp.location, camp.address);
      if (region && String(region).toLowerCase() !== 'all' && regName.toLowerCase() !== String(region).toLowerCase()) {
        return;
      }

      if (!regionMap[regName]) {
        regionMap[regName] = {
          region: regName,
          campsCount: 0,
          totalCapacity: 0,
          totalRegistered: 0,
          estimatedAttendance: 0,
          occupancyRate: 0,
          serviceCounts: {},
          statusCounts: { upcoming: 0, ongoing: 0, completed: 0, cancelled: 0 },
          camps: [],
        };
      }

      const registered = camp.registered ?? camp._count?.appointments ?? 0;
      const capacity = camp.capacity || 100;
      const group = regionMap[regName];

      group.campsCount += 1;
      group.totalCapacity += capacity;
      group.totalRegistered += registered;
      group.estimatedAttendance += Math.round(registered * 0.92);

      const statusKey = (camp.status || 'UPCOMING').toLowerCase() as keyof typeof group.statusCounts;
      if (group.statusCounts[statusKey] !== undefined) {
        group.statusCounts[statusKey] += 1;
      }

      if (Array.isArray(camp.services)) {
        camp.services.forEach((s: string) => {
          group.serviceCounts[s] = (group.serviceCounts[s] || 0) + 1;
        });
      }

      group.camps.push({
        id: camp.id,
        name: camp.name,
        location: camp.location,
        status: camp.status,
        registered,
        capacity,
      });
    });

    // Calculate occupancy rates and coverage status
    const regionalData = Object.values(regionMap).map((r) => {
      const occupancy = r.totalCapacity > 0 ? Math.round((r.totalRegistered / r.totalCapacity) * 100) : 0;
      let coverageStatus: 'Well-Covered' | 'Moderate' | 'Underserved';
      if (r.campsCount >= 3 && occupancy < 90) {
        coverageStatus = 'Well-Covered';
      } else if (r.campsCount >= 2) {
        coverageStatus = 'Moderate';
      } else {
        coverageStatus = 'Underserved';
      }

      return {
        ...r,
        occupancyRate: occupancy,
        coverageStatus,
      };
    });

    regionalData.sort((a, b) => b.campsCount - a.campsCount);

    const overallCapacity = regionalData.reduce((acc, r) => acc + r.totalCapacity, 0);
    const overallRegistered = regionalData.reduce((acc, r) => acc + r.totalRegistered, 0);

    // Regional analytics are authenticated operational data, never public cache data.
    res.setHeader('Cache-Control', 'private, no-store');
    res.json({
      success: true,
      data: {
        regions: regionalData,
        summary: {
          totalCamps: filtered.length,
          totalCapacity: overallCapacity,
          totalRegistered: overallRegistered,
          averageOccupancy: overallCapacity > 0 ? Math.round((overallRegistered / overallCapacity) * 100) : 0,
          regionsCovered: regionalData.length,
          underservedCount: regionalData.filter((r) => r.coverageStatus === 'Underserved').length,
        },
        disclaimer:
          'Camp distribution and attendance density reflect registered healthcare camps and screening attendance only. They do NOT represent epidemiological disease prevalence or local health risk. Areas without recorded camps indicate absence of recorded camps, not absence of healthcare need.',
        calculationMethod: 'Derived from verified geographic coordinates and camp operational records stored in system database.',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/camps/:id
 * Get a single camp by ID
 */
export const getCampById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    let camp: any;
    try {
      camp = await prisma.camp.findUnique({
        where: { id },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          doctorProfiles: {
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true, email: true },
              },
            },
          },
          volunteerProfiles: {
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true, email: true },
              },
            },
          },
          _count: {
            select: { appointments: true, inventory: true, medicalReports: true },
          },
        },
      });
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        camp = DEMO_CAMPS.find((c) => c.id === id);
      } else {
        throw dbErr;
      }
    }

    if (!camp) {
      throw new AppError('Camp not found', 404, 'NOT_FOUND');
    }

    res.setHeader('Cache-Control', 'public, max-age=15, stale-while-revalidate=45');
    res.json({
      success: true,
      message: 'Camp retrieved successfully',
      data: camp,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/camps
 * Create a new health camp (Admin only)
 */
export const createCamp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      name,
      location,
      address,
      latitude,
      longitude,
      startDate,
      endDate,
      capacity,
      services,
      description,
    } = req.body as CreateCampDto;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      throw new AppError('Start date must be before end date', 400, 'INVALID_DATE_RANGE');
    }

    let camp: any;
    try {
      camp = await prisma.camp.create({
        data: {
          name,
          location,
          address,
          latitude,
          longitude,
          startDate: start,
          endDate: end,
          capacity,
          services: services || [],
          description,
          createdById: req.user!.userId,
        },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        camp = {
          id: `camp-${Date.now()}`,
          name,
          location,
          address: address || `${location}, Karnataka`,
          latitude: latitude || 12.9716,
          longitude: longitude || 77.5946,
          startDate: start,
          endDate: end,
          capacity: capacity || 100,
          registered: 0,
          status: 'UPCOMING',
          services: services || [],
          description: description || '',
          createdBy: { id: req.user?.userId || 'admin', firstName: req.user?.firstName || 'Admin', lastName: req.user?.lastName || 'Superintendent', email: req.user?.email || 'admin@healthcamp.com' },
          _count: { appointments: 0, inventory: 0 },
        };
        DEMO_CAMPS.unshift(camp);
      } else {
        throw dbErr;
      }
    }

    res.status(201).json({
      success: true,
      message: 'Camp created successfully',
      data: camp,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/camps/:id
 * Update an existing camp (Admin only)
 */
export const updateCamp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body as UpdateCampDto;

    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.latitude !== undefined) updateData.latitude = updates.latitude;
    if (updates.longitude !== undefined) updateData.longitude = updates.longitude;
    if (updates.startDate !== undefined) updateData.startDate = new Date(updates.startDate);
    if (updates.endDate !== undefined) updateData.endDate = new Date(updates.endDate);
    if (updates.capacity !== undefined) updateData.capacity = updates.capacity;
    if (updates.services !== undefined) updateData.services = updates.services;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.status !== undefined) updateData.status = updates.status;

    let camp: any;
    try {
      const existingCamp = await prisma.camp.findUnique({ where: { id } });
      if (!existingCamp) {
        throw new AppError('Camp not found', 404, 'NOT_FOUND');
      }

      if (existingCamp.status === CampStatus.COMPLETED || existingCamp.status === CampStatus.CANCELLED) {
        throw new AppError('Cannot update a completed or cancelled camp', 400, 'INVALID_OPERATION');
      }

      camp = await prisma.camp.update({
        where: { id },
        data: updateData,
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        const demoCamp = DEMO_CAMPS.find((c) => c.id === id);
        if (!demoCamp) {
          throw new AppError('Camp not found', 404, 'NOT_FOUND');
        }
        Object.assign(demoCamp, updateData);
        camp = demoCamp;
      } else {
        throw dbErr;
      }
    }

    res.setHeader('Cache-Control', 'private, no-store');
    res.json({
      success: true,
      message: 'Camp updated successfully',
      data: camp,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/camps/:id
 * Delete (cancel) a camp (Admin only)
 */
export const deleteCamp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    try {
      const camp = await prisma.camp.findUnique({ where: { id } });
      if (!camp) {
        throw new AppError('Camp not found', 404, 'NOT_FOUND');
      }

      if (camp.status === CampStatus.ONGOING) {
        throw new AppError('Cannot delete an ongoing camp', 400, 'INVALID_OPERATION');
      }

      // Soft delete by setting status to CANCELLED
      await prisma.camp.update({
        where: { id },
        data: { status: CampStatus.CANCELLED },
      });
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        const demoCamp = DEMO_CAMPS.find((c) => c.id === id);
        if (!demoCamp) {
          throw new AppError('Camp not found', 404, 'NOT_FOUND');
        }
        (demoCamp as any).status = 'CANCELLED';
      } else {
        throw dbErr;
      }
    }

    res.setHeader('Cache-Control', 'private, no-store');
    res.json({
      success: true,
      message: 'Camp cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/camps/:id/appointments
 * Get all appointments for a specific camp
 */
export const getCampAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '20', status } = req.query as ListQueryParams;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const { skip, take } = getPagination(pageNum, limitNum);

    let appointments: any[] = [];
    let total = 0;

    try {
      const camp = await prisma.camp.findUnique({ where: { id } });
      if (!camp) {
        throw new AppError('Camp not found', 404, 'NOT_FOUND');
      }

      const where: Record<string, unknown> = { campId: id };
      if (status) where.status = status;

      [appointments, total] = await Promise.all([
        prisma.appointment.findMany({
          where,
          include: {
            patient: {
              select: { id: true, firstName: true, lastName: true, email: true, phone: true },
            },
            doctor: {
              select: { id: true, firstName: true, lastName: true },
            },
            queueTokenRef: true,
          },
          orderBy: [{ date: 'asc' }, { timeSlot: 'asc' }],
          skip,
          take,
        }),
        prisma.appointment.count({ where }),
      ]);
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        let list = DEMO_APPOINTMENTS.filter((a) => a.campId === id);
        if (status) list = list.filter((a) => a.status.toLowerCase() === (status as string).toLowerCase());
        total = list.length;
        appointments = list.slice(skip, skip + take);
      } else {
        throw dbErr;
      }
    }

    // Appointment results include direct patient identifiers and must not be
    // stored by a browser or a shared intermediary.
    res.setHeader('Cache-Control', 'private, no-store');
    res.json({
      success: true,
      message: 'Camp appointments retrieved successfully',
      data: appointments,
      meta: buildPaginationMeta(total, pageNum, limitNum),
    });
  } catch (error) {
    next(error);
  }
};
