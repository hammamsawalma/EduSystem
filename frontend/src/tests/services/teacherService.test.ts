import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import teacherService from '../../services/teacherService';
import api from '../../services/api';

vi.mock('../../services/api');

describe('teacherService.searchTeachers', () => {
  beforeEach(() => {
    (api.get as any).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return teacher list when API responds with data', async () => {
    const mockData = [{ id: 1, firstName: 'Alice', lastName: 'Smith' }];
    (api.get as any).mockResolvedValue({ data: { data: mockData } });

    const result = await teacherService.searchTeachers('Alice', 'All');
    expect(result).toEqual(mockData);
    expect(api.get).toHaveBeenCalled();
    const calledUrl = (api.get as any).mock.calls[0][0];
    expect(calledUrl).toContain('/users');
  });

  it('should pass abort signal to api.get when provided', async () => {
    const mockData = [{ id: 2, firstName: 'Bob' }];
    (api.get as any).mockResolvedValue({ data: { data: mockData } });

    const controller = new AbortController();
    const signal = controller.signal;

    const result = await teacherService.searchTeachers('Bob', 'Active', signal);
    expect(result).toEqual(mockData);
    expect(api.get).toHaveBeenCalledWith(expect.any(String), { signal });
  });

  it('should rethrow when request is canceled (ERR_CANCELED)', async () => {
    const canceledError = new Error('canceled');
    (canceledError as any).code = 'ERR_CANCELED';
    (api.get as any).mockRejectedValue(canceledError);

    const controller = new AbortController();
    const signal = controller.signal;

    await expect(teacherService.searchTeachers('x', 'All', signal)).rejects.toBe(canceledError);
    expect(api.get).toHaveBeenCalled();
  });

  it('should throw and log when API returns an unexpected error', async () => {
    const err = new Error('server error');
    (api.get as any).mockRejectedValue(err);

    await expect(teacherService.searchTeachers('', 'All')).rejects.toBe(err);
    expect(api.get).toHaveBeenCalled();
  });
});
