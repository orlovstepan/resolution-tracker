import type { User, Goal, MonthlyCheckin, CreateGoalInput, UpdateGoalInput, UpdateCheckinInput } from '../types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return res.json();
}

// Auth API
export const authApi = {
  async signup(email: string, password: string): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<User>(res);
  },

  async login(email: string, password: string): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<User>(res);
  },

  async logout(): Promise<void> {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  },

  async me(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      credentials: 'include',
    });
    return handleResponse<User>(res);
  },
};

// Goals API
export const goalsApi = {
  async list(): Promise<Goal[]> {
    const res = await fetch(`${API_BASE}/goals`, {
      credentials: 'include',
    });
    return handleResponse<Goal[]>(res);
  },

  async create(data: CreateGoalInput): Promise<Goal> {
    const res = await fetch(`${API_BASE}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<Goal>(res);
  },

  async update(id: string, data: UpdateGoalInput): Promise<Goal> {
    const res = await fetch(`${API_BASE}/goals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<Goal>(res);
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/goals/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    await handleResponse(res);
  },
};

// Checkins API
export const checkinsApi = {
  async list(month?: string): Promise<MonthlyCheckin[]> {
    const params = month ? `?month=${month}` : '';
    const res = await fetch(`${API_BASE}/checkins${params}`, {
      credentials: 'include',
    });
    return handleResponse<MonthlyCheckin[]>(res);
  },

  async create(monthKey: string): Promise<MonthlyCheckin> {
    const res = await fetch(`${API_BASE}/checkins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ monthKey }),
    });
    return handleResponse<MonthlyCheckin>(res);
  },

  async update(id: string, data: UpdateCheckinInput): Promise<MonthlyCheckin> {
    const res = await fetch(`${API_BASE}/checkins/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<MonthlyCheckin>(res);
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/checkins/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    await handleResponse(res);
  },
};

