import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import studentService from '../../services/studentService';
import api from '../../services/api';

vi.mock('../../services/api');

describe('studentService', () => {
  beforeEach(() => {
    (api.get as any).mockReset();
    (api.post as any).mockReset();
    (api.put as any).mockReset();
    (api.delete as any).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getStudents returns data and total', async () => {
    const mockStudents = [{ id: 1, firstName: 'A', lastName: 'B' }];
    (api.get as any).mockResolvedValue({ data: { data: mockStudents, total: 1 } });

    const res = await studentService.getStudents({ page: 1, limit: 10 });
    expect(res.data).toEqual(mockStudents);
    expect(res.total).toBe(1);
    expect(api.get).toHaveBeenCalled();
  });

  it('searchStudents passes signal and returns data', async () => {
    const mockStudents = [{ id: 2, firstName: 'C' }];
    (api.get as any).mockResolvedValue({ data: { data: mockStudents } });

    const controller = new AbortController();
    const signal = controller.signal;

    const res = await studentService.searchStudents('C', {}, signal);
    expect(res).toEqual(mockStudents);
    expect(api.get).toHaveBeenCalledWith(expect.any(String), { params: expect.any(Object), signal });
  });

  it('create/update/delete student call respective endpoints', async () => {
    const newStudent = { id: 3, firstName: 'D', lastName: 'E' };
    (api.post as any).mockResolvedValue({ data: { data: newStudent } });
    (api.put as any).mockResolvedValue({ data: { data: newStudent } });
    (api.delete as any).mockResolvedValue({});

    const created = await studentService.createStudent({ firstName: 'D', lastName: 'E' });
    expect(created).toEqual(newStudent);
    expect(api.post).toHaveBeenCalled();

    const updated = await studentService.updateStudent(3, { firstName: 'D', lastName: 'E' });
    expect(updated).toEqual(newStudent);
    expect(api.put).toHaveBeenCalled();

    await studentService.deleteStudent(3);
    expect(api.delete).toHaveBeenCalled();
  });
});
