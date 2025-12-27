import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

const createGoalSchema = z.object({
  title: z.string().min(1),
  type: z.enum(['counter', 'binary', 'rule']),
  unit: z.string().optional(),
  target: z.number().optional(),
  nextMilestone: z.string().optional(),
  notes: z.string().optional(),
});

const updateGoalSchema = z.object({
  title: z.string().min(1).optional(),
  type: z.enum(['counter', 'binary', 'rule']).optional(),
  unit: z.string().nullable().optional(),
  target: z.number().nullable().optional(),
  value: z.number().optional(),
  status: z.enum(['not_started', 'in_progress', 'done']).optional(),
  nextMilestone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const goals = await prisma.goal.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'asc' },
    });
    res.json(goals);
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = createGoalSchema.parse(req.body);
    const goal = await prisma.goal.create({
      data: {
        ...data,
        userId: req.userId!,
        value: 0,
        status: 'not_started',
      },
    });
    res.status(201).json(goal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateGoalSchema.parse(req.body);

    const existing = await prisma.goal.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    const goal = await prisma.goal.update({
      where: { id },
      data,
    });

    res.json(goal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('Update goal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.goal.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    await prisma.goal.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

