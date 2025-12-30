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
  milestones: z.array(z.object({
    id: z.string(),
    text: z.string(),
    done: z.boolean(),
  })).optional(),
  notes: z.string().optional(),
  // Rule-specific fields
  ruleType: z.enum(['avoid', 'achieve']).optional(),
  ruleTarget: z.number().optional(),
  rulePeriod: z.enum(['day', 'week', 'month']).optional(),
});

const ruleLogEntrySchema = z.object({
  date: z.string(),
  success: z.boolean(),
  note: z.string().optional(),
});

const milestoneSchema = z.object({
  id: z.string(),
  text: z.string(),
  done: z.boolean(),
});

const updateGoalSchema = z.object({
  title: z.string().min(1).optional(),
  type: z.enum(['counter', 'binary', 'rule']).optional(),
  unit: z.string().nullable().optional(),
  target: z.number().nullable().optional(),
  value: z.number().optional(),
  status: z.enum(['not_started', 'in_progress', 'done']).optional(),
  nextMilestone: z.string().nullable().optional(),
  milestones: z.array(milestoneSchema).optional(),
  notes: z.string().nullable().optional(),
  // Rule-specific fields
  ruleType: z.enum(['avoid', 'achieve']).nullable().optional(),
  ruleTarget: z.number().nullable().optional(),
  rulePeriod: z.enum(['day', 'week', 'month']).nullable().optional(),
  ruleLogs: z.array(ruleLogEntrySchema).optional(),
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const goals = await prisma.goal.findMany({
      where: { userId: req.userId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    
    // Parse JSON fields
    const goalsWithParsedFields = goals.map(goal => ({
      ...goal,
      ruleLogs: goal.ruleLogs ? JSON.parse(goal.ruleLogs) : [],
      milestones: goal.milestones ? JSON.parse(goal.milestones) : [],
    }));
    
    res.json(goalsWithParsedFields);
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = createGoalSchema.parse(req.body);
    
    // Get the max sortOrder for this user
    const maxOrderGoal = await prisma.goal.findFirst({
      where: { userId: req.userId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    const nextOrder = (maxOrderGoal?.sortOrder ?? -1) + 1;
    
    // Convert milestones array to JSON string for storage
    const createData: Record<string, unknown> = { ...data };
    if (data.milestones) {
      createData.milestones = JSON.stringify(data.milestones);
    }
    
    const goal = await prisma.goal.create({
      data: {
        ...createData,
        userId: req.userId!,
        value: 0,
        status: 'not_started',
        sortOrder: nextOrder,
      },
    });
    
    // Parse milestones back to array for response
    const response = {
      ...goal,
      milestones: goal.milestones ? JSON.parse(goal.milestones) : [],
    };
    
    res.status(201).json(response);
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

    // Convert arrays to JSON strings for storage
    const updateData: Record<string, unknown> = { ...data };
    if (data.ruleLogs) {
      updateData.ruleLogs = JSON.stringify(data.ruleLogs);
    }
    if (data.milestones) {
      updateData.milestones = JSON.stringify(data.milestones);
    }

    const goal = await prisma.goal.update({
      where: { id },
      data: updateData,
    });

    // Parse JSON fields back to arrays for response
    const response = {
      ...goal,
      ruleLogs: goal.ruleLogs ? JSON.parse(goal.ruleLogs) : [],
      milestones: goal.milestones ? JSON.parse(goal.milestones) : [],
    };

    res.json(response);
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

// Reorder goals (arrow buttons)
router.post('/reorder', async (req: AuthRequest, res: Response) => {
  try {
    const { goalId, direction } = req.body as { goalId: string; direction: 'up' | 'down' };

    // Get all goals for this user ordered by sortOrder
    const goals = await prisma.goal.findMany({
      where: { userId: req.userId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    const currentIndex = goals.findIndex(g => g.id === goalId);
    if (currentIndex === -1) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= goals.length) {
      res.status(400).json({ error: 'Cannot move goal in that direction' });
      return;
    }

    // Reorder: move goal to new position with sequential sortOrder values
    const reorderedGoals = [...goals];
    const [movedGoal] = reorderedGoals.splice(currentIndex, 1);
    reorderedGoals.splice(targetIndex, 0, movedGoal);

    // Update all sortOrder values sequentially
    await prisma.$transaction(
      reorderedGoals.map((goal, index) =>
        prisma.goal.update({
          where: { id: goal.id },
          data: { sortOrder: index },
        })
      )
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Reorder goals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk reorder goals (drag and drop)
router.post('/reorder-bulk', async (req: AuthRequest, res: Response) => {
  try {
    const { goalIds } = req.body as { goalIds: string[] };

    if (!goalIds || !Array.isArray(goalIds)) {
      res.status(400).json({ error: 'goalIds array is required' });
      return;
    }

    // Verify all goals belong to this user
    const goals = await prisma.goal.findMany({
      where: { userId: req.userId },
    });

    const userGoalIds = new Set(goals.map(g => g.id));
    const allValid = goalIds.every(id => userGoalIds.has(id));

    if (!allValid) {
      res.status(400).json({ error: 'Invalid goal IDs' });
      return;
    }

    // Update all sortOrder values based on the new order
    await prisma.$transaction(
      goalIds.map((goalId, index) =>
        prisma.goal.update({
          where: { id: goalId },
          data: { sortOrder: index },
        })
      )
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Bulk reorder goals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


