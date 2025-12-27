import type { Goal } from '../types';
import styles from './ProgressSummary.module.css';

interface ProgressSummaryProps {
  goals: Goal[];
}

export function ProgressSummary({ goals }: ProgressSummaryProps) {
  const totalGoals = goals.length;
  const doneGoals = goals.filter(g => g.status === 'done').length;
  const inProgressGoals = goals.filter(g => g.status === 'in_progress').length;
  
  // Calculate average counter progress
  const counterGoals = goals.filter(g => g.type === 'counter' && g.target);
  const avgCounterProgress = counterGoals.length > 0
    ? counterGoals.reduce((sum, g) => sum + Math.min(g.value / (g.target || 1), 1), 0) / counterGoals.length
    : 0;

  // Calculate binary goals done
  const binaryGoals = goals.filter(g => g.type === 'binary');
  const binaryDone = binaryGoals.filter(g => g.status === 'done').length;

  const overallProgress = totalGoals > 0 ? (doneGoals / totalGoals) * 100 : 0;

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
            <span className="font-mono">{Math.round(avgCounterProgress * 100)}</span>
            <span className={styles.statUnit}>%</span>
          </div>
          <div className={styles.statLabel}>Avg Counter Progress</div>
        </div>
        
        <div className={styles.stat}>
          <div className={styles.statValue}>
            <span className="font-mono">{binaryDone}</span>
            <span className={styles.statUnit}>/ {binaryGoals.length}</span>
          </div>
          <div className={styles.statLabel}>Binary Goals Done</div>
        </div>
        
        <div className={styles.stat}>
          <div className={styles.statValue}>
            <span className="font-mono">{counterGoals.length}</span>
          </div>
          <div className={styles.statLabel}>Counter Goals</div>
        </div>
      </div>
    </div>
  );
}

