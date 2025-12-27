import { useState } from 'react';
import type { Goal, GoalType, GoalStatus, CreateGoalInput, UpdateGoalInput } from '../types';
import { goalsApi } from '../api';
import styles from './GoalsList.module.css';

interface GoalsListProps {
  goals: Goal[];
  onUpdate: () => void;
}

export function GoalsList({ goals, onUpdate }: GoalsListProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleCreate = async (data: CreateGoalInput) => {
    await goalsApi.create(data);
    setShowAddForm(false);
    onUpdate();
  };

  const handleUpdate = async (id: string, data: UpdateGoalInput) => {
    await goalsApi.update(id, data);
    setEditingId(null);
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this goal?')) {
      await goalsApi.delete(id);
      onUpdate();
    }
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
        {goals.map((goal) => (
          <GoalItem
            key={goal.id}
            goal={goal}
            isEditing={editingId === goal.id}
            onEdit={() => setEditingId(goal.id)}
            onCancelEdit={() => setEditingId(null)}
            onUpdate={(data) => handleUpdate(goal.id, data)}
            onDelete={() => handleDelete(goal.id)}
          />
        ))}

        {goals.length === 0 && !showAddForm && (
          <div className={styles.empty}>
            <p>No goals yet. Add your first goal to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface GoalFormProps {
  goal?: Goal;
  onSubmit: (data: CreateGoalInput | UpdateGoalInput) => void;
  onCancel: () => void;
}

function GoalForm({ goal, onSubmit, onCancel }: GoalFormProps) {
  const [title, setTitle] = useState(goal?.title || '');
  const [type, setType] = useState<GoalType>(goal?.type || 'counter');
  const [unit, setUnit] = useState(goal?.unit || '');
  const [target, setTarget] = useState(goal?.target?.toString() || '');
  const [nextMilestone, setNextMilestone] = useState(goal?.nextMilestone || '');
  const [notes, setNotes] = useState(goal?.notes || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        title,
        type,
        unit: unit || undefined,
        target: target ? parseFloat(target) : undefined,
        nextMilestone: nextMilestone || undefined,
        notes: notes || undefined,
      });
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
            <option value="rule">Rule</option>
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

      <div className={styles.formField}>
        <label className="label">Next Milestone</label>
        <input
          type="text"
          value={nextMilestone}
          onChange={(e) => setNextMilestone(e.target.value)}
          placeholder="What's your next step?"
        />
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
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (data: UpdateGoalInput) => void;
  onDelete: () => void;
}

function GoalItem({ goal, isEditing, onEdit, onCancelEdit, onUpdate, onDelete }: GoalItemProps) {
  const [value, setValue] = useState(goal.value);
  const [status, setStatus] = useState<GoalStatus>(goal.status);

  const progress = goal.type === 'counter' && goal.target 
    ? Math.min((goal.value / goal.target) * 100, 100)
    : goal.type === 'binary'
      ? goal.status === 'done' ? 100 : 0
      : goal.value;

  const handleQuickUpdate = async () => {
    if (value !== goal.value || status !== goal.status) {
      await onUpdate({ value, status });
    }
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
        <GoalForm goal={goal} onSubmit={onUpdate} onCancel={onCancelEdit} />
      </div>
    );
  }

  return (
    <div className={styles.item}>
      <div className={styles.itemHeader}>
        <div className={styles.itemTitle}>
          <span className={styles.typeIcon}>{typeIcons[goal.type]}</span>
          <span>{goal.title}</span>
        </div>
        <div className={styles.itemActions}>
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
            <div className={styles.counterInput}>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                onBlur={handleQuickUpdate}
                className={styles.valueInput}
              />
              <span className={styles.targetText}>
                / {goal.target} {goal.unit}
              </span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${progress}%`,
                  background: progress >= 100 
                    ? 'var(--accent-success)' 
                    : 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))'
                }}
              />
            </div>
          </div>
        )}

        {goal.type === 'rule' && (
          <div className={styles.ruleSection}>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
              onBlur={handleQuickUpdate}
              className={styles.valueInput}
              min={0}
              max={100}
            />
            <span className={styles.ruleLabel}>% compliance</span>
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
            {Math.round(progress)}%
          </span>
        </div>

        {goal.nextMilestone && (
          <div className={styles.milestone}>
            <span className={styles.milestoneLabel}>Next:</span>
            <span>{goal.nextMilestone}</span>
          </div>
        )}

        {goal.notes && (
          <div className={styles.notes}>{goal.notes}</div>
        )}
      </div>
    </div>
  );
}

