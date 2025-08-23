import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useAdminDashboard from '../../hooks/useAdminDashboard';
import api from '../../services/api';
import React from 'react';
import { ToastProvider } from '../../components/ui/ToastContext';
import { JSDOM } from 'jsdom';

vi.mock('../../services/api');

const wrapper = ({ children }: { children?: React.ReactNode }) => React.createElement(ToastProvider, null, children);

// Provide a basic jsdom environment for tests that need DOM APIs
let dom: JSDOM;
beforeAll(() => {
  dom = new JSDOM('<!doctype html><html><body></body></html>');
  // @ts-ignore
  global.window = dom.window;
  // @ts-ignore
  global.document = dom.window.document;
  // @ts-ignore
  global.navigator = dom.window.navigator;
});

afterAll(() => {
  if (dom) {
    dom.window.close();
  }
  // @ts-ignore
  delete global.window;
  // @ts-ignore
  delete global.document;
  // @ts-ignore
  delete global.navigator;
});

describe('useAdminDashboard', () => {
  beforeEach(() => {
    (api.get as any).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches stats, activities, and pending actions successfully', async () => {
    const stats = { totalTeachers: 2, totalStudents: 10, monthlyRevenue: 1000, monthlyHours: 40 };
    const activities = [{ id: 'a1', action: 'Test', timestamp: new Date().toISOString(), targetType: 'user', details: '' }];
    const pending = { pendingTeacherApprovals: { count: 1 }, pendingExpenseApprovals: { count: 0, totalAmount: 0 } };

    (api.get as any).mockImplementation((url: string) => {
      if (url.startsWith('/dashboard/stats')) {
        return Promise.resolve({ data: { success: true, data: stats } });
      }
      if (url.startsWith('/dashboard/activities')) {
        return Promise.resolve({ data: { success: true, data: activities } });
      }
      if (url.startsWith('/dashboard/pending-actions')) {
        return Promise.resolve({ data: { success: true, data: pending } });
      }
      return Promise.resolve({ data: { success: false } });
    });

    const { result } = renderHook(() => useAdminDashboard(), { wrapper });

    // Wait for state to reflect fetched stats
    await waitFor(() => {
      expect(result.current.stats.totalTeachers).toBe(stats.totalTeachers);
    });

    expect(result.current.activities.length).toBe(activities.length);
    expect(result.current.pendingActions.pendingTeacherApprovals.count).toBe(pending.pendingTeacherApprovals.count);
  });

  it('handles API errors per section', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url.startsWith('/dashboard/stats')) {
        return Promise.reject(new Error('stats failed'));
      }
      if (url.startsWith('/dashboard/activities')) {
        return Promise.resolve({ data: { success: true, data: [] } });
      }
      if (url.startsWith('/dashboard/pending-actions')) {
        return Promise.reject(new Error('pending failed'));
      }
      return Promise.resolve({ data: { success: false } });
    });

    const { result } = renderHook(() => useAdminDashboard(), { wrapper });

    // Wait for errors to be set
    await waitFor(() => {
      expect(result.current.error.stats).toBeTruthy();
      expect(result.current.error.pendingActions).toBeTruthy();
    });

    expect(result.current.activities).toBeDefined();
  });
});
