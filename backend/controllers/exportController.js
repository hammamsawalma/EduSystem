const exportUtils = require('../utils/exportUtils');
const Student = require('../models/Student');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');
const TimeEntry = require('../models/TimeEntry');
const Expense = require('../models/Expense');
const User = require('../models/User');
const path = require('path');
const fs = require('fs').promises;

/**
 * Export Students Data
 */
const exportStudents = async (req, res) => {
  try {
    // Ensure exports directory exists
    await exportUtils.initializationPromise;
    
    const { format = 'csv', includeStats = false } = req.query;
    const teacherId = req.user.id;

    // Get students data
    const students = await Student.find({ teacherId })
      .select('-__v')
      .lean();

    // Format data for export
    const exportData = students.map(student => ({
      'Student ID': student._id,
      'First Name': student.personalInfo.firstName,
      'Last Name': student.personalInfo.lastName,
      'Email': student.personalInfo.email || '',
      'Phone': student.personalInfo.phone || '',
      'Date of Birth': student.personalInfo.dateOfBirth ? exportUtils.formatDate(student.personalInfo.dateOfBirth) : '',
      'Grade': student.academicInfo.grade || '',
      'Subjects': student.academicInfo.subjects ? student.academicInfo.subjects.join(', ') : '',
      'Enrollment Date': exportUtils.formatDate(student.enrollmentDate),
      'Status': student.status,
      'Payment Method': student.paymentInfo.paymentMethod || '',
      'Payment Schedule': student.paymentInfo.paymentSchedule || '',
      'Current Balance': exportUtils.formatCurrency(student.paymentInfo.currentBalance),
      'Total Paid': exportUtils.formatCurrency(student.paymentInfo.totalPaid),
      'Parent Name': student.parentInfo.parentName || '',
      'Parent Email': student.parentInfo.parentEmail || '',
      'Parent Phone': student.parentInfo.parentPhone || '',
      'Created At': exportUtils.formatDateTime(student.createdAt),
      'Updated At': exportUtils.formatDateTime(student.updatedAt)
    }));

    const filename = `students_${teacherId}_${Date.now()}`;
    let filePath;

    switch (format.toLowerCase()) {
      case 'csv':
        filePath = await exportUtils.generateCSV(exportData, filename);
        break;
      case 'excel':
        filePath = await exportUtils.generateExcel(exportData, filename, 'Students');
        break;
      case 'pdf':
        const pdfColumns = [
          { key: 'First Name', header: 'First Name' },
          { key: 'Last Name', header: 'Last Name' },
          { key: 'Email', header: 'Email' },
          { key: 'Grade', header: 'Grade' },
          { key: 'Status', header: 'Status' },
          { key: 'Enrollment Date', header: 'Enrolled' },
          { key: 'Current Balance', header: 'Balance' }
        ];
        filePath = await exportUtils.generatePDF({
          title: 'Students Report',
          subtitle: `Total Students: ${exportData.length}`,
          data: exportData,
          columns: pdfColumns,
          filename,
          footer: 'Education Management System'
        });
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Unsupported format. Use csv, excel, or pdf.'
        });
    }

    // Send file for download
    res.download(filePath, `${filename}.${format}`, (err) => {
      if (err) {
        console.error('Export download error:', err);
        res.status(500).json({
          success: false,
          message: 'Error downloading export file.'
        });
      }
    });

  } catch (error) {
    console.error('Export students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export students data.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Export Payments Data
 */
const exportPayments = async (req, res) => {
  try {
    // Ensure exports directory exists
    await exportUtils.initializationPromise;
    
    const { format = 'csv', startDate, endDate } = req.query;
    const teacherId = req.user.id;

    // Build query
    const query = { teacherId };
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    // Get payments data
    const payments = await Payment.find(query)
      .populate('studentId', 'personalInfo.firstName personalInfo.lastName')
      .select('-__v')
      .lean();

    // Format data for export
    const exportData = payments.map(payment => ({
      'Payment ID': payment._id,
      'Student': payment.studentId ? `${payment.studentId.personalInfo.firstName} ${payment.studentId.personalInfo.lastName}` : 'Unknown',
      'Amount': payment.amount,
      'Formatted Amount': exportUtils.formatCurrency(payment.amount, payment.currency),
      'Currency': payment.currency,
      'Payment Method': payment.paymentMethod,
      'Payment Date': exportUtils.formatDate(payment.paymentDate),
      'Payment Type': payment.paymentType,
      'Status': payment.status,
      'Reference': payment.reference || '',
      'Academic Period': payment.academicPeriod || '',
      'Receipt Number': payment.receiptNumber || '',
      'Due Date': payment.dueDate ? exportUtils.formatDate(payment.dueDate) : '',
      'Refund Amount': payment.refundInfo ? exportUtils.formatCurrency(payment.refundInfo.refundAmount, payment.currency) : '',
      'Refund Date': payment.refundInfo ? exportUtils.formatDate(payment.refundInfo.refundDate) : '',
      'Notes': payment.notes || '',
      'Created At': exportUtils.formatDateTime(payment.createdAt),
      'Updated At': exportUtils.formatDateTime(payment.updatedAt)
    }));

    const filename = `payments_${teacherId}_${Date.now()}`;
    let filePath;

    switch (format.toLowerCase()) {
      case 'csv':
        filePath = await exportUtils.generateCSV(exportData, filename);
        break;
      case 'excel':
        filePath = await exportUtils.generateExcel(exportData, filename, 'Payments');
        break;
      case 'pdf':
        const pdfColumns = [
          { key: 'Student', header: 'Student' },
          { key: 'Formatted Amount', header: 'Amount' },
          { key: 'Payment Method', header: 'Method' },
          { key: 'Payment Date', header: 'Date' },
          { key: 'Status', header: 'Status' },
          { key: 'Receipt Number', header: 'Receipt' }
        ];
        const totalAmount = exportData.reduce((sum, payment) => sum + (payment.Amount || 0), 0);
        filePath = await exportUtils.generatePDF({
          title: 'Payments Report',
          subtitle: `Total Payments: ${exportData.length} | Total Amount: ${exportUtils.formatCurrency(totalAmount)}`,
          data: exportData,
          columns: pdfColumns,
          filename,
          footer: 'Education Management System'
        });
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Unsupported format. Use csv, excel, or pdf.'
        });
    }

    // Send file
    res.download(filePath, `${filename}.${format}`, (err) => {
      if (err) {
        console.error('Export download error:', err);
        res.status(500).json({
          success: false,
          message: 'Error downloading export file.'
        });
      }
    });

  } catch (error) {
    console.error('Export payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export payments data.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Export Attendance Data
 */
const exportAttendance = async (req, res) => {
  try {
    // Ensure exports directory exists
    await exportUtils.initializationPromise;
    
    const { format = 'csv', startDate, endDate, studentId } = req.query;
    const teacherId = req.user.id;

    // Build query
    const query = { teacherId };
    if (startDate || endDate) {
      query.lessonDate = {};
      if (startDate) query.lessonDate.$gte = new Date(startDate);
      if (endDate) query.lessonDate.$lte = new Date(endDate);
    }
    if (studentId) query.studentId = studentId;

    // Get attendance data
    const attendance = await Attendance.find(query)
      .populate('studentId', 'personalInfo.firstName personalInfo.lastName')
      .populate('timeEntryId', 'hoursWorked totalAmount')
      .select('-__v')
      .lean();

    // Format data for export
    const exportData = attendance.map(record => ({
      'Attendance ID': record._id,
      'Student': record.studentId ? `${record.studentId.personalInfo.firstName} ${record.studentId.personalInfo.lastName}` : 'Unknown',
      'Lesson Date': exportUtils.formatDate(record.lessonDate),
      'Lesson Type': record.lessonType,
      'Status': record.status,
      'Duration (minutes)': record.duration || 0,
      'Late Minutes': record.lateMinutes || 0,
      'Makeup Scheduled': record.makeupScheduled ? exportUtils.formatDateTime(record.makeupScheduled) : '',
      'Makeup Completed': record.makeupCompleted ? 'Yes' : 'No',
      'Parent Notified': record.parentNotified ? 'Yes' : 'No',
      'Homework Assigned': record.homework ? record.homework.assigned || '' : '',
      'Homework Completed': record.homework ? (record.homework.completed ? 'Yes' : 'No') : '',
      'Notes': record.notes || '',
      'Created At': exportUtils.formatDateTime(record.createdAt),
      'Updated At': exportUtils.formatDateTime(record.updatedAt)
    }));

    const filename = `attendance_${teacherId}_${Date.now()}`;
    let filePath;

    switch (format.toLowerCase()) {
      case 'csv':
        filePath = await exportUtils.generateCSV(exportData, filename);
        break;
      case 'excel':
        filePath = await exportUtils.generateExcel(exportData, filename, 'Attendance');
        break;
      case 'pdf':
        const pdfColumns = [
          { key: 'Student', header: 'Student' },
          { key: 'Lesson Date', header: 'Date' },
          { key: 'Lesson Type', header: 'Type' },
          { key: 'Status', header: 'Status' },
          { key: 'Duration (minutes)', header: 'Duration' },
          { key: 'Notes', header: 'Notes' }
        ];
        const presentCount = exportData.filter(record => record.Status === 'present').length;
        const attendanceRate = exportUtils.formatPercentage(presentCount, exportData.length);
        filePath = await exportUtils.generatePDF({
          title: 'Attendance Report',
          subtitle: `Total Records: ${exportData.length} | Present: ${presentCount} | Attendance Rate: ${attendanceRate}`,
          data: exportData,
          columns: pdfColumns,
          filename,
          footer: 'Education Management System'
        });
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Unsupported format. Use csv, excel, or pdf.'
        });
    }

    // Send file
    res.download(filePath, `${filename}.${format}`, (err) => {
      if (err) {
        console.error('Export download error:', err);
        res.status(500).json({
          success: false,
          message: 'Error downloading export file.'
        });
      }
    });

  } catch (error) {
    console.error('Export attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export attendance data.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Export Time Entries Data
 */
const exportTimeEntries = async (req, res) => {
  try {
    // Ensure exports directory exists
    await exportUtils.initializationPromise;
    
    const { format = 'csv', startDate, endDate } = req.query;
    const teacherId = req.user.id;

    // Build query
    const query = { teacherId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Get time entries data
    const timeEntries = await TimeEntry.find(query)
      .populate('lessonTypeId', 'name')
      .populate('studentId', 'personalInfo.firstName personalInfo.lastName')
      .select('-__v')
      .lean();

    // Format data for export
    const exportData = timeEntries.map(entry => ({
      'Entry ID': entry._id,
      'Date': exportUtils.formatDate(entry.date),
      'Lesson Type': entry.lessonTypeId ? entry.lessonTypeId.name : 'Unknown',
      'Student': entry.studentId ? `${entry.studentId.personalInfo.firstName} ${entry.studentId.personalInfo.lastName}` : '',
      'Hours Worked': entry.hoursWorked,
      'Hourly Rate': exportUtils.formatCurrency(entry.hourlyRate, entry.currency),
      'Total Amount': exportUtils.formatCurrency(entry.totalAmount, entry.currency),
      'Currency': entry.currency,
      'Description': entry.description || '',
      'Created At': exportUtils.formatDateTime(entry.createdAt),
      'Updated At': exportUtils.formatDateTime(entry.updatedAt)
    }));

    const filename = `time_entries_${teacherId}_${Date.now()}`;
    let filePath;

    switch (format.toLowerCase()) {
      case 'csv':
        filePath = await exportUtils.generateCSV(exportData, filename);
        break;
      case 'excel':
        filePath = await exportUtils.generateExcel(exportData, filename, 'Time Entries');
        break;
      case 'pdf':
        const pdfColumns = [
          { key: 'Date', header: 'Date' },
          { key: 'Lesson Type', header: 'Type' },
          { key: 'Student', header: 'Student' },
          { key: 'Hours Worked', header: 'Hours' },
          { key: 'Hourly Rate', header: 'Rate' },
          { key: 'Total Amount', header: 'Total' }
        ];
        const totalHours = exportData.reduce((sum, entry) => sum + (entry['Hours Worked'] || 0), 0);
        const totalAmount = timeEntries.reduce((sum, entry) => sum + (entry.totalAmount || 0), 0);
        filePath = await exportUtils.generatePDF({
          title: 'Time Entries Report',
          subtitle: `Total Entries: ${exportData.length} | Total Hours: ${totalHours} | Total Amount: ${exportUtils.formatCurrency(totalAmount)}`,
          data: exportData,
          columns: pdfColumns,
          filename,
          footer: 'Education Management System'
        });
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Unsupported format. Use csv, excel, or pdf.'
        });
    }

    // Send file
    res.download(filePath, `${filename}.${format}`, (err) => {
      if (err) {
        console.error('Export download error:', err);
        res.status(500).json({
          success: false,
          message: 'Error downloading export file.'
        });
      }
    });

  } catch (error) {
    console.error('Export time entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export time entries data.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Export Expenses Data
 */
const exportExpenses = async (req, res) => {
  try {
    // Ensure exports directory exists
    await exportUtils.initializationPromise;
    
    const { format = 'csv', startDate, endDate } = req.query;
    const teacherId = req.user.id;

    // Build query
    const query = { submittedBy: teacherId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Get expenses data
    const expenses = await Expense.find(query)
      .populate('approvedBy', 'profile.firstName profile.lastName')
      .select('-__v')
      .lean();

    // Format data for export
    const exportData = expenses.map(expense => ({
      'Expense ID': expense._id,
      'Category': expense.category,
      'Amount': expense.amount,
      'Formatted Amount': exportUtils.formatCurrency(expense.amount, expense.currency),
      'Currency': expense.currency,
      'Description': expense.description,
      'Date': exportUtils.formatDate(expense.date),
      'Status': expense.status,
      'Approved By': expense.approvedBy ? `${expense.approvedBy.profile.firstName} ${expense.approvedBy.profile.lastName}` : '',
      'Approved At': expense.approvedAt ? exportUtils.formatDateTime(expense.approvedAt) : '',
      'Rejection Reason': expense.rejectionReason || '',
      'Is Recurring': expense.isRecurring ? 'Yes' : 'No',
      'Recurring Frequency': expense.recurringFrequency || '',
      'Receipt URL': expense.receiptUrl || '',
      'Created At': exportUtils.formatDateTime(expense.createdAt),
      'Updated At': exportUtils.formatDateTime(expense.updatedAt)
    }));

    const filename = `expenses_${teacherId}_${Date.now()}`;
    let filePath;

    switch (format.toLowerCase()) {
      case 'csv':
        filePath = await exportUtils.generateCSV(exportData, filename);
        break;
      case 'excel':
        filePath = await exportUtils.generateExcel(exportData, filename, 'Expenses');
        break;
      case 'pdf':
        const pdfColumns = [
          { key: 'Category', header: 'Category' },
          { key: 'Formatted Amount', header: 'Amount' },
          { key: 'Description', header: 'Description' },
          { key: 'Date', header: 'Date' },
          { key: 'Status', header: 'Status' },
          { key: 'Approved By', header: 'Approved By' }
        ];
        const totalAmount = exportData.reduce((sum, expense) => sum + (expense.Amount || 0), 0);
        const approvedAmount = exportData.filter(expense => expense.Status === 'approved').reduce((sum, expense) => sum + (expense.Amount || 0), 0);
        filePath = await exportUtils.generatePDF({
          title: 'Expenses Report',
          subtitle: `Total Expenses: ${exportData.length} | Total Amount: ${exportUtils.formatCurrency(totalAmount)} | Approved: ${exportUtils.formatCurrency(approvedAmount)}`,
          data: exportData,
          columns: pdfColumns,
          filename,
          footer: 'Education Management System'
        });
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Unsupported format. Use csv, excel, or pdf.'
        });
    }

    // Send file
    res.download(filePath, `${filename}.${format}`, (err) => {
      if (err) {
        console.error('Export download error:', err);
        res.status(500).json({
          success: false,
          message: 'Error downloading export file.'
        });
      }
    });

  } catch (error) {
    console.error('Export expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export expenses data.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Clean up old export files
 */
const cleanupExports = async (req, res) => {
  try {
    await exportUtils.cleanupOldFiles();
    res.json({
      success: true,
      message: 'Export files cleaned up successfully.'
    });
  } catch (error) {
    console.error('Export cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clean up export files.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  exportStudents,
  exportPayments,
  exportAttendance,
  exportTimeEntries,
  exportExpenses,
  cleanupExports
};
