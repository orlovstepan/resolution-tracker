import { useState } from 'react';
import type { MonthlyCheckin, Goal, UpdateCheckinInput } from '../types';
import { checkinsApi } from '../api';
import styles from './CheckinsList.module.css';

interface CheckinsListProps {
  checkins: MonthlyCheckin[];
  goals: Goal[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onUpdate: () => void;
}

export function CheckinsList({ 
  checkins, 
  goals, 
  selectedMonth, 
  onMonthChange, 
  onUpdate 
}: CheckinsListProps) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await checkinsApi.create(selectedMonth);
      onUpdate();
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (id: string, data: UpdateCheckinInput) => {
    await checkinsApi.update(id, data);
    setEditingId(null);
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this check-in?')) {
      await checkinsApi.delete(id);
      onUpdate();
    }
  };

  // Generate month options (current year and previous year)
  const monthOptions = generateMonthOptions();

  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>📅 Monthly Check-ins</h2>
        <div className={styles.controls}>
          <select 
            value={selectedMonth} 
            onChange={(e) => onMonthChange(e.target.value)}
            className={styles.monthSelect}
          >
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <button 
            onClick={handleCreate} 
            className="btn-primary btn-small"
            disabled={creating}
          >
            {creating ? '...' : '+ Check-in'}
          </button>
        </div>
      </div>

      <div className={styles.list}>
        {checkins.map((checkin) => (
          <CheckinItem
            key={checkin.id}
            checkin={checkin}
            goals={goals}
            isEditing={editingId === checkin.id}
            onEdit={() => setEditingId(checkin.id)}
            onCancelEdit={() => setEditingId(null)}
            onUpdate={(data) => handleUpdate(checkin.id, data)}
            onDelete={() => handleDelete(checkin.id)}
          />
        ))}

        {checkins.length === 0 && (
          <div className={styles.empty}>
            <p>No check-ins for {formatMonth(selectedMonth)} yet.</p>
            <p className={styles.emptyHint}>Create one to snapshot your current progress!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function generateMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  
  // Go back 12 months and forward 1 month
  for (let i = -12; i <= 1; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    options.push({ value, label });
  }
  
  return options.reverse();
}

interface CheckinItemProps {
  checkin: MonthlyCheckin;
  goals: Goal[];
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (data: UpdateCheckinInput) => void;
  onDelete: () => void;
}

function CheckinItem({ 
  checkin, 
  goals, 
  isEditing, 
  onEdit, 
  onCancelEdit, 
  onUpdate, 
  onDelete 
}: CheckinItemProps) {
  const [highlight, setHighlight] = useState(checkin.highlight);
  const [blocker, setBlocker] = useState(checkin.blocker);
  const [notes, setNotes] = useState(checkin.notes);
  const [saving, setSaving] = useState(false);
  const [showSnapshot, setShowSnapshot] = useState(false);

  const createdAt = new Date(checkin.createdAt);
  const formattedDate = createdAt.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({ highlight, blocker, notes });
    } finally {
      setSaving(false);
    }
  };

  // Build goal map for snapshot display
  const goalMap = new Map(goals.map((g) => [g.id, g]));

  if (isEditing) {
    return (
      <div className={styles.item}>
        <div className={styles.itemHeader}>
          <span className={styles.itemDate}>{formattedDate}</span>
          <div className={styles.itemActions}>
            <button onClick={onCancelEdit} className="btn-ghost btn-small">
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              className="btn-primary btn-small"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div className={styles.editForm}>
          <div className={styles.field}>
            <label className="label">✨ Highlight</label>
            <textarea
              value={highlight}
              onChange={(e) => setHighlight(e.target.value)}
              placeholder="What went well this month?"
              rows={2}
            />
          </div>

          <div className={styles.field}>
            <label className="label">🚧 Blocker</label>
            <textarea
              value={blocker}
              onChange={(e) => setBlocker(e.target.value)}
              placeholder="What held you back?"
              rows={2}
            />
          </div>

          <div className={styles.field}>
            <label className="label">📝 Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional thoughts..."
              rows={2}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.item}>
      <div className={styles.itemHeader}>
        <span className={styles.itemDate}>{formattedDate}</span>
        <div className={styles.itemActions}>
          <button 
            onClick={() => setShowSnapshot(!showSnapshot)} 
            className="btn-ghost btn-icon"
            title="View snapshot"
          >
            📸
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
        {checkin.highlight && (
          <div className={styles.section}>
            <span className={styles.sectionIcon}>✨</span>
            <p>{checkin.highlight}</p>
          </div>
        )}

        {checkin.blocker && (
          <div className={styles.section}>
            <span className={styles.sectionIcon}>🚧</span>
            <p>{checkin.blocker}</p>
          </div>
        )}

        {checkin.notes && (
          <div className={styles.section}>
            <span className={styles.sectionIcon}>📝</span>
            <p>{checkin.notes}</p>
          </div>
        )}

        {!checkin.highlight && !checkin.blocker && !checkin.notes && (
          <p className={styles.emptyCheckin}>No details added yet. Click edit to add.</p>
        )}
      </div>

      {showSnapshot && (
        <div className={styles.snapshot}>
          <h4 className={styles.snapshotTitle}>📸 Snapshot at check-in</h4>
          <div className={styles.snapshotGrid}>
            {Object.entries(checkin.snapshotJson).map(([goalId, data]) => {
              const goal = goalMap.get(goalId);
              if (!goal) return null;
              
              return (
                <div key={goalId} className={styles.snapshotItem}>
                  <span className={styles.snapshotGoal}>{goal.title}</span>
                  <span className={styles.snapshotValue}>
                    {data.value}
                    {goal.target && ` / ${goal.target}`}
                    {goal.unit && ` ${goal.unit}`}
                  </span>
                  <span className={`badge ${
                    data.status === 'done' ? 'badge-success' : 
                    data.status === 'in_progress' ? 'badge-warning' : 'badge-muted'
                  }`}>
                    {data.status.replace('_', ' ')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

