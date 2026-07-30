import { useState, useEffect, useCallback } from 'react';
import type { User, Goal, MonthlyCheckin } from './types';
import { authApi, goalsApi, checkinsApi } from './api';
import { AuthForm } from './components/AuthForm';
import { Header } from './components/Header';
import { ProgressSummary } from './components/ProgressSummary';
import { GoalsList } from './components/GoalsList';
import { CheckinsList } from './components/CheckinsList';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [checkins, setCheckins] = useState<MonthlyCheckin[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Check auth on mount
  useEffect(() => {
    authApi.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Load goals when user is authenticated
  const loadGoals = useCallback(async () => {
    if (!user) return;
    try {
      const data = await goalsApi.list();
      setGoals(data);
    } catch (err) {
      console.error('Failed to load goals:', err);
    }
  }, [user]);

  const handleGoalUpdated = useCallback((updatedGoal: Goal) => {
    setGoals((currentGoals) =>
      currentGoals.map((goal) => goal.id === updatedGoal.id ? updatedGoal : goal)
    );
  }, []);

  // Load checkins when user or month changes
  const loadCheckins = useCallback(async () => {
    if (!user) return;
    try {
      const data = await checkinsApi.list(selectedMonth);
      setCheckins(data);
    } catch (err) {
      console.error('Failed to load checkins:', err);
    }
  }, [user, selectedMonth]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  useEffect(() => {
    loadCheckins();
  }, [loadCheckins]);

  const handleLogout = async () => {
    await authApi.logout();
    setUser(null);
    setGoals([]);
    setCheckins([]);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        color: 'var(--text-secondary)'
      }}>
        <div className="fade-in">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onSuccess={setUser} />;
  }

  return (
    <div className="fade-in">
      <Header user={user} onLogout={handleLogout} />
      
      <main className="container">
        <ProgressSummary goals={goals} />
        
        <div className="grid-2" style={{ marginTop: 24 }}>
          <GoalsList 
            goals={goals} 
            onUpdate={loadGoals}
            onGoalUpdated={handleGoalUpdated}
          />
          
          <CheckinsList
            checkins={checkins}
            goals={goals}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            onUpdate={loadCheckins}
          />
        </div>
      </main>
    </div>
  );
}

export default App;

