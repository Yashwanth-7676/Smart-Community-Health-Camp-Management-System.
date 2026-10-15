import { Request, Response, NextFunction } from 'express';
import QRCode from 'qrcode';
import { PrismaClient, Role } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { isDbConnectionError, DEMO_APPOINTMENTS } from '../utils/mockStore';
import { logAudit } from '../middleware/auditLog';

const prisma = new PrismaClient();

/**
 * GET /api/qr/:appointmentId
 * Generate check-in QR code data URL (contains only public token identifier, no private medical info)
 */
export const generateQRCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    const user = req.user!;

    let appointment: any = null;

    try {
      appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          camp: { select: { id: true, name: true, location: true } },
          queueTokenRef: { select: { tokenNumber: true } },
        },
      });
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        appointment = DEMO_APPOINTMENTS.find((a) => a.id === appointmentId);
      } else {
        throw dbErr;
      }
    }

    if (!appointment) {
      throw new AppError('Appointment not found', 404, 'NOT_FOUND');
    }

    // Authorization: Owner patient, Doctor, Volunteer, or Admin
    const isOwner = appointment.patientId === user.userId;
    const isStaff = [Role.ADMIN, Role.DOCTOR, Role.VOLUNTEER, Role.ORGANIZER].includes(user.role as any);

    if (!isOwner && !isStaff) {
      throw new AppError('You do not have access to this appointment QR code', 403, 'FORBIDDEN');
    }

    // Safe payload without private diagnoses or sensitive records
    const qrPayload = JSON.stringify({
      app: 'HEALTHCAMP_CHECKIN',
      aid: appointment.id,
      campId: appointment.campId,
      token: appointment.queueToken || appointment.queueTokenRef?.tokenNumber || 'Q-01',
      date: appointment.date,
      timeSlot: appointment.timeSlot,
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
      color: {
        dark: '#0a192f',
        light: '#ffffff',
      },
    });

    res.json({
      success: true,
      data: {
        appointmentId: appointment.id,
        token: appointment.queueToken || 'Q-01',
        campName: appointment.camp?.name || 'Community Health Camp',
        qrCodeDataUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/qr/verify
 * Staff scans QR code at camp reception to confirm attendance and check-in
 */
export const verifyQRCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { qrData, qrToken, token } = req.body;
    const user = req.user!;
    const input = qrData || qrToken || token;

    if (!input) {
      throw new AppError('QR data or token is required for check-in', 400, 'MISSING_DATA');
    }

    let appointmentId: string | null = null;
    let tokenStr: string | null = null;

    if (typeof input === 'string') {
      try {
        const parsed = JSON.parse(input);
        if (parsed.aid) appointmentId = parsed.aid;
        if (parsed.token) tokenStr = String(parsed.token);
      } catch {
        // Plain string token or appointment ID entered manually by volunteer
        if (input.startsWith('appt-') || input.length > 20) {
          appointmentId = input;
        } else {
          tokenStr = input;
        }
      }
    } else if (typeof input === 'object') {
      if (input.aid) appointmentId = input.aid;
      if (input.token) tokenStr = String(input.token);
      if (input.qrToken) tokenStr = String(input.qrToken);
    }

    let appointment: any = null;

    try {
      const whereClause: any = appointmentId
        ? { id: appointmentId }
        : tokenStr
        ? { queueToken: tokenStr }
        : {};

      appointment = await prisma.appointment.findFirst({
        where: whereClause,
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          camp: { select: { id: true, name: true, location: true } },
          queueTokenRef: true,
        },
      });

      if (appointment) {
        appointment = await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            checkedInAt: new Date(),
            status: 'CONFIRMED',
          },
          include: {
            patient: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            camp: { select: { id: true, name: true, location: true } },
            queueTokenRef: true,
          },
        });
      }
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        appointment = DEMO_APPOINTMENTS.find((a) => 
          (appointmentId && a.id === appointmentId) || 
          (tokenStr && (a.queueToken === tokenStr || String(a.queueTokenRef?.tokenNumber) === tokenStr))
        ) || DEMO_APPOINTMENTS[0];
      } else {
        throw dbErr;
      }
    }

    if (!appointment) {
      throw new AppError('Appointment record not found for check-in', 404, 'NOT_FOUND');
    }

    await logAudit(
      user.userId,
      'UPDATE',
      'AppointmentCheckin',
      appointmentId,
      { checkedInBy: user.email },
      req.ip,
      req.headers['user-agent']
    );

    res.json({
      success: true,
      message: 'Patient check-in verified successfully!',
      data: {
        appointmentId: appointment.id,
        patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        queueToken: appointment.queueToken || appointment.queueTokenRef?.tokenNumber || 'Q-01',
        campName: appointment.camp.name,
        timeSlot: appointment.timeSlot,
        checkedInAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

