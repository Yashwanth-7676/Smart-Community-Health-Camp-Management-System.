import { Request, Response, NextFunction } from 'express';
import {
  AuditAction,
  EducationCategory,
  EducationContentStatus,
  EducationFormat,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';
import { logAudit } from '../middleware/auditLog';

const prisma = new PrismaClient();
const languagePattern = /^[a-z]{2}(?:-[A-Z]{2})?$/;
const httpsUrlSchema = z.string().url().max(2048).refine((value) => new URL(value).protocol === 'https:');

const translationSchema = z.object({
  language: z.string().regex(languagePattern),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(500),
  body: z.string().trim().min(20).max(50000),
  imageUrl: httpsUrlSchema.optional(),
  videoUrl: httpsUrlSchema.optional(),
  readingMinutes: z.number().int().min(1).max(240).default(1),
  sourceReferences: z.array(httpsUrlSchema).min(1).max(20),
  isMachineTranslated: z.boolean().default(false),
});

const educationResourceBodySchema = z.object({
  slug: z.string().trim().min(3).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  category: z.nativeEnum(EducationCategory),
  format: z.nativeEnum(EducationFormat).default(EducationFormat.ARTICLE),
  translations: z.array(translationSchema).min(1).max(10)
    .refine((items) => new Set(items.map((item) => item.language)).size === items.length, {
      message: 'Each language may only appear once',
    }),
}).superRefine((resource, context) => {
  if (resource.format === EducationFormat.VIDEO) {
    resource.translations.forEach((translation, index) => {
      if (!translation.videoUrl) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['translations', index, 'videoUrl'],
          message: 'Video resources require a video URL for every language',
        });
      }
    });
  }
});

export const educationResourceSchema = z.object({ body: educationResourceBodySchema });

export const educationReviewSchema = z.object({
  body: z.object({
    decision: z.enum(['APPROVED', 'REJECTED']),
  }),
});

export const educationProgressSchema = z.object({
  body: z.object({
    progressPercent: z.number().int().min(0).max(100).optional(),
    isBookmarked: z.boolean().optional(),
  }).refine((body) => body.progressPercent !== undefined || body.isBookmarked !== undefined, {
    message: 'Provide progressPercent or isBookmarked',
  }),
});

const publicTranslationSelect = {
  id: true,
  language: true,
  title: true,
  description: true,
  body: true,
  imageUrl: true,
  videoUrl: true,
  readingMinutes: true,
  sourceReferences: true,
  isMachineTranslated: true,
  status: true,
  reviewedAt: true,
  reviewer: { select: { firstName: true, lastName: true } },
} satisfies Prisma.EducationTranslationSelect;

