import { downloadFile } from './api';

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  startDate?: string;
  endDate?: string;
  includeStats?: boolean;
  studentId?: string;
}

class ExportService {
  /**
   * Export students data
   */
  async exportStudents(options: ExportOptions): Promise<void> {
    const params = new URLSearchParams();
    params.append('format', options.format);
    if (options.includeStats) {
      params.append('includeStats', 'true');
    }

    const filename = `students_${Date.now()}.${options.format}`;
    await downloadFile(`/exports/students?${params}`, filename);
  }

  /**
   * Export payments data
   */
  async exportPayments(options: ExportOptions): Promise<void> {
    const params = new URLSearchParams();
    params.append('format', options.format);
    if (options.startDate) {
      params.append('startDate', options.startDate);
    }
    if (options.endDate) {
      params.append('endDate', options.endDate);
    }

    const filename = `payments_${options.startDate || 'all'}_${options.endDate || 'all'}.${options.format}`;
    await downloadFile(`/exports/payments?${params}`, filename);
  }

  /**
   * Export attendance data
   */
  async exportAttendance(options: ExportOptions): Promise<void> {
    const params = new URLSearchParams();
    params.append('format', options.format);
    if (options.startDate) {
      params.append('startDate', options.startDate);
    }
    if (options.endDate) {
      params.append('endDate', options.endDate);
    }
    if (options.studentId) {
      params.append('studentId', options.studentId);
    }

    const filename = `attendance_${options.startDate || 'all'}_${options.endDate || 'all'}.${options.format}`;
    await downloadFile(`/exports/attendance?${params}`, filename);
  }

  /**
   * Export time entries data
   */
  async exportTimeEntries(options: ExportOptions): Promise<void> {
    const params = new URLSearchParams();
    params.append('format', options.format);
    if (options.startDate) {
      params.append('startDate', options.startDate);
    }
    if (options.endDate) {
      params.append('endDate', options.endDate);
    }

    const filename = `time_entries_${options.startDate || 'all'}_${options.endDate || 'all'}.${options.format}`;
    await downloadFile(`/exports/time-entries?${params}`, filename);
  }

  /**
   * Export expenses data
   */
  async exportExpenses(options: ExportOptions): Promise<void> {
    const params = new URLSearchParams();
    params.append('format', options.format);
    if (options.startDate) {
      params.append('startDate', options.startDate);
    }
    if (options.endDate) {
      params.append('endDate', options.endDate);
    }

    const filename = `expenses_${options.startDate || 'all'}_${options.endDate || 'all'}.${options.format}`;
    await downloadFile(`/exports/expenses?${params}`, filename);
  }

  /**
   * Clean up old export files
   */
  async cleanupExports(): Promise<void> {
    await downloadFile('/exports/cleanup', 'cleanup_result.json');
  }
}

export const exportService = new ExportService();
export default exportService;
