import { Request, Response, NextFunction } from 'express';
import { AuditAction, PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { getPagination, buildPaginationMeta, sanitizeUser } from '../utils/helpers';
import { UpdatePatientProfileDto, ListQueryParams } from '../types';
import { isDbConnectionError, DEMO_APPOINTMENTS, DEMO_REPORTS, DEMO_FOLLOW_UPS, DEMO_CAMPS } from '../utils/mockStore';
import { logAudit } from '../middleware/auditLog';

const prisma = new PrismaClient();

const TIMELINE_TYPES = [
  'ALL',
  'APPOINTMENT',
  'CAMP_VISIT',
  'SCREENING',
  'CONSULTATION',
  'PRESCRIPTION',
  'REFERRAL',
  'FOLLOW_UP',
] as const;

type TimelineType = (typeof TIMELINE_TYPES)[number];

interface PatientTimelineEvent {
  id: string;
  recordId: string;
  type: Exclude<TimelineType, 'ALL'>;
  occurredAt: Date;
  title: string;
  summary: string;
  source: string;
  author: { id: string; name: string } | null;
  verificationStatus: 'doctor_verified' | 'system_recorded';
  details: {
    fields: Array<{ label: string; value: string }>;
    measurements?: Array<{ label: string; value: string; unit: string }>;
  };
}

function getTimelineDate(value: unknown, field: string): Date | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AppError(`${field} must be a date in YYYY-MM-DD format`, 400, 'INVALID_DATE');
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new AppError(`${field} must be a valid calendar date`, 400, 'INVALID_DATE');
  }
  return date;
}

function authorName(person: { firstName: string; lastName: string } | null): string | null {
  return person ? `${person.firstName} ${person.lastName}`.trim() : null;
}

/**
 * GET /api/v1/patients
 * Get all patients (Admin/Doctor only)
 */
export const getPatients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = '1', limit = '10', search } = req.query as ListQueryParams;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const { skip, take } = getPagination(pageNum, limitNum);

    const where: Record<string, unknown> = { role: 'PATIENT', isActive: true };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [patients, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          patientProfile: true,
          _count: { select: { appointmentsAsPatient: true, medicalReportsAsPatient: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      message: 'Patients retrieved successfully',
      data: patients,
      meta: buildPaginationMeta(total, pageNum, limitNum),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/patients/:id
 * Get a single patient by ID
 */
export const getPatientById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // Patients can only view their own profile
    if (req.user!.role === 'PATIENT' && id !== req.user!.userId) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }

    const patient = await prisma.user.findUnique({
      where: { id, role: 'PATIENT' },
      include: {
        patientProfile: true,
        _count: {
          select: {
            appointmentsAsPatient: true,
            medicalReportsAsPatient: true,
            followUpsAsPatient: true,
          },
        },
      },
    });

    if (!patient) {
      throw new AppError('Patient not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      message: 'Patient retrieved successfully',
      data: sanitizeUser(patient),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/patients/:id
 * Update patient profile
 */
export const updatePatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Patients can only update their own profile
    if (req.user!.role === 'PATIENT' && id !== req.user!.userId) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }

    const patient = await prisma.user.findUnique({ where: { id, role: 'PATIENT' } });
    if (!patient) {
      throw new AppError('Patient not found', 404, 'NOT_FOUND');
    }

    const { firstName, lastName, phone, avatar } = updates;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(avatar !== undefined && { avatar }),
      },
      include: { patientProfile: true },
    });

    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: sanitizeUser(updatedUser),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/patients/profile
 * Create or update patient medical profile
 */