export const listEducationResources = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const language = typeof req.query.language === 'string' ? req.query.language : 'en';
    if (!languagePattern.test(language)) {
      throw new AppError('language must be a language code such as en or kn', 400, 'INVALID_LANGUAGE');
    }

    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const bookmarkedOnly = req.query.bookmarked === 'true';
    if (bookmarkedOnly && !req.user) {
      throw new AppError('Sign in to view your saved lessons', 401, 'AUTHENTICATION_REQUIRED');
    }
    const category = typeof req.query.category === 'string' ? req.query.category.toUpperCase() : undefined;
    if (category && !Object.values(EducationCategory).includes(category as EducationCategory)) {
      throw new AppError('Unknown education category', 400, 'INVALID_CATEGORY');
    }
    const page = typeof req.query.page === 'string' && /^\d+$/.test(req.query.page)
      ? Math.max(1, Number(req.query.page))
      : 1;
    const requestedLimit = typeof req.query.limit === 'string' && /^\d+$/.test(req.query.limit)
      ? Number(req.query.limit)
      : 12;
    const limit = Math.min(Math.max(requestedLimit, 1), 50);

    const where: Prisma.EducationResourceWhereInput = {
      status: EducationContentStatus.APPROVED,
      ...(category && { category: category as EducationCategory }),
      ...(bookmarkedOnly && {
        progress: {
          some: {
            userId: req.user!.userId,
            isBookmarked: true,
            translation: { language },
          },
        },
      }),
      translations: {
        some: {
          language,
          status: EducationContentStatus.APPROVED,
          ...(query && {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { body: { contains: query, mode: 'insensitive' } },
            ],
          }),
        },
      },
    };

    const [resources, total] = await Promise.all([
      prisma.educationResource.findMany({
        where,
        include: {
          author: { select: { firstName: true, lastName: true } },
          translations: {
            where: { language, status: EducationContentStatus.APPROVED },
            select: publicTranslationSelect,
          },
          ...(req.user && {
            progress: {
              where: { userId: req.user.userId },
              select: { translationId: true, progressPercent: true, isBookmarked: true, completedAt: true },
            },
          }),
        },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.educationResource.count({ where }),
    ]);

    res.json({
      success: true,
      message: 'Approved education resources retrieved',
      data: resources,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const listEducationLanguages = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const languages = await prisma.educationTranslation.findMany({
      where: {
        status: EducationContentStatus.APPROVED,
        resource: { status: EducationContentStatus.APPROVED },
      },
      select: { language: true },
      distinct: ['language'],
      orderBy: { language: 'asc' },
    });
    res.json({ success: true, message: 'Available education languages retrieved', data: languages.map(({ language }) => language) });
  } catch (error) {
    next(error);
  }
};

export const getMyEducationProgress = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const progress = await prisma.educationProgress.findMany({
      where: {
        userId: req.user!.userId,
        resource: { status: EducationContentStatus.APPROVED },
        translation: { status: EducationContentStatus.APPROVED },
      },
      select: {
        translationId: true,
        progressPercent: true,
        isBookmarked: true,
        lastReadAt: true,
        completedAt: true,
        resource: { select: { slug: true, category: true } },
        translation: { select: { language: true, title: true, description: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });

    res.json({ success: true, message: 'Learning progress retrieved', data: progress });
  } catch (error) {
    next(error);
  }
};

export const updateMyEducationProgress = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const translation = await prisma.educationTranslation.findFirst({
      where: {
        id: req.params.translationId,
        status: EducationContentStatus.APPROVED,
        resource: { status: EducationContentStatus.APPROVED },
      },
      select: { id: true, resourceId: true },
    });
    if (!translation) {
      throw new AppError('Education resource not found', 404, 'NOT_FOUND');
    }

    const body = educationProgressSchema.shape.body.parse(req.body);
    const existing = await prisma.educationProgress.findUnique({
      where: {
        userId_translationId: {
          userId: req.user!.userId,
          translationId: translation.id,
        },
      },
      select: { progressPercent: true, completedAt: true },
    });
    const progressPercent = body.progressPercent === undefined
      ? (existing?.progressPercent ?? 0)
      : Math.max(existing?.progressPercent ?? 0, body.progressPercent);
    const completedAt = progressPercent === 100
      ? (existing?.completedAt ?? new Date())
      : existing?.completedAt;

    const progress = await prisma.educationProgress.upsert({
      where: {
        userId_translationId: {
          userId: req.user!.userId,
          translationId: translation.id,
        },
      },
      create: {
        userId: req.user!.userId,
        resourceId: translation.resourceId,
        translationId: translation.id,
        progressPercent,
        isBookmarked: body.isBookmarked ?? false,
        lastReadAt: body.progressPercent === undefined ? null : new Date(),
        ...(completedAt && { completedAt }),
      },
      update: {
        progressPercent,
        ...(body.isBookmarked !== undefined && { isBookmarked: body.isBookmarked }),
        ...(body.progressPercent !== undefined && { lastReadAt: new Date() }),
        ...(completedAt && { completedAt }),
      },
    });

    res.json({ success: true, message: 'Learning progress saved', data: progress });
  } catch (error) {
    next(error);
  }
};

export const listEducationAdminResources = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status.toUpperCase() : undefined;
    if (status && !Object.values(EducationContentStatus).includes(status as EducationContentStatus)) {
      throw new AppError('Unknown content status', 400, 'INVALID_STATUS');
    }
    const resources = await prisma.educationResource.findMany({
      where: status ? { status: status as EducationContentStatus } : undefined,
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        reviewer: { select: { id: true, firstName: true, lastName: true } },
        translations: { orderBy: { language: 'asc' } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
    res.json({ success: true, message: 'Education resources retrieved', data: resources });
  } catch (error) {
    next(error);
  }
};

export const createEducationResource = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = educationResourceSchema.shape.body.parse(req.body);
    const userId = req.user!.userId;
    const resource = await prisma.educationResource.create({
      data: {
        slug: body.slug,
        category: body.category,
        format: body.format,
        authorId: userId,
        translations: {
          create: body.translations.map((translation) => ({
            ...translation,
            authorId: userId,
          })),
        },
      },
      include: { translations: true },
    });
    await logAudit(userId, AuditAction.CREATE, 'EDUCATION_RESOURCE', resource.id, {
      slug: resource.slug,
      category: resource.category,
      translationLanguages: resource.translations.map((translation) => translation.language),
    }, req.ip, req.get('user-agent'));

    res.status(201).json({ success: true, message: 'Education resource saved as a draft', data: resource });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      next(new AppError('An education resource with this slug or language already exists', 409, 'RESOURCE_CONFLICT'));
      return;
    }
    next(error);
  }
};

