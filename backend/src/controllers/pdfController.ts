import { Request, Response, NextFunction } from 'express';
import PDFDocument from 'pdfkit';
import { PrismaClient, Role } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { isDbConnectionError, DEMO_REPORTS, DEMO_INVENTORY } from '../utils/mockStore';

const prisma = new PrismaClient();

/**
 * GET /api/pdf/report/:reportId
 * Stream authorized medical report as PDF
 */
export const generateMedicalReportPDF = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { reportId } = req.params;
    const user = req.user!;

    let report: any = null;

    try {
      report = await prisma.medicalReport.findUnique({
        where: { id: reportId },
        include: {
          patient: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true },
          },
          doctor: {
            select: { id: true, firstName: true, lastName: true, doctorProfile: true },
          },
          camp: {
            select: { id: true, name: true, location: true, address: true },
          },
          vitalSigns: true,
          referrals: true,
        },
      });
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        report = DEMO_REPORTS.find((r) => r.id === reportId) || null;
      } else {
        throw dbErr;
      }
    }

    if (!report) {
      throw new AppError('Medical report not found', 404, 'NOT_FOUND');
    }

    // Role-based authorization
    const isOwner = report.patientId === user.userId;
    const isDoctor = report.doctorId === user.userId;
    const isAdmin = [Role.ADMIN, Role.ORGANIZER].includes(user.role as any);

    if (!isOwner && !isDoctor && !isAdmin) {
      throw new AppError('You are not authorized to export this confidential medical report', 403, 'FORBIDDEN');
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="medical_report_${reportId}.pdf"`);
    res.setHeader('Cache-Control', 'private, no-store');

    doc.pipe(res);

    // Header styling
    doc.fillColor('#0a2540')
       .fontSize(20)
       .text('SMART COMMUNITY HEALTH CAMP', { align: 'center' });
    doc.fontSize(11)
       .fillColor('#4a5568')
       .text('Official Medical Observation & Health Screening Record', { align: 'center' });
    doc.moveDown(0.5);

    doc.strokeColor('#0ea5e9')
       .lineWidth(1.5)
       .moveTo(50, doc.y)
       .lineTo(545, doc.y)
       .stroke();
    doc.moveDown(1);

    // Metadata block
    doc.fillColor('#1a202c').fontSize(12).font('Helvetica-Bold').text('Report Information:');
    doc.font('Helvetica').fontSize(10);
    doc.text(`Report ID: ${report.id}`);
    doc.text(`Date of Examination: ${new Date(report.createdAt).toLocaleDateString()}`);
    doc.text(`Camp Location: ${report.camp?.name || 'Community Health Camp'} (${report.camp?.location || ''})`);
    doc.moveDown(0.8);

    // Patient & Doctor columns
    const colY = doc.y;
    doc.font('Helvetica-Bold').fontSize(11).text('Patient Details:', 50, colY);
    doc.font('Helvetica').fontSize(10);
    doc.text(`Name: ${report.patient?.firstName || ''} ${report.patient?.lastName || ''}`);
    doc.text(`Email: ${report.patient?.email || 'N/A'}`);
    doc.text(`Contact: ${report.patient?.phone || 'N/A'}`);

    doc.font('Helvetica-Bold').fontSize(11).text('Attending Physician:', 320, colY);
    doc.font('Helvetica').fontSize(10);
    doc.text(`Dr. ${report.doctor?.firstName || ''} ${report.doctor?.lastName || ''}`, 320);
    doc.text(`Specialization: ${report.doctor?.doctorProfile?.specialization || 'General Practitioner'}`, 320);
    doc.text(`License No: ${report.doctor?.doctorProfile?.licenseNumber || 'Verified Medical Officer'}`, 320);

    doc.moveDown(2);

    // Diagnosis Section
    doc.fillColor('#0a2540').font('Helvetica-Bold').fontSize(12).text('Clinical Diagnosis:');
    doc.font('Helvetica').fontSize(10).fillColor('#2d3748').text(report.diagnosis || 'General checkup - no acute illness diagnosed.');
    doc.moveDown(0.8);

    // Observations
    if (report.observations) {
      doc.fillColor('#0a2540').font('Helvetica-Bold').fontSize(12).text('Physician Observations:');
      doc.font('Helvetica').fontSize(10).fillColor('#2d3748').text(report.observations);
      doc.moveDown(0.8);
    }

    // Vital Signs
    if (report.vitalSigns && report.vitalSigns.length > 0) {
      const v = report.vitalSigns[0];
      doc.fillColor('#0a2540').font('Helvetica-Bold').fontSize(12).text('Recorded Vital Signs:');
      doc.font('Helvetica').fontSize(10).fillColor('#2d3748');
      doc.text(`• Blood Pressure: ${v.bloodPressureSystolic || 120}/${v.bloodPressureDiastolic || 80} mmHg`);
      doc.text(`• Heart Rate: ${v.heartRate || 72} bpm`);
      doc.text(`• Blood Sugar: ${v.bloodSugar || 95} mg/dL`);
      if (v.oxygenSaturation) doc.text(`• Oxygen Saturation (SpO2): ${v.oxygenSaturation}%`);
      doc.moveDown(0.8);
    }

    // Prescription
    if (report.prescription) {
      doc.fillColor('#0a2540').font('Helvetica-Bold').fontSize(12).text('Prescribed Medication & Instructions:');
      doc.font('Helvetica').fontSize(10).fillColor('#2d3748').text(report.prescription);
      doc.moveDown(0.8);
    }

    // Referral
    if (report.referral) {
      doc.fillColor('#b91c1c').font('Helvetica-Bold').fontSize(12).text('Medical Referral:');
      doc.font('Helvetica').fontSize(10).fillColor('#7f1d1d').text(report.referral);
      doc.moveDown(0.8);
    }

    // Confidentiality and Disclaimer footer
    doc.moveDown(2);
    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(8).fillColor('#718096').text(
      'NOTICE: This medical record is issued by authorized personnel of the Smart Community Health Camp System. It contains confidential health information protected under applicable privacy protocols. For emergencies, contact local emergency services (108).',
      { align: 'center' }
    );

    doc.end();
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/pdf/inventory/:campId
 * Generate printable inventory stock sheet for camp staff
 */
export const generateInventoryReportPDF = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { campId } = req.params;

    let items: any[] = [];
    try {
      items = await prisma.inventory.findMany({
        where: { campId },
        include: { camp: true },
        orderBy: { medicineName: 'asc' },
      });
    } catch (dbErr) {
      if (isDbConnectionError(dbErr)) {
        items = DEMO_INVENTORY.filter((i) => i.campId === campId || campId === 'camp-1');
      } else {
        throw dbErr;
      }
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="inventory_camp_${campId}.pdf"`);

    doc.pipe(res);

    doc.fillColor('#0a2540').fontSize(18).text('COMMUNITY HEALTH CAMP - INVENTORY DISPATCH', { align: 'center' });
    doc.fontSize(10).fillColor('#4a5568').text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(1);

    doc.strokeColor('#0ea5e9').lineWidth(1.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    doc.font('Helvetica-Bold').fontSize(10).fillColor('#1a202c');
    doc.text('Item Name', 50);
    doc.text('Generic / Supplier', 220, doc.y - 12);
    doc.text('Qty', 420, doc.y - 12);
    doc.text('Status', 480, doc.y - 12);
    doc.moveDown(0.5);

    doc.font('Helvetica').fontSize(9).fillColor('#2d3748');

    items.forEach((item) => {
      const isLow = item.quantity <= item.lowStockThreshold;
      doc.text(item.medicineName, 50);
      doc.text(`${item.genericName || 'N/A'} (${item.supplier || 'Standard'})`, 220, doc.y - 11);
      doc.text(`${item.quantity} ${item.unit}`, 420, doc.y - 11);
      doc.fillColor(isLow ? '#dc2626' : '#16a34a').text(isLow ? 'LOW STOCK' : 'Adequate', 480, doc.y - 11);
      doc.fillColor('#2d3748');
      doc.moveDown(0.4);
    });

    doc.end();
  } catch (error) {
    next(error);
  }
};