export const upsertPatientProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const {
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      medicalHistory,
      allergies,
      emergencyContact,
    } = req.body as UpdatePatientProfileDto;

    const profile = await prisma.patientProfile.upsert({
      where: { userId },
      create: {
        userId,
        ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
        ...(gender && { gender }),
        ...(bloodGroup && { bloodGroup }),
        ...(address && { address }),
        ...(medicalHistory && { medicalHistory }),
        ...(allergies && { allergies }),
        ...(emergencyContact && { emergencyContact: emergencyContact as any }),
      },
      update: {
        ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
        ...(gender && { gender }),
        ...(bloodGroup && { bloodGroup }),
        ...(address !== undefined && { address }),
        ...(medicalHistory !== undefined && { medicalHistory }),
        ...(allergies && { allergies }),
        ...(emergencyContact && { emergencyContact: emergencyContact as any }),
      },
    });

    res.json({
      success: true,
      message: 'Patient profile updated successfully',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/patients/:id/appointments
 * Get all appointments for a patient
 */
export const getPatientAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '10' } = req.query as ListQueryParams;

    if (req.user!.role === 'PATIENT' && id !== req.user!.userId) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const { skip, take } = getPagination(pageNum, limitNum);

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where: { patientId: id },
        include: {
          camp: { select: { id: true, name: true, location: true, address: true, status: true } },
          doctor: { select: { id: true, firstName: true, lastName: true } },
          queueTokenRef: true,
        },
        orderBy: { date: 'desc' },
        skip,
        take,
      }),
      prisma.appointment.count({ where: { patientId: id } }),
    ]);

    res.json({
      success: true,
      message: 'Patient appointments retrieved',
      data: appointments,
      meta: buildPaginationMeta(total, pageNum, limitNum),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/patients/:id/reports
 * Get medical reports for a patient
 */
export const getPatientReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '10' } = req.query as ListQueryParams;

    // Patients can only view their own non-confidential reports
    if (req.user!.role === 'PATIENT' && id !== req.user!.userId) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const { skip, take } = getPagination(pageNum, limitNum);

    const where: Record<string, unknown> = { patientId: id };

    // Patients cannot see confidential reports
    if (req.user!.role === 'PATIENT') {
      where.isConfidential = false;
      where.status = 'PUBLISHED';
    } else if (req.user!.role === 'DOCTOR') {
      where.doctorId = req.user!.userId;
    }

    const [reports, total] = await Promise.all([
      prisma.medicalReport.findMany({
        where,
        include: {
          doctor: { select: { id: true, firstName: true, lastName: true } },
          camp: { select: { id: true, name: true, location: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.medicalReport.count({ where }),
    ]);

    res.json({
      success: true,
      message: 'Patient medical reports retrieved',
      data: reports,
      meta: buildPaginationMeta(total, pageNum, limitNum),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/patients/journey-stats
 * Get comprehensive patient journey statistics for the authenticated patient
 */
export const getPatientJourneyStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patientId = req.user!.userId;
    const now = new Date();

    const [
      totalAppointments,
      completedVisits,
      upcomingAppointments,
      cancelledAppointments,
      pendingFollowUps,
      reportsAvailable,
      lastVisitResult,
      nextCampResult,
    ] = await Promise.all([
      prisma.appointment.count({ where: { patientId } }),
      prisma.appointment.count({ where: { patientId, status: 'COMPLETED' } }),
      prisma.appointment.count({ where: { patientId, status: { in: ['CONFIRMED', 'PENDING'] }, date: { gte: now } } }),
      prisma.appointment.count({ where: { patientId, status: 'CANCELLED' } }),
      (prisma as any).followUp
        ? (prisma as any).followUp.count({ where: { patientId, status: { in: ['PENDING', 'SCHEDULED'] } } })
        : Promise.resolve(0),
      prisma.medicalReport.count({ where: { patientId, isConfidential: false, status: 'PUBLISHED' } }),
      prisma.appointment.findFirst({
        where: { patientId, status: 'COMPLETED' },
        orderBy: { date: 'desc' },
        select: { date: true },
      }),
      prisma.camp.findFirst({
        where: { status: 'UPCOMING', startDate: { gte: now } },
        orderBy: { startDate: 'asc' },
        select: { id: true, name: true, startDate: true },
      }),
    ]);

    res.json({
      success: true,
      message: 'Patient journey stats retrieved successfully',
      data: {
        totalAppointments,
        completedVisits,
        upcomingAppointments,
        cancelledAppointments,
        pendingFollowUps,
        reportsAvailable,
        lastVisitDate: lastVisitResult?.date?.toISOString() ?? null,
        nextScheduledCamp: nextCampResult
          ? { id: nextCampResult.id, name: nextCampResult.name, date: nextCampResult.startDate.toISOString() }
          : null,
      },
    });
  } catch (error) {
    if (isDbConnectionError(error)) {
      const patientId = req.user!.userId;
      const patientAppointments = DEMO_APPOINTMENTS.filter((a) => a.patientId === patientId);
      const patientFollowUps = DEMO_FOLLOW_UPS.filter((f) => f.patientId === patientId);
      const patientReports = DEMO_REPORTS.filter((r) => r.patientId === patientId && !r.isConfidential);
      const now = new Date();
      const upcomingCamp = DEMO_CAMPS.filter((c) => c.status === 'UPCOMING' && new Date(c.startDate) >= now)
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
      const lastCompleted = patientAppointments
        .filter((a) => a.status === 'COMPLETED')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      res.json({
        success: true,
        message: 'Patient journey stats retrieved successfully (demonstration mode)',
        data: {
          totalAppointments: patientAppointments.length,
          completedVisits: patientAppointments.filter((a) => a.status === 'COMPLETED').length,
          upcomingAppointments: patientAppointments.filter(
            (a) => ['CONFIRMED', 'PENDING'].includes(a.status) && new Date(a.date) >= now,
          ).length,
          cancelledAppointments: patientAppointments.filter((a) => a.status === 'CANCELLED').length,
          pendingFollowUps: patientFollowUps.filter((f) => ['PENDING', 'SCHEDULED'].includes(f.status)).length,
          reportsAvailable: patientReports.length,
          lastVisitDate: lastCompleted ? new Date(lastCompleted.date).toISOString() : null,
          nextScheduledCamp: upcomingCamp
            ? { id: upcomingCamp.id, name: upcomingCamp.name, date: new Date(upcomingCamp.startDate).toISOString() }
            : null,
        },
      });
      return;
    }
    next(error);
  }
};

/**
 * GET /api/v1/patients/timeline
 * Return the authenticated patient's own authorized care history.
 */
export const getPatientTimeline = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const patientId = req.user!.userId;
    if (req.query.type !== undefined && typeof req.query.type !== 'string') {
      throw new AppError('type must be a single event type', 400, 'INVALID_TIMELINE_TYPE');
    }
    const typeParam = typeof req.query.type === 'string' ? req.query.type.toUpperCase() : 'ALL';
    if (!TIMELINE_TYPES.includes(typeParam as TimelineType)) {
      throw new AppError(`type must be one of: ${TIMELINE_TYPES.join(', ')}`, 400, 'INVALID_TIMELINE_TYPE');
    }

    const startDate = getTimelineDate(req.query.startDate, 'startDate');
    const endDate = getTimelineDate(req.query.endDate, 'endDate');
    if (startDate && endDate && startDate > endDate) {
      throw new AppError('startDate must be on or before endDate', 400, 'INVALID_DATE_RANGE');
    }

    const endExclusive = endDate
      ? new Date(endDate.getTime() + 24 * 60 * 60 * 1000)
      : undefined;
    const dateFilter = {
      ...(startDate && { gte: startDate }),
      ...(endExclusive && { lt: endExclusive }),
    };
    const hasDateFilter = startDate !== undefined || endExclusive !== undefined;

    const [appointments, reports, followUps, referrals] = await Promise.all([
      prisma.appointment.findMany({
        where: { patientId, ...(hasDateFilter && { date: dateFilter }) },
        select: {
          id: true,
          date: true,
          timeSlot: true,
          status: true,
          queueToken: true,
          camp: { select: { name: true, location: true } },
          doctor: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { date: 'desc' },
        take: 101,
      }),
      prisma.medicalReport.findMany({
        where: {
          patientId,
          isConfidential: false,
          status: 'PUBLISHED',
          ...(hasDateFilter && { createdAt: dateFilter }),
        },
        select: {
          id: true,
          createdAt: true,
          diagnosis: true,
          observations: true,
          prescription: true,
          doctor: { select: { id: true, firstName: true, lastName: true } },
          camp: { select: { name: true } },
          vitalSigns: {
            select: {
              bloodPressureSystolic: true,
              bloodPressureDiastolic: true,
              heartRate: true,
              temperature: true,
              weight: true,
              height: true,
              bloodSugar: true,
              oxygenSaturation: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 101,
      }),
      prisma.followUp.findMany({
        where: { patientId, ...(hasDateFilter && { scheduledDate: dateFilter }) },
        select: {
          id: true,
          scheduledDate: true,
          status: true,
          notes: true,
          doctor: { select: { id: true, firstName: true, lastName: true } },
          camp: { select: { name: true } },
        },
        orderBy: { scheduledDate: 'desc' },
        take: 101,
      }),
      prisma.referral.findMany({
        where: { patientId, ...(hasDateFilter && { createdAt: dateFilter }) },
        select: {
          id: true,
          createdAt: true,
          hospitalName: true,
          department: true,
          reason: true,
          urgency: true,
          status: true,
          doctor: { select: { id: true, firstName: true, lastName: true } },
          camp: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 101,
      }),
    ]);

    const events: PatientTimelineEvent[] = [];

    for (const appointment of appointments) {
      const completed = appointment.status === 'COMPLETED';
      events.push({
        id: `appointment:${appointment.id}`,
        recordId: appointment.id,
        type: completed ? 'CAMP_VISIT' : 'APPOINTMENT',
        occurredAt: appointment.date,
        title: completed ? 'Health camp visit' : 'Camp appointment',
        summary: appointment.camp.name,
        source: 'Camp appointment',
        author: appointment.doctor
          ? { id: appointment.doctor.id, name: authorName(appointment.doctor)! }
          : null,
        verificationStatus: 'system_recorded',
        details: {
          fields: [
            { label: 'Status', value: appointment.status },
            { label: 'Time slot', value: appointment.timeSlot },
            ...(appointment.camp.location
              ? [{ label: 'Location', value: appointment.camp.location }]
              : []),
            ...(appointment.queueToken
              ? [{ label: 'Queue token', value: appointment.queueToken }]
              : []),
          ],
        },
      });
    }

    for (const report of reports) {
      const measurements = report.vitalSigns.flatMap((vitals) => [
        ...(vitals.bloodPressureSystolic !== null && vitals.bloodPressureDiastolic !== null
          ? [{
              label: 'Blood pressure',
              value: `${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic}`,
              unit: 'mmHg',
            }]
          : []),
        ...(vitals.heartRate !== null
          ? [{ label: 'Heart rate', value: String(vitals.heartRate), unit: 'bpm' }]
          : []),
        ...(vitals.temperature !== null
          ? [{ label: 'Temperature', value: String(vitals.temperature), unit: '°F' }]
          : []),
        ...(vitals.weight !== null
          ? [{ label: 'Weight', value: String(vitals.weight), unit: 'kg' }]
          : []),
        ...(vitals.height !== null
          ? [{ label: 'Height', value: String(vitals.height), unit: 'cm' }]
          : []),
        ...(vitals.bloodSugar !== null
          ? [{ label: 'Blood sugar', value: String(vitals.bloodSugar), unit: 'mg/dL' }]
          : []),
        ...(vitals.oxygenSaturation !== null
          ? [{ label: 'Oxygen saturation', value: String(vitals.oxygenSaturation), unit: '%' }]
          : []),
      ]);
      const author = { id: report.doctor.id, name: authorName(report.doctor)! };
      const reportType = measurements.length > 0 ? 'SCREENING' : 'CONSULTATION';
      const clinicalFields = [
        { label: 'Camp', value: report.camp.name },
        { label: 'Assessment', value: report.diagnosis },
        ...(report.observations ? [{ label: 'Observations', value: report.observations }] : []),
      ];

      events.push({
        id: `report:${report.id}`,
        recordId: report.id,
        type: reportType,
        occurredAt: report.createdAt,
        title: measurements.length > 0 ? 'Screening record' : 'Doctor consultation',
        summary: report.camp.name,
        source: 'Published medical report',
        author,
        verificationStatus: 'doctor_verified',
        details: { fields: clinicalFields, ...(measurements.length > 0 && { measurements }) },
      });

      if (report.prescription) {
        events.push({
          id: `prescription:${report.id}`,
          recordId: report.id,
          type: 'PRESCRIPTION',
          occurredAt: report.createdAt,
          title: 'Prescription',
          summary: report.camp.name,
          source: 'Published medical report',
          author,
          verificationStatus: 'doctor_verified',
          details: { fields: [{ label: 'Prescription', value: report.prescription }] },
        });
      }
    }

    for (const followUp of followUps) {
      events.push({
        id: `follow-up:${followUp.id}`,
        recordId: followUp.id,
        type: 'FOLLOW_UP',
        occurredAt: followUp.scheduledDate,
        title: 'Follow-up appointment',
        summary: followUp.camp.name,
        source: 'Follow-up record',
        author: { id: followUp.doctor.id, name: authorName(followUp.doctor)! },
        verificationStatus: 'doctor_verified',
        details: {
          fields: [
            { label: 'Status', value: followUp.status },
            ...(followUp.notes ? [{ label: 'Notes', value: followUp.notes }] : []),
          ],
        },
      });
    }

    for (const referral of referrals) {
      events.push({
        id: `referral:${referral.id}`,
        recordId: referral.id,
        type: 'REFERRAL',
        occurredAt: referral.createdAt,
        title: 'Referral',
        summary: `${referral.department} · ${referral.hospitalName}`,
        source: 'Referral record',
        author: { id: referral.doctor.id, name: authorName(referral.doctor)! },
        verificationStatus: 'doctor_verified',
        details: {
          fields: [
            { label: 'Facility', value: referral.hospitalName },
            { label: 'Department', value: referral.department },
            { label: 'Reason', value: referral.reason },
            { label: 'Urgency', value: referral.urgency },
            { label: 'Status', value: referral.status },
          ],
        },
      });
    }

    const matchingEvents = events
      .filter((event) => typeParam === 'ALL' || event.type === typeParam)
      .sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime());
    const data = matchingEvents.slice(0, 100);
    const truncated =
      matchingEvents.length > 100 ||
      appointments.length > 100 ||
      reports.length > 100 ||
      followUps.length > 100 ||
      referrals.length > 100;

    await logAudit(
      patientId,
      AuditAction.VIEW,
      'PATIENT_HEALTH_TIMELINE',
      patientId,
      { type: typeParam, startDate: req.query.startDate, endDate: req.query.endDate, resultCount: data.length },
      req.ip,
      req.get('user-agent'),
    );

    res.json({
      success: true,
      message: 'Patient health timeline retrieved successfully',
      data,
      meta: { total: data.length, limit: 100, truncated },
    });
  } catch (error) {
    next(error);
  }
};
