import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import type { Goal, GoalType, GoalStatus, CreateGoalInput, UpdateGoalInput, RuleType, RulePeriod, RuleLogEntry, Milestone } from '../types';
import { goalsApi } from '../api';
import { ConfirmDialog } from './ConfirmDialog';
import styles from './GoalsList.module.scss';

interface GoalsListProps {
  goals: Goal[];
  onUpdate: () => void;
}

export function GoalsList({ goals, onUpdate }: GoalsListProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);
  const [scrollToGoalId, setScrollToGoalId] = useState<string | null>(null);
  const dragCounter = useRef(0);
  const goalRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Scroll to goal after move
  useEffect(() => {
    if (scrollToGoalId) {
      const element = goalRefs.current.get(scrollToGoalId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      setScrollToGoalId(null);
    }
  }, [scrollToGoalId, goals]);

  const handleCreate = async (data: CreateGoalInput) => {
    await goalsApi.create(data);
    setShowAddForm(false);
    onUpdate();
  };

  const handleUpdate = async (id: string, data: UpdateGoalInput, skipRefresh = false) => {
    await goalsApi.update(id, data);
    setEditingId(null);
    if (!skipRefresh) {
      onUpdate();
    }
  };

  const handleDeleteRequest = (id: string, title: string) => {
    setDeleteConfirm({ id, title });
  };

  const handleDeleteConfirm = useCallback(async () => {
    if (deleteConfirm) {
      await goalsApi.delete(deleteConfirm.id);
      setDeleteConfirm(null);
      onUpdate();
    }
  }, [deleteConfirm, onUpdate]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirm(null);
  }, []);

  const handleMove = async (goalId: string, direction: 'up' | 'down') => {
    await goalsApi.reorder(goalId, direction);
    setScrollToGoalId(goalId); // Scroll to keep the moved goal in view
    onUpdate();
  };

  const handleDragStart = (e: React.DragEvent, goalId: string) => {
    setDraggedId(goalId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', goalId);
    // Add a slight delay to allow the drag image to be captured
    setTimeout(() => {
      const element = e.target as HTMLElement;
      element.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const element = e.target as HTMLElement;
    element.style.opacity = '1';
    setDraggedId(null);
    setDragOverId(null);
    dragCounter.current = 0;
  };

  const handleDragEnter = (e: React.DragEvent, goalId: string) => {
    e.preventDefault();
    dragCounter.current++;
    if (goalId !== draggedId) {
      setDragOverId(goalId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverId(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetGoalId: string) => {
    e.preventDefault();
    dragCounter.current = 0;
    
    if (!draggedId || draggedId === targetGoalId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    // Reorder goals
    const draggedIndex = goals.findIndex(g => g.id === draggedId);
    const targetIndex = goals.findIndex(g => g.id === targetGoalId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;

    const newOrder = [...goals];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, removed);

    // Update server with new order
    await goalsApi.reorderBulk(newOrder.map(g => g.id));
    
    setDraggedId(null);
    setDragOverId(null);
    onUpdate();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>🎯 Goals</h2>
        <button 
          onClick={() => setShowAddForm(!showAddForm)} 
          className="btn-primary"
        >
          {showAddForm ? 'Cancel' : '+ Add Goal'}
        </button>
      </div>

      {showAddForm && (
        <GoalForm 
          onSubmit={handleCreate} 
          onCancel={() => setShowAddForm(false)} 
        />
      )}

      <div className={styles.list}>
        {goals.map((goal, index) => (
          <GoalItem
            key={goal.id}
            goal={goal}
            isEditing={editingId === goal.id}
            isFirst={index === 0}
            isLast={index === goals.length - 1}
            isDragging={draggedId === goal.id}
            isDragOver={dragOverId === goal.id}
            itemRef={(el) => {
              if (el) goalRefs.current.set(goal.id, el);
              else goalRefs.current.delete(goal.id);
            }}
            onEdit={() => setEditingId(goal.id)}
            onCancelEdit={() => setEditingId(null)}
            onUpdate={(data, skipRefresh) => handleUpdate(goal.id, data, skipRefresh)}
            onDelete={() => handleDeleteRequest(goal.id, goal.title)}
            onMoveUp={() => handleMove(goal.id, 'up')}
            onMoveDown={() => handleMove(goal.id, 'down')}
            onDragStart={(e) => handleDragStart(e, goal.id)}
            onDragEnd={handleDragEnd}
            onDragEnter={(e) => handleDragEnter(e, goal.id)}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, goal.id)}
          />
        ))}

        {goals.length === 0 && !showAddForm && (
          <div className={styles.empty}>
            <p>No goals yet. Add your first goal to get started!</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Delete Goal"
        message={`Are you sure you want to delete "${deleteConfirm?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}

interface GoalFormProps {
  goal?: Goal;
  onSubmit: (data: CreateGoalInput) => void;
  onCancel: () => void;
}

function GoalForm({ goal, onSubmit, onCancel }: GoalFormProps) {
  const [title, setTitle] = useState(goal?.title || '');
  const [type, setType] = useState<GoalType>(goal?.type || 'counter');
  const [unit, setUnit] = useState(goal?.unit || '');
  const [target, setTarget] = useState(goal?.target?.toString() || '');
  const [milestones, setMilestones] = useState<Milestone[]>(() => parseMilestones(goal?.milestones));
  const [newMilestoneText, setNewMilestoneText] = useState('');
  const [notes, setNotes] = useState(goal?.notes || '');
  const [ruleType, setRuleType] = useState<RuleType>(goal?.ruleType || 'avoid');
  const [ruleTarget, setRuleTarget] = useState(goal?.ruleTarget?.toString() || '');
  const [rulePeriod, setRulePeriod] = useState<RulePeriod>(goal?.rulePeriod || 'week');
  const [loading, setLoading] = useState(false);

  const handleAddMilestone = () => {
    if (!newMilestoneText.trim()) return;
    setMilestones([...milestones, {
      id: crypto.randomUUID(),
      text: newMilestoneText.trim(),
      done: false,
    }]);
    setNewMilestoneText('');
  };

  const handleRemoveMilestone = (id: string) => {
    setMilestones(milestones.filter(m => m.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        title,
        type,
        unit: unit || undefined,
        target: target ? parseFloat(target) : undefined,
        milestones: milestones.length > 0 ? milestones : undefined,
        notes: notes || undefined,
        ruleType: type === 'rule' ? ruleType : undefined,
        ruleTarget: type === 'rule' && ruleType === 'achieve' ? parseInt(ruleTarget) : undefined,
        rulePeriod: type === 'rule' ? rulePeriod : undefined,
      } as CreateGoalInput);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formRow}>
        <div className={styles.formField} style={{ flex: 2 }}>
          <label className="label">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Read 12 books"
            required
          />
        </div>
        <div className={styles.formField}>
          <label className="label">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as GoalType)}>
            <option value="counter">Counter</option>
            <option value="binary">Binary</option>
            <option value="rule">Habit/Rule</option>
          </select>
        </div>
      </div>

      {type === 'counter' && (
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label className="label">Target</label>
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g., 12"
            />
          </div>
          <div className={styles.formField}>
            <label className="label">Unit</label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g., books"
            />
          </div>
        </div>
      )}

      {type === 'rule' && (
        <>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className="label">Rule Type</label>
              <select value={ruleType} onChange={(e) => setRuleType(e.target.value as RuleType)}>
                <option value="avoid">Avoid (e.g., no sugar)</option>
                <option value="achieve">Achieve (e.g., gym 3x/week)</option>
              </select>
            </div>
            <div className={styles.formField}>
              <label className="label">Period</label>
              <select value={rulePeriod} onChange={(e) => setRulePeriod(e.target.value as RulePeriod)}>
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
              </select>
            </div>
          </div>
          {ruleType === 'achieve' && (
            <div className={styles.formField}>
              <label className="label">Target per {rulePeriod}</label>
              <input
                type="number"
                value={ruleTarget}
                onChange={(e) => setRuleTarget(e.target.value)}
                placeholder={`e.g., 3 times per ${rulePeriod}`}
                min={1}
              />
            </div>
          )}
        </>
      )}

      <div className={styles.formField}>
        <label className="label">Milestones (optional)</label>
        {milestones.length > 0 && (
          <ul className={styles.formMilestonesList}>
            {milestones.map(m => (
              <li key={m.id} className={styles.formMilestoneItem}>
                <span>{m.text}</span>
                <button 
                  type="button"
                  onClick={() => handleRemoveMilestone(m.id)}
                  className={styles.formMilestoneRemove}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className={styles.formMilestoneAdd}>
          <input
            type="text"
            value={newMilestoneText}
            onChange={(e) => setNewMilestoneText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddMilestone();
              }
            }}
            placeholder="Add a milestone and press Enter..."
          />
          <button 
            type="button"
            onClick={handleAddMilestone}
            className={styles.formMilestoneAddBtn}
            disabled={!newMilestoneText.trim()}
          >
            +
          </button>
        </div>
      </div>

      <div className={styles.formField}>
        <label className="label">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes..."
          rows={2}
        />
      </div>

      <div className={styles.formActions}>
        <button type="button" onClick={onCancel} className="btn-secondary btn-small">
          Cancel
        </button>
        <button type="submit" className="btn-primary btn-small" disabled={loading}>
          {loading ? 'Saving...' : goal ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}

interface GoalItemProps {
  goal: Goal;
  isEditing: boolean;
  isFirst: boolean;
  isLast: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  itemRef: (el: HTMLDivElement | null) => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (data: UpdateGoalInput, skipRefresh?: boolean) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

// Helper functions for rule tracking
function parseRuleLogs(logs: RuleLogEntry[] | string | undefined): RuleLogEntry[] {
  if (!logs) return [];
  if (typeof logs === 'string') {
    try {
      return JSON.parse(logs);
    } catch {
      return [];
    }
  }
  return logs;
}

function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekDates(): string[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(formatDateLocal(date));
  }
  return dates;
}

function getMonthDates(): string[] {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const dates: string[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    dates.push(formatDateLocal(date));
  }
  return dates;
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

function GoalItem({ 
  goal, isEditing, isFirst, isLast, isDragging, isDragOver, itemRef,
  onEdit, onCancelEdit, onUpdate, onDelete, onMoveUp, onMoveDown,
  onDragStart, onDragEnd, onDragEnter, onDragLeave, onDragOver, onDrop 
}: GoalItemProps) {
  const [value, setValue] = useState(goal.value);
  const [status, setStatus] = useState<GoalStatus>(goal.status);
  const [newMilestoneText, setNewMilestoneText] = useState('');
  const [localMilestones, setLocalMilestones] = useState<Milestone[]>(() => parseMilestones(goal.milestones));

  const ruleLogs = useMemo(() => parseRuleLogs(goal.ruleLogs), [goal.ruleLogs]);
  
  // Sync local milestones with goal prop
  useMemo(() => {
    setLocalMilestones(parseMilestones(goal.milestones));
  }, [goal.milestones]);

  // Sync local state with props when goal changes
  // Allow counters to exceed 100%
  const currentProgress = goal.type === 'counter' && goal.target 
    ? (value / goal.target) * 100
    : goal.type === 'binary'
      ? status === 'done' ? 100 : 0
      : value;

  const handleQuickUpdate = async (newValue?: number) => {
    const v = newValue ?? value;
    // Auto-update status based on progress
    let newStatus = status;
    if (goal.type === 'counter' && goal.target) {
      if (v >= goal.target) {
        newStatus = 'done';
      } else if (v > 0) {
        newStatus = 'in_progress';
      } else {
        newStatus = 'not_started';
      }
    }
    if (newStatus !== status) {
      setStatus(newStatus);
    }
    if (v !== goal.value || newStatus !== goal.status) {
      await onUpdate({ value: v, status: newStatus }, true); // skipRefresh = true
    }
  };

  const handleIncrement = async () => {
    const newValue = value + 1;
    setValue(newValue);
    // Auto-set to 'done' when reaching or exceeding target
    const newStatus = goal.target && newValue >= goal.target 
      ? 'done' 
      : newValue > 0 ? 'in_progress' : status;
    setStatus(newStatus);
    await onUpdate({ value: newValue, status: newStatus }, true); // skipRefresh = true
  };

  const handleDecrement = async () => {
    const newValue = Math.max(0, value - 1);
    setValue(newValue);
    // Auto-update status based on new value
    let newStatus = status;
    if (goal.target) {
      if (newValue >= goal.target) {
        newStatus = 'done';
      } else if (newValue > 0) {
        newStatus = 'in_progress';
      } else {
        newStatus = 'not_started';
      }
    }
    if (newStatus !== status) {
      setStatus(newStatus);
    }
    await onUpdate({ value: newValue, status: newStatus }, true); // skipRefresh = true
  };

  const handleRuleLog = async (date: string, success: boolean) => {
    let newLogs: RuleLogEntry[];
    const period = goal.rulePeriod || 'week';
    const target = goal.ruleTarget || 1;
    
    // For daily achieve goals with target > 1, allow multiple success logs per day
    if (period === 'day' && goal.ruleType === 'achieve' && target > 1) {
      if (success) {
        // Add a new success log
        newLogs = [...ruleLogs, { date, success: true }];
      } else {
        // Remove one success log for this date
        const successLogs = ruleLogs.filter(l => l.date === date && l.success);
        if (successLogs.length > 0) {
          // Remove the last success log for this date
          const lastIndex = ruleLogs.map((l, i) => ({ l, i }))
            .filter(({ l }) => l.date === date && l.success)
            .pop()?.i;
          if (lastIndex !== undefined) {
            newLogs = ruleLogs.filter((_, i) => i !== lastIndex);
          } else {
            newLogs = ruleLogs;
          }
        } else {
          newLogs = ruleLogs;
        }
      }
    } else {
      // Original toggle logic for weekly/monthly or single-target goals
      const existingIndex = ruleLogs.findIndex(l => l.date === date);
      
      if (existingIndex >= 0) {
        // Toggle: if same value, remove; if different, update
        if (ruleLogs[existingIndex].success === success) {
          newLogs = ruleLogs.filter((_, i) => i !== existingIndex);
        } else {
          newLogs = [...ruleLogs];
          newLogs[existingIndex] = { date, success };
        }
      } else {
        newLogs = [...ruleLogs, { date, success }];
      }
    }
    
    // Calculate compliance percentage
    const periodDates = period === 'week' ? getWeekDates() : period === 'month' ? getMonthDates() : [formatDateLocal(new Date())];
    const periodLogs = newLogs.filter(l => periodDates.includes(l.date));
    
    let newValue = 0;
    if (goal.ruleType === 'avoid') {
      // For "avoid" rules: % of days without failure
      const failDays = periodLogs.filter(l => !l.success).length;
      const totalDays = periodDates.filter(d => d <= formatDateLocal(new Date())).length;
      newValue = totalDays > 0 ? Math.round(((totalDays - failDays) / totalDays) * 100) : 100;
    } else {
      // For "achieve" rules: % of target achieved
      const successCount = periodLogs.filter(l => l.success).length;
      const target = goal.ruleTarget || 1;
      newValue = Math.min(100, Math.round((successCount / target) * 100));
    }
    
    await onUpdate({ ruleLogs: newLogs, value: newValue, status: newValue > 0 ? 'in_progress' : 'not_started' });
  };

  const handleToggleMilestone = async (milestoneId: string) => {
    const updatedMilestones = localMilestones.map(m => 
      m.id === milestoneId ? { ...m, done: !m.done } : m
    );
    setLocalMilestones(updatedMilestones);
    await onUpdate({ milestones: updatedMilestones }, true);
  };

  const handleAddMilestone = async () => {
    if (!newMilestoneText.trim()) return;
    const newMilestone: Milestone = {
      id: crypto.randomUUID(),
      text: newMilestoneText.trim(),
      done: false,
    };
    const updatedMilestones = [...localMilestones, newMilestone];
    setLocalMilestones(updatedMilestones);
    await onUpdate({ milestones: updatedMilestones }, true);
    setNewMilestoneText('');
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    const updatedMilestones = localMilestones.filter(m => m.id !== milestoneId);
    setLocalMilestones(updatedMilestones);
    await onUpdate({ milestones: updatedMilestones }, true);
  };

  const statusColors: Record<GoalStatus, string> = {
    not_started: 'badge-muted',
    in_progress: 'badge-warning',
    done: 'badge-success',
  };

  const statusLabels: Record<GoalStatus, string> = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    done: 'Done',
  };

  const typeIcons: Record<GoalType, string> = {
    counter: '📊',
    binary: '✓',
    rule: '📏',
  };

  if (isEditing) {
    return (
      <div className={styles.item}>
        <GoalForm 
          goal={goal} 
          onSubmit={(data) => onUpdate(data)} 
          onCancel={onCancelEdit} 
        />
      </div>
    );
  }

  const itemClasses = [
    styles.item,
    isDragging ? styles.itemDragging : '',
    isDragOver ? styles.itemDragOver : '',
  ].filter(Boolean).join(' ');

  return (
    <div 
      ref={itemRef}
      className={itemClasses}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className={styles.itemHeader}>
        <div className={styles.itemTitle}>
          <span className={styles.dragHandle} title="Drag to reorder">⠿</span>
          <span className={styles.typeIcon}>{typeIcons[goal.type]}</span>
          <span>{goal.title}</span>
        </div>
        <div className={styles.itemActions}>
          <button 
            onMouseDown={(e) => e.preventDefault()}
            onClick={onMoveUp} 
            className="btn-ghost btn-icon" 
            title="Move up"
            disabled={isFirst}
          >
            ↑
          </button>
          <button 
            onMouseDown={(e) => e.preventDefault()}
            onClick={onMoveDown} 
            className="btn-ghost btn-icon" 
            title="Move down"
            disabled={isLast}
          >
            ↓
          </button>
          <button onClick={onEdit} className="btn-ghost btn-icon" title="Edit">
            ✏️
          </button>
          <button onClick={onDelete} className="btn-ghost btn-icon" title="Delete">
            🗑️
          </button>
        </div>
      </div>

      <div className={styles.itemContent}>
        {goal.type === 'counter' && (
          <div className={styles.counterSection}>
            <div className={styles.stepper}>
              <button 
                onClick={handleDecrement} 
                className={styles.stepperBtn}
                disabled={value <= 0}
              >
                −
              </button>
              <div className={styles.stepperValue}>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(Math.max(0, parseFloat(e.target.value) || 0))}
                  onFocus={(e) => e.target.select()}
                  onBlur={() => handleQuickUpdate()}
                  className={styles.stepperInput}
                  style={{ width: `${Math.max(60, String(value).length * 20 + 20)}px` }}
                  min={0}
                />
                <span className={styles.stepperTarget}>/ {goal.target} {goal.unit}</span>
              </div>
              <button 
                onClick={handleIncrement} 
                className={styles.stepperBtn}
              >
                +
              </button>
            </div>
            {currentProgress >= 100 && (
              <div className={styles.overachieveMessage}>
                {currentProgress >= 150 ? '🏆 Incredible!' : currentProgress >= 120 ? '🔥 Amazing!' : '🎉 Goal reached!'}
                {currentProgress > 100 && ` +${Math.round(currentProgress - 100)}% bonus`}
              </div>
            )}
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${Math.min(currentProgress, 100)}%`,
                  background: currentProgress >= 100 
                    ? 'var(--accent-success)' 
                    : 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))'
                }}
              />
            </div>
          </div>
        )}

        {goal.type === 'rule' && (
          <RuleTracker 
            goal={goal} 
            ruleLogs={ruleLogs} 
            onLogToggle={handleRuleLog} 
          />
        )}

        {goal.type === 'binary' && (
          <div className={styles.binarySection}>
            <button
              onClick={() => {
                const newStatus = goal.status === 'done' ? 'not_started' : 'done';
                setStatus(newStatus);
                onUpdate({ status: newStatus, value: newStatus === 'done' ? 100 : 0 });
              }}
              className={`${styles.binaryBtn} ${goal.status === 'done' ? styles.binaryDone : ''}`}
            >
              {goal.status === 'done' ? '✓ Completed' : 'Mark Complete'}
            </button>
          </div>
        )}

        <div className={styles.statusRow}>
          <select
            value={status}
            onChange={(e) => {
              const newStatus = e.target.value as GoalStatus;
              setStatus(newStatus);
              onUpdate({ status: newStatus });
            }}
            className={`${styles.statusSelect} ${statusColors[status]}`}
          >
            <option value="not_started">{statusLabels.not_started}</option>
            <option value="in_progress">{statusLabels.in_progress}</option>
            <option value="done">{statusLabels.done}</option>
          </select>
          
          <span className={`badge ${statusColors[status]}`}>
            {Math.round(currentProgress)}%
          </span>
        </div>

        {/* Milestones to-do list - only show if there are milestones */}
        {localMilestones.length > 0 && (
          <div className={styles.milestonesSection}>
            <div className={styles.milestonesHeader}>
              <span className={styles.milestonesLabel}>📋 Milestones</span>
              <span className={styles.milestonesCount}>
                {localMilestones.filter(m => m.done).length}/{localMilestones.length}
              </span>
            </div>
            
            <ul className={styles.milestonesList}>
              {localMilestones.map(m => (
                <li key={m.id} className={`${styles.milestoneItem} ${m.done ? styles.milestoneDone : ''}`}>
                  <label className={styles.milestoneCheckbox}>
                    <input
                      type="checkbox"
                      checked={m.done}
                      onChange={() => handleToggleMilestone(m.id)}
                    />
                    <span className={styles.checkmark}>✓</span>
                  </label>
                  <span className={styles.milestoneText}>{m.text}</span>
                  <button 
                    onClick={() => handleDeleteMilestone(m.id)}
                    className={styles.milestoneDelete}
                    title="Delete milestone"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            
            <div className={styles.addMilestone}>
              <input
                type="text"
                value={newMilestoneText}
                onChange={(e) => setNewMilestoneText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMilestone()}
                placeholder="Add a milestone..."
                className={styles.addMilestoneInput}
              />
              <button 
                onClick={handleAddMilestone}
                className={styles.addMilestoneBtn}
                disabled={!newMilestoneText.trim()}
              >
                +
              </button>
            </div>
          </div>
        )}

        {goal.notes && (
          <div className={styles.notes}>{goal.notes}</div>
        )}
      </div>
    </div>
  );
}

interface RuleTrackerProps {
  goal: Goal;
  ruleLogs: RuleLogEntry[];
  onLogToggle: (date: string, success: boolean) => void;
}

function RuleTracker({ goal, ruleLogs, onLogToggle }: RuleTrackerProps) {
  const period = goal.rulePeriod || 'week';
  const ruleType = goal.ruleType || 'avoid';
  
  const periodDates = useMemo(() => {
    if (period === 'week') return getWeekDates();
    if (period === 'month') return getMonthDates();
    return [formatDateLocal(new Date())];
  }, [period]);

  const today = formatDateLocal(new Date());
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getLogForDate = (date: string) => ruleLogs.find(l => l.date === date);

  // Calculate stats
  const periodLogs = ruleLogs.filter(l => periodDates.includes(l.date));
  const successCount = periodLogs.filter(l => l.success).length;
  const failCount = periodLogs.filter(l => !l.success).length;

  return (
    <div className={styles.ruleTracker}>
      <div className={styles.ruleInfo}>
        {ruleType === 'avoid' ? (
          <span className={styles.ruleDescription}>
            🚫 Avoid {period === 'day' ? '• Daily' : `• ${period === 'week' ? 'Weekly' : 'Monthly'}`}
          </span>
        ) : (
          <span className={styles.ruleDescription}>
            ✅ {period === 'day' ? 'Do daily' : `Do ${goal.ruleTarget}x per ${period}`} • {successCount}/{goal.ruleTarget || 1} done
          </span>
        )}
      </div>
      
      {period === 'week' && (
        <div className={styles.weekGrid}>
          {periodDates.map((date, i) => {
            const log = getLogForDate(date);
            const isToday = date === today;
            const isFuture = date > today;
            const dayNum = new Date(date).getDate();
            
            return (
              <div key={date} className={styles.dayCell}>
                <span className={styles.dayName}>{dayNames[i]}</span>
                <button
                  className={`${styles.dayBtn} ${
                    log?.success ? styles.daySuccess : 
                    log && !log.success ? styles.dayFail : ''
                  } ${isToday ? styles.dayToday : ''} ${isFuture ? styles.dayFuture : ''}`}
                  onClick={() => {
                    if (!isFuture) {
                      if (ruleType === 'avoid') {
                        // For avoid: clicking logs a failure
                        onLogToggle(date, false);
                      } else {
                        // For achieve: clicking logs a success
                        onLogToggle(date, true);
                      }
                    }
                  }}
                  disabled={isFuture}
                  title={
                    log?.success ? 'Success ✓' : 
                    log && !log.success ? 'Failed ✗' : 
                    ruleType === 'avoid' ? 'Click to log failure' : 'Click to log success'
                  }
                >
                  {log?.success ? '✓' : log && !log.success ? '✗' : dayNum}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {period === 'month' && (
        <div className={styles.monthGrid}>
          {periodDates.map((date) => {
            const log = getLogForDate(date);
            const isToday = date === today;
            const isFuture = date > today;
            const dayNum = new Date(date).getDate();
            
            return (
              <button
                key={date}
                className={`${styles.monthDay} ${
                  log?.success ? styles.daySuccess : 
                  log && !log.success ? styles.dayFail : ''
                } ${isToday ? styles.dayToday : ''} ${isFuture ? styles.dayFuture : ''}`}
                onClick={() => {
                  if (!isFuture) {
                    if (ruleType === 'avoid') {
                      onLogToggle(date, false);
                    } else {
                      onLogToggle(date, true);
                    }
                  }
                }}
                disabled={isFuture}
              >
                {log?.success ? '✓' : log && !log.success ? '✗' : dayNum}
              </button>
            );
          })}
        </div>
      )}

      {period === 'day' && (
        <div className={styles.dailyTracker}>
          {(() => {
            const log = getLogForDate(today);
            const hasSlipped = log !== undefined && !log.success;
            const todaySuccessCount = ruleLogs.filter(l => l.date === today && l.success).length;
            const target = goal.ruleTarget || 1;
            
            return (
              <div className={styles.dailyButtons}>
                {ruleType === 'avoid' ? (
                  // Avoid type: toggle between "on track" and "slipped"
                  <>
                    <button
                      className={`${styles.dailyBtn} ${!hasSlipped ? styles.dailySuccess : ''}`}
                      onClick={() => {
                        if (hasSlipped) {
                          // Remove the failure log to go back to "on track"
                          onLogToggle(today, false);
                        }
                      }}
                      disabled={!hasSlipped}
                    >
                      ✓ On Track
                    </button>
                    <button
                      className={`${styles.dailyBtn} ${hasSlipped ? styles.dailyFail : ''}`}
                      onClick={() => {
                        if (!hasSlipped) {
                          onLogToggle(today, false);
                        }
                      }}
                      disabled={hasSlipped}
                    >
                      ✗ Slipped
                    </button>
                  </>
                ) : target > 1 ? (
                  // Achieve type with multiple times per day: show counter
                  <div className={styles.dailyCounter}>
                    <span className={styles.dailyCountLabel}>Done today:</span>
                    <div className={styles.dailyCountControls}>
                      <button
                        className={styles.dailyCountBtn}
                        onClick={() => {
                          // Remove one success log for today (pass false to trigger removal)
                          onLogToggle(today, false);
                        }}
                        disabled={todaySuccessCount === 0}
                      >
                        −
                      </button>
                      <span className={`${styles.dailyCountValue} ${todaySuccessCount >= target ? styles.dailyCountDone : ''}`}>
                        {todaySuccessCount} / {target}
                      </span>
                      <button
                        className={styles.dailyCountBtn}
                        onClick={() => onLogToggle(today, true)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ) : (
                  // Achieve type with 1 per day: simple toggle
                  <>
                    <button
                      className={`${styles.dailyBtn} ${todaySuccessCount > 0 ? styles.dailySuccess : ''}`}
                      onClick={() => onLogToggle(today, true)}
                      disabled={todaySuccessCount > 0}
                    >
                      ✓ Done Today
                    </button>
                    <button
                      className={`${styles.dailyBtn} ${todaySuccessCount === 0 ? styles.dailyActive : ''}`}
                      onClick={() => {
                        if (todaySuccessCount > 0) {
                          onLogToggle(today, true); // Toggle off
                        }
                      }}
                      disabled={todaySuccessCount === 0}
                    >
                      ✗ Not Done
                    </button>
                  </>
                )}
              </div>
            );
          })()}
        </div>
      )}

      <div className={styles.ruleStats}>
        {ruleType === 'avoid' ? (
          <span className={failCount > 0 ? 'text-danger' : 'text-success'}>
            {failCount === 0 ? '🎉 Perfect streak!' : `${failCount} slip${failCount > 1 ? 's' : ''} this ${period}`}
          </span>
        ) : (
          <span className={successCount >= (goal.ruleTarget || 1) ? 'text-success' : ''}>
            {successCount >= (goal.ruleTarget || 1) ? '🎉 Target reached!' : `${(goal.ruleTarget || 1) - successCount} more to go`}
          </span>
        )}
      </div>
    </div>
  );
}