export const updateEducationResource = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = educationResourceSchema.shape.body.parse(req.body);
    const userId = req.user!.userId;
    const resource = await prisma.$transaction(async (transaction) => {
      const current = await transaction.educationResource.findUnique({
        where: { id: req.params.id },
        select: { id: true, authorId: true, status: true, version: true },
      });
      if (!current) throw new AppError('Education resource not found', 404, 'NOT_FOUND');
      if (current.authorId !== userId && req.user!.role !== 'ADMIN') {
        throw new AppError('You can only edit resources you authored', 403, 'FORBIDDEN');
      }
      if (current.status !== EducationContentStatus.DRAFT && current.status !== EducationContentStatus.REJECTED) {
        throw new AppError('Only draft or rejected resources can be edited', 409, 'RESOURCE_NOT_EDITABLE');
      }

      await transaction.educationTranslation.deleteMany({ where: { resourceId: current.id } });
      return transaction.educationResource.update({
        where: { id: current.id },
        data: {
          slug: body.slug,
          category: body.category,
          format: body.format,
          status: EducationContentStatus.DRAFT,
          reviewerId: null,
          reviewedAt: null,
          publishedAt: null,
          version: { increment: 1 },
          translations: {
            create: body.translations.map((translation) => ({
              ...translation,
              authorId: userId,
            })),
          },
        },
        include: { translations: true },
      });
    });

    await logAudit(userId, AuditAction.UPDATE, 'EDUCATION_RESOURCE', resource.id, {
      status: resource.status,
      version: resource.version,
    }, req.ip, req.get('user-agent'));
    res.json({ success: true, message: 'Education resource updated as a draft', data: resource });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      next(new AppError('An education resource with this slug or language already exists', 409, 'RESOURCE_CONFLICT'));
      return;
    }
    next(error);
  }
};

