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
    const { qrData } = req.body;
    const user = req.user!;

    if (!qrData) {
      throw new AppError('QR data required', 400, 'MISSING_DATA');
    }

    let parsed: any;
    try {
      parsed = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
    } catch {
      throw new AppError('Invalid QR code format', 400, 'INVALID_QR');
    }

    if (parsed.app !== 'HEALTHCAMP_CHECKIN' || !parsed.aid) {
      throw new AppError('Unrecognized health camp QR code', 400, 'INVALID_QR');
    }

    const appointmentId = parsed.aid;
    let appointment: any = null;

    try {
      appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          camp: { select: { id: true, name: true, location: true } },
          queueTokenRef: true,
        },
      });

      if (appointment) {
        appointment = await prisma.appointment.update({
          where: { id: appointmentId },
          data: {
            checkedInAt: new Date(),
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
        appointment = DEMO_APPOINTMENTS.find((a) => a.id === appointmentId) || DEMO_APPOINTMENTS[0];
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

