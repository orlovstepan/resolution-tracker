import type { Goal, Milestone } from '../types';
import styles from './ProgressSummary.module.css';

interface ProgressSummaryProps {
  goals: Goal[];
}

// Helper to parse milestones
function parseMilestones(milestones: Milestone[] | string | undefined): Milestone[] {
  if (!milestones) return [];
  if (typeof milestones === 'string') {
    try {
      return JSON.parse(milestones);
    } catch {
      return [];
    }
  }
  return milestones;
}

export function ProgressSummary({ goals }: ProgressSummaryProps) {
  const totalGoals = goals.length;
  const doneGoals = goals.filter(g => g.status === 'done').length;
  const inProgressGoals = goals.filter(g => g.status === 'in_progress').length;
  
  // Calculate weighted overall progress
  const overallProgress = totalGoals > 0 
    ? goals.reduce((sum, g) => {
        if (g.type === 'counter' && g.target) {
          return sum + Math.min(g.value / g.target, 1);
        } else if (g.type === 'binary') {
          return sum + (g.status === 'done' ? 1 : 0);
        } else if (g.type === 'rule') {
          return sum + (g.value / 100); // Rules are 0-100%
        }
        return sum;
      }, 0) / totalGoals * 100
    : 0;

  // Find the goal closest to completion (but not done)
  const closestGoal = goals
    .filter(g => g.status !== 'done')
    .map(g => {
      let progress = 0;
      if (g.type === 'counter' && g.target) {
        progress = Math.min(g.value / g.target, 1);
      } else if (g.type === 'rule') {
        progress = g.value / 100;
      }
      return { goal: g, progress };
    })
    .sort((a, b) => b.progress - a.progress)[0];

  // Count milestones completed
  const allMilestones = goals.flatMap(g => parseMilestones(g.milestones));
  const completedMilestones = allMilestones.filter(m => m.done).length;
  const totalMilestones = allMilestones.length;


  return (
    <div className={styles.container}>
      <div className={styles.mainStats}>
        <div className={styles.progressRing}>
          <svg viewBox="0 0 100 100" className={styles.svg}>
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="var(--bg-tertiary)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${overallProgress * 2.64} 264`}
              transform="rotate(-90 50 50)"
              className={styles.progressCircle}
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--accent-primary)" />
                <stop offset="100%" stopColor="var(--accent-secondary)" />
              </linearGradient>
            </defs>
          </svg>
          <div className={styles.progressText}>
            <span className={styles.progressNumber}>{doneGoals}</span>
            <span className={styles.progressLabel}>/ {totalGoals}</span>
          </div>
        </div>
        
        <div className={styles.mainInfo}>
          <h2 className={styles.title}>Goals Completed</h2>
          <p className={styles.subtitle}>
            {inProgressGoals} in progress • {totalGoals - doneGoals - inProgressGoals} not started
          </p>
        </div>
      </div>
      
      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statValue}>
            <span className="font-mono">{Math.round(overallProgress)}</span>
            <span className={styles.statUnit}>%</span>
          </div>
          <div className={styles.statLabel}>Overall Progress</div>
        </div>
        
        {totalMilestones > 0 && (
          <div className={styles.stat}>
            <div className={styles.statValue}>
              <span className="font-mono">{completedMilestones}</span>
              <span className={styles.statUnit}>/ {totalMilestones}</span>
            </div>
            <div className={styles.statLabel}>Milestones Done</div>
          </div>
        )}
        
        {closestGoal && closestGoal.progress > 0 && (
          <div className={`${styles.stat} ${styles.statHighlight}`}>
            <div className={styles.statValue}>
              <span className="font-mono">{Math.round(closestGoal.progress * 100)}</span>
              <span className={styles.statUnit}>%</span>
            </div>
            <div className={styles.statLabel} title={closestGoal.goal.title}>
              🔥 {closestGoal.goal.title.length > 15 
                ? closestGoal.goal.title.slice(0, 15) + '...' 
                : closestGoal.goal.title}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