export const submitEducationResourceForReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const resource = await prisma.$transaction(async (transaction) => {
      const current = await transaction.educationResource.findUnique({
        where: { id: req.params.id },
        select: { id: true, authorId: true, status: true },
      });
      if (!current) throw new AppError('Education resource not found', 404, 'NOT_FOUND');
      if (current.authorId !== userId && req.user!.role !== 'ADMIN') {
        throw new AppError('You can only submit resources you authored', 403, 'FORBIDDEN');
      }
      if (current.status !== EducationContentStatus.DRAFT && current.status !== EducationContentStatus.REJECTED) {
        throw new AppError('Only draft or rejected resources can be submitted', 409, 'RESOURCE_NOT_SUBMITTABLE');
      }

      const translations = await transaction.educationTranslation.findMany({
        where: { resourceId: current.id },
        select: { id: true, title: true, description: true, body: true, sourceReferences: true },
      });
      if (translations.length === 0 || translations.some((item) =>
        !item.title.trim() || !item.description.trim() || !item.body.trim() || item.sourceReferences.length === 0
      )) {
        throw new AppError('Every translation must include content and at least one source reference', 400, 'INCOMPLETE_CONTENT');
      }

      await transaction.educationTranslation.updateMany({
        where: { resourceId: current.id },
        data: { status: EducationContentStatus.IN_REVIEW, reviewerId: null, reviewedAt: null },
      });
      return transaction.educationResource.update({
        where: { id: current.id },
        data: { status: EducationContentStatus.IN_REVIEW, reviewerId: null, reviewedAt: null, publishedAt: null },
        select: { id: true, slug: true, status: true, version: true },
      });
    });
    await logAudit(userId, AuditAction.UPDATE, 'EDUCATION_RESOURCE', resource.id, {
      status: resource.status,
      version: resource.version,
    }, req.ip, req.get('user-agent'));
    res.json({ success: true, message: 'Education resource submitted for review', data: resource });
  } catch (error) {
    next(error);
  }
};

export const reviewEducationResource = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { decision } = educationReviewSchema.shape.body.parse(req.body);
    const reviewerId = req.user!.userId;
    const reviewedAt = new Date();
    const status = decision === 'APPROVED'
      ? EducationContentStatus.APPROVED
      : EducationContentStatus.REJECTED;

    const resource = await prisma.$transaction(async (transaction) => {
      const current = await transaction.educationResource.findUnique({
        where: { id: req.params.id },
        select: { id: true, authorId: true, status: true },
      });
      if (!current) throw new AppError('Education resource not found', 404, 'NOT_FOUND');
      if (current.authorId === reviewerId) {
        throw new AppError('Authors cannot review their own education resources', 403, 'SELF_REVIEW_FORBIDDEN');
      }
      if (current.status !== EducationContentStatus.IN_REVIEW) {
        throw new AppError('Only resources awaiting review can be approved or rejected', 409, 'RESOURCE_NOT_IN_REVIEW');
      }
      const translationCount = await transaction.educationTranslation.count({
        where: { resourceId: current.id },
      });
      const inReviewCount = await transaction.educationTranslation.count({
        where: { resourceId: current.id, status: EducationContentStatus.IN_REVIEW },
      });
      if (translationCount === 0 || translationCount !== inReviewCount) {
        throw new AppError('All translations must be submitted together for review', 409, 'TRANSLATIONS_NOT_IN_REVIEW');
      }

      await transaction.educationTranslation.updateMany({
        where: { resourceId: current.id, status: EducationContentStatus.IN_REVIEW },
        data: { status, reviewerId, reviewedAt },
      });
      return transaction.educationResource.update({
        where: { id: current.id },
        data: {
          status,
          reviewerId,
          reviewedAt,
          publishedAt: status === EducationContentStatus.APPROVED ? reviewedAt : null,
        },
        select: { id: true, slug: true, status: true, version: true, reviewedAt: true, publishedAt: true },
      });
    });

    await logAudit(reviewerId, AuditAction.UPDATE, 'EDUCATION_RESOURCE', resource.id, {
      status: resource.status,
      version: resource.version,
    }, req.ip, req.get('user-agent'));
    res.json({
      success: true,
      message: decision === 'APPROVED'
        ? 'Education resource and translations approved for publication'
        : 'Education resource rejected and returned to its author',
      data: resource,
    });
  } catch (error) {
    next(error);
  }
};
