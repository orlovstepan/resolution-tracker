import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

const createCheckinSchema = z.object({
  monthKey: z.string().regex(/^\d{4}-\d{2}$/),
});

const updateCheckinSchema = z.object({
  highlight: z.string().optional(),
  blocker: z.string().optional(),
  notes: z.string().optional(),
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { month } = req.query;
    const where: { userId: string; monthKey?: string } = { userId: req.userId! };

    if (month && typeof month === 'string') {
      where.monthKey = month;
    }

    const checkins = await prisma.monthlyCheckin.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Parse snapshotJson for each checkin
    const parsed = checkins.map((c) => ({
      ...c,
      snapshotJson: JSON.parse(c.snapshotJson || '{}'),
    }));

    res.json(parsed);
  } catch (error) {
    console.error('Get checkins error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { monthKey } = createCheckinSchema.parse(req.body);

    // Get current goals for snapshot
    const goals = await prisma.goal.findMany({
      where: { userId: req.userId },
    });

    const snapshot: Record<string, { value: number; status: string }> = {};
    goals.forEach((g) => {
      snapshot[g.id] = { value: g.value, status: g.status };
    });

    const checkin = await prisma.monthlyCheckin.create({
      data: {
        userId: req.userId!,
        monthKey,
        snapshotJson: JSON.stringify(snapshot),
      },
    });

    res.status(201).json({
      ...checkin,
      snapshotJson: snapshot,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('Create checkin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateCheckinSchema.parse(req.body);

    const existing = await prisma.monthlyCheckin.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Check-in not found' });
      return;
    }

    // Get current goals for updated snapshot
    const goals = await prisma.goal.findMany({
      where: { userId: req.userId },
    });

    const snapshot: Record<string, { value: number; status: string }> = {};
    goals.forEach((g) => {
      snapshot[g.id] = { value: g.value, status: g.status };
    });

    const checkin = await prisma.monthlyCheckin.update({
      where: { id },
      data: {
        ...data,
        snapshotJson: JSON.stringify(snapshot),
      },
    });

    res.json({
      ...checkin,
      snapshotJson: snapshot,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('Update checkin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.monthlyCheckin.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Check-in not found' });
      return;
    }

    await prisma.monthlyCheckin.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete checkin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

