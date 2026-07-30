export interface User {
  id: string;
  email: string;
}

export type GoalType = 'counter' | 'binary' | 'rule';
export type GoalStatus = 'not_started' | 'in_progress' | 'done';
export type RuleType = 'avoid' | 'achieve';
export type RulePeriod = 'day' | 'week' | 'month';

export interface RuleLogEntry {
  date: string; // YYYY-MM-DD
  success: boolean;
  note?: string;
}

export interface Milestone {
  id: string;
  text: string;
  done: boolean;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  type: GoalType;
  unit?: string | null;
  target?: number | null;
  value: number;
  previousValue?: number | null;
  valueChangedAt?: string | null;
  status: GoalStatus;
  nextMilestone?: string | null; // Deprecated, kept for compatibility
  milestones?: Milestone[] | string;
  notes?: string | null;
  // Rule-specific fields
  ruleType?: RuleType | null;
  ruleTarget?: number | null;
  rulePeriod?: RulePeriod | null;
  ruleLogs?: RuleLogEntry[] | string;
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
  milestones?: Milestone[];
  notes?: string;
  ruleType?: RuleType;
  ruleTarget?: number;
  rulePeriod?: RulePeriod;
}

export interface UpdateGoalInput {
  title?: string;
  type?: GoalType;
  unit?: string | null;
  target?: number | null;
  value?: number;
  status?: GoalStatus;
  nextMilestone?: string | null;
  milestones?: Milestone[];
  notes?: string | null;
  ruleType?: RuleType | null;
  ruleTarget?: number | null;
  rulePeriod?: RulePeriod | null;
  ruleLogs?: RuleLogEntry[];
}

export interface UpdateCheckinInput {
  highlight?: string;
  blocker?: string;
  notes?: string;
}

