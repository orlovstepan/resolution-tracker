export interface User {
  id: string;
  email: string;
}

export type GoalType = 'counter' | 'binary' | 'rule';
export type GoalStatus = 'not_started' | 'in_progress' | 'done';

export interface Goal {
  id: string;
  userId: string;
  title: string;
  type: GoalType;
  unit?: string | null;
  target?: number | null;
  value: number;
  status: GoalStatus;
  nextMilestone?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GoalSnapshot {
  value: number;
  status: string;
}

export interface MonthlyCheckin {
  id: string;
  userId: string;
  monthKey: string;
  highlight: string;
  blocker: string;
  notes: string;
  snapshotJson: Record<string, GoalSnapshot>;
  createdAt: string;
}

export interface CreateGoalInput {
  title: string;
  type: GoalType;
  unit?: string;
  target?: number;
  nextMilestone?: string;
  notes?: string;
}

export interface UpdateGoalInput {
  title?: string;
  type?: GoalType;
  unit?: string | null;
  target?: number | null;
  value?: number;
  status?: GoalStatus;
  nextMilestone?: string | null;
  notes?: string | null;
}

export interface UpdateCheckinInput {
  highlight?: string;
  blocker?: string;
  notes?: string;
}

