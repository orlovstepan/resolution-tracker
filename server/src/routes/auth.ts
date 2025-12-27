import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AuthRequest, authMiddleware, signToken } from '../middleware/auth.js';

const router = Router();

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const DEFAULT_GOALS = [
  { title: '€10k additional income', type: 'counter', target: 10000, unit: '€' },
  { title: 'Chatbot users', type: 'counter', target: 1000, unit: 'users' },
  { title: 'Drumming hours', type: 'counter', target: 50, unit: 'hours' },
  { title: 'Piano classes', type: 'counter', target: 20, unit: 'classes' },
  { title: 'No added sugar on weekdays', type: 'rule', value: 100 },
  { title: 'Find new job', type: 'binary' },
  { title: 'Arabic A1', type: 'binary' },
  { title: 'Spanish B2', type: 'binary' },
  { title: 'Splits', type: 'binary' },
  { title: 'Visit UK', type: 'binary' },
  { title: 'Language platform first users', type: 'counter', target: 20, unit: 'users' },
];

router.post('/signup', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = authSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash },
    });

    // Create default goals for new user
    await prisma.goal.createMany({
      data: DEFAULT_GOALS.map((goal) => ({
        userId: user.id,
        title: goal.title,
        type: goal.type,
        target: goal.target,
        unit: goal.unit,
        value: goal.value || 0,
        status: 'not_started',
      })),
    });

    const token = signToken(user.id);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ id: user.id, email: user.email });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = authSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = signToken(user.id);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ id: user.id, email: user.email });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', (_req: AuthRequest, res: Response) => {
  res.clearCookie('token');
  res.json({ success: true });
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

