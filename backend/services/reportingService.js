const FinancialReport = require('../models/FinancialReport');
const accountingService = require('./accountingService');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class ReportingService {
  /**
   * Generate comprehensive financial report
   * @param {Date} startDate - Start date for the report
   * @param {Date} endDate - End date for the report
   * @param {String} generatedBy - User ID who generated the report
   * @param {String} reportType - Type of report
   * @param {String} format - Output format (pdf, excel, json)
   * @returns {Object} Generated report data and file path
   */
  async generateFinancialReport(startDate, endDate, generatedBy, reportType = 'comprehensive', format = 'json') {
    try {
      // Generate the report data using FinancialReport model
      const report = await FinancialReport.generateReport(startDate, endDate, generatedBy, reportType);
      
      let filePath = null;
      
      // Generate file based on format
      if (format === 'excel') {
        filePath = await this.generateExcelReport(report);
      } else if (format === 'pdf') {
        filePath = await this.generatePDFReport(report);
      }
      
      return {
        report,
        filePath,
        format
      };
    } catch (error) {
      throw new Error(`Failed to generate financial report: ${error.message}`);
    }
  }

  /**
   * Generate Excel report
   * @param {Object} reportData - Report data
   * @returns {String} File path
   */
  async generateExcelReport(reportData) {
    try {
      const workbook = new ExcelJS.Workbook();
      
      // Summary Sheet
      const summarySheet = workbook.addWorksheet('Financial Summary');
      
      // Add header
      summarySheet.addRow(['Financial Report']);
      summarySheet.addRow([`Period: ${reportData.periodStart.toDateString()} - ${reportData.periodEnd.toDateString()}`]);
      summarySheet.addRow(['Generated:', new Date().toISOString()]);
      summarySheet.addRow([]); // Empty row
      
      // Revenue Section
      summarySheet.addRow(['REVENUE']);
      summarySheet.addRow(['Student Payments - Total', reportData.revenue.studentPayments.total]);
      summarySheet.addRow(['Student Payments - Received', reportData.revenue.studentPayments.received]);
      summarySheet.addRow(['Student Payments - Pending', reportData.revenue.studentPayments.pending]);
      summarySheet.addRow(['Student Payments - Overdue', reportData.revenue.studentPayments.overdue]);
      summarySheet.addRow(['Other Income', reportData.revenue.otherIncome]);
      summarySheet.addRow(['Total Revenue', reportData.revenue.totalRevenue]);
      summarySheet.addRow([]); // Empty row
      
      // Expenses Section
      summarySheet.addRow(['EXPENSES']);
      summarySheet.addRow(['Teacher Payments - Total', reportData.expenses.teacherPayments.total]);
      summarySheet.addRow(['Teacher Payments - Paid', reportData.expenses.teacherPayments.paid]);
      summarySheet.addRow(['Teacher Payments - Pending', reportData.expenses.teacherPayments.pending]);
      summarySheet.addRow(['General Expenses - Rent', reportData.expenses.generalExpenses.rent]);
      summarySheet.addRow(['General Expenses - Utilities', reportData.expenses.generalExpenses.utilities]);
      summarySheet.addRow(['General Expenses - Supplies', reportData.expenses.generalExpenses.supplies]);
      summarySheet.addRow(['General Expenses - Marketing', reportData.expenses.generalExpenses.marketing]);
      summarySheet.addRow(['General Expenses - Maintenance', reportData.expenses.generalExpenses.maintenance]);
      summarySheet.addRow(['General Expenses - Insurance', reportData.expenses.generalExpenses.insurance]);
      summarySheet.addRow(['General Expenses - Other', reportData.expenses.generalExpenses.other]);
      summarySheet.addRow(['Total General Expenses', reportData.expenses.generalExpenses.total]);
      summarySheet.addRow(['Total Expenses', reportData.expenses.totalExpenses]);
      summarySheet.addRow([]); // Empty row
      
      // Net Income Section
      summarySheet.addRow(['NET INCOME']);
      summarySheet.addRow(['Net Income', reportData.netIncome]);
      summarySheet.addRow(['Profit Margin (%)', reportData.profitMargin]);
      summarySheet.addRow(['Status', reportData.profitLossStatus]);
      summarySheet.addRow([]); // Empty row
      
      // Metrics Section
      summarySheet.addRow(['METRICS']);
      summarySheet.addRow(['Total Students', reportData.studentMetrics.totalStudents]);
      summarySheet.addRow(['Active Students', reportData.studentMetrics.activeStudents]);
      summarySheet.addRow(['New Students', reportData.studentMetrics.newStudents]);
      summarySheet.addRow(['Revenue per Student', reportData.studentMetrics.revenuePerStudent]);
      summarySheet.addRow(['Total Teachers', reportData.teacherMetrics.totalTeachers]);
      summarySheet.addRow(['Active Teachers', reportData.teacherMetrics.activeTeachers]);
      summarySheet.addRow(['Total Hours Worked', reportData.teacherMetrics.totalHoursWorked]);
      summarySheet.addRow(['Average Hourly Rate', reportData.teacherMetrics.averageHourlyRate]);
      
      // Style the header
      summarySheet.getRow(1).font = { bold: true, size: 16 };
      summarySheet.getRow(5).font = { bold: true };
      summarySheet.getRow(13).font = { bold: true };
      summarySheet.getRow(26).font = { bold: true };
      summarySheet.getRow(31).font = { bold: true };
      
      // Auto-fit columns
      summarySheet.columns.forEach(column => {
        column.width = 25;
      });
      
      // Generate file path and save
      const fileName = `financial_report_${reportData._id}_${Date.now()}.xlsx`;
      const filePath = path.join(__dirname, '../exports', fileName);
      
      // Ensure exports directory exists
      const exportsDir = path.dirname(filePath);
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }
      
      await workbook.xlsx.writeFile(filePath);
      
      return filePath;
    } catch (error) {
      throw new Error(`Failed to generate Excel report: ${error.message}`);
    }
  }

  /**
   * Generate PDF report
   * @param {Object} reportData - Report data
   * @returns {String} File path
   */
  async generatePDFReport(reportData) {
    try {
      const doc = new PDFDocument({ margin: 50 });
      
      // Generate file path
      const fileName = `financial_report_${reportData._id}_${Date.now()}.pdf`;
      const filePath = path.join(__dirname, '../exports', fileName);
      
      // Ensure exports directory exists
      const exportsDir = path.dirname(filePath);
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }
      
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
      
      // Header
      doc.fontSize(20).text('Financial Report', { align: 'center' });
      doc.fontSize(12).text(`Period: ${reportData.periodStart.toDateString()} - ${reportData.periodEnd.toDateString()}`, { align: 'center' });
      doc.text(`Generated: ${new Date().toISOString()}`, { align: 'center' });
      doc.moveDown(2);
      
      // Revenue Section
      doc.fontSize(16).text('REVENUE', { underline: true });
      doc.fontSize(12);
      doc.text(`Student Payments - Total: $${reportData.revenue.studentPayments.total.toFixed(2)}`);
      doc.text(`Student Payments - Received: $${reportData.revenue.studentPayments.received.toFixed(2)}`);
      doc.text(`Student Payments - Pending: $${reportData.revenue.studentPayments.pending.toFixed(2)}`);
      doc.text(`Student Payments - Overdue: $${reportData.revenue.studentPayments.overdue.toFixed(2)}`);
      doc.text(`Other Income: $${reportData.revenue.otherIncome.toFixed(2)}`);
      doc.fontSize(14).text(`Total Revenue: $${reportData.revenue.totalRevenue.toFixed(2)}`, { underline: true });
      doc.moveDown();
      
      // Expenses Section
      doc.fontSize(16).text('EXPENSES', { underline: true });
      doc.fontSize(12);
      doc.text(`Teacher Payments - Total: $${reportData.expenses.teacherPayments.total.toFixed(2)}`);
      doc.text(`Teacher Payments - Paid: $${reportData.expenses.teacherPayments.paid.toFixed(2)}`);
      doc.text(`Teacher Payments - Pending: $${reportData.expenses.teacherPayments.pending.toFixed(2)}`);
      doc.text(`General Expenses - Rent: $${reportData.expenses.generalExpenses.rent.toFixed(2)}`);
      doc.text(`General Expenses - Utilities: $${reportData.expenses.generalExpenses.utilities.toFixed(2)}`);
      doc.text(`General Expenses - Supplies: $${reportData.expenses.generalExpenses.supplies.toFixed(2)}`);
      doc.text(`General Expenses - Marketing: $${reportData.expenses.generalExpenses.marketing.toFixed(2)}`);
      doc.text(`General Expenses - Maintenance: $${reportData.expenses.generalExpenses.maintenance.toFixed(2)}`);
      doc.text(`General Expenses - Insurance: $${reportData.expenses.generalExpenses.insurance.toFixed(2)}`);
      doc.text(`General Expenses - Other: $${reportData.expenses.generalExpenses.other.toFixed(2)}`);
      doc.fontSize(14).text(`Total Expenses: $${reportData.expenses.totalExpenses.toFixed(2)}`, { underline: true });
      doc.moveDown();
      
      // Net Income Section
      doc.fontSize(16).text('NET INCOME', { underline: true });
      doc.fontSize(14);
      const netIncomeColor = reportData.netIncome >= 0 ? 'green' : 'red';
      doc.fillColor(netIncomeColor).text(`Net Income: $${reportData.netIncome.toFixed(2)}`);
      doc.fillColor('black').text(`Profit Margin: ${reportData.profitMargin.toFixed(2)}%`);
      doc.text(`Status: ${reportData.profitLossStatus.toUpperCase()}`);
      doc.moveDown();
      
      // Metrics Section
      doc.fontSize(16).text('METRICS', { underline: true });
      doc.fontSize(12);
      doc.text('Student Metrics:');
      doc.text(`  Total Students: ${reportData.studentMetrics.totalStudents}`);
      doc.text(`  Active Students: ${reportData.studentMetrics.activeStudents}`);
      doc.text(`  New Students: ${reportData.studentMetrics.newStudents}`);
      doc.text(`  Revenue per Student: $${reportData.studentMetrics.revenuePerStudent.toFixed(2)}`);
      doc.moveDown();
      doc.text('Teacher Metrics:');
      doc.text(`  Total Teachers: ${reportData.teacherMetrics.totalTeachers}`);
      doc.text(`  Active Teachers: ${reportData.teacherMetrics.activeTeachers}`);
      doc.text(`  Total Hours Worked: ${reportData.teacherMetrics.totalHoursWorked.toFixed(1)}`);
      doc.text(`  Average Hourly Rate: $${reportData.teacherMetrics.averageHourlyRate.toFixed(2)}`);
      
      // Finalize the PDF
      doc.end();
      
      return new Promise((resolve, reject) => {
        stream.on('finish', () => resolve(filePath));
        stream.on('error', reject);
      });
    } catch (error) {
      throw new Error(`Failed to generate PDF report: ${error.message}`);
    }
  }

  /**
   * Generate student revenue report
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {String} format - Output format
   * @returns {Object} Report data and file path
   */
  async generateStudentRevenueReport(startDate, endDate, format = 'json') {
    try {
      const studentData = await accountingService.getStudentAccountingData(startDate, endDate);
      
      if (format === 'excel') {
        const filePath = await this.generateStudentRevenueExcel(studentData);
        return { data: studentData, filePath, format };
      }
      
      return { data: studentData, format };
    } catch (error) {
      throw new Error(`Failed to generate student revenue report: ${error.message}`);
    }
  }

  /**
   * Generate teacher expenses report
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {String} format - Output format
   * @returns {Object} Report data and file path
   */
  async generateTeacherExpensesReport(startDate, endDate, format = 'json') {
    try {
      const teacherData = await accountingService.getTeacherAccountingData(startDate, endDate);
      
      if (format === 'excel') {
        const filePath = await this.generateTeacherExpensesExcel(teacherData);
        return { data: teacherData, filePath, format };
      }
      
      return { data: teacherData, format };
    } catch (error) {
      throw new Error(`Failed to generate teacher expenses report: ${error.message}`);
    }
  }

  /**
   * Generate cash flow report
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {String} period - Grouping period
   * @param {String} format - Output format
   * @returns {Object} Report data and file path
   */
  async generateCashFlowReport(startDate, endDate, period = 'monthly', format = 'json') {
    try {
      const cashFlowData = await accountingService.getCashFlowData(startDate, endDate, period);
      
      if (format === 'excel') {
        const filePath = await this.generateCashFlowExcel(cashFlowData);
        return { data: cashFlowData, filePath, format };
      }
      
      return { data: cashFlowData, format };
    } catch (error) {
      throw new Error(`Failed to generate cash flow report: ${error.message}`);
    }
  }

  /**
   * Generate student revenue Excel report
   * @param {Object} studentData - Student data
   * @returns {String} File path
   */
  async generateStudentRevenueExcel(studentData) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Student Revenue Report');
      
      // Add headers
      worksheet.addRow(['Student Revenue Report']);
      worksheet.addRow([`Period: ${studentData.period.start.toDateString()} - ${studentData.period.end.toDateString()}`]);
      worksheet.addRow(['Generated:', new Date().toISOString()]);
      worksheet.addRow([]); // Empty row
      
      // Summary
      worksheet.addRow(['SUMMARY']);
      worksheet.addRow(['Total Students', studentData.studentCount]);
      worksheet.addRow(['Total Fees', studentData.totals.totalFees]);
      worksheet.addRow(['Total Paid', studentData.totals.totalPaid]);
      worksheet.addRow(['Total Pending', studentData.totals.totalPending]);
      worksheet.addRow(['Total Overdue', studentData.totals.totalOverdue]);
      worksheet.addRow(['Total Remaining', studentData.totals.totalRemaining]);
      worksheet.addRow([]); // Empty row
      
      // Student details header
      worksheet.addRow(['STUDENT DETAILS']);
      worksheet.addRow(['Name', 'Email', 'Teacher', 'Total Fee', 'Paid', 'Pending', 'Overdue', 'Remaining', 'Payment Count']);
      
      // Student details
      studentData.students.forEach(student => {
        worksheet.addRow([
          student.student.name,
          student.student.email,
          student.student.teacher ? `${student.student.teacher.profile.firstName} ${student.student.teacher.profile.lastName}` : 'N/A',
          student.financials.estimatedTotalFee,
          student.financials.totalPaid,
          student.financials.totalPending,
          student.financials.totalOverdue,
          student.financials.remainingBalance,
          student.financials.paymentHistory
        ]);
      });
      
      // Style headers
      worksheet.getRow(1).font = { bold: true, size: 16 };
      worksheet.getRow(5).font = { bold: true };
      worksheet.getRow(13).font = { bold: true };
      worksheet.getRow(14).font = { bold: true };
      
      // Auto-fit columns
      worksheet.columns.forEach(column => {
        column.width = 15;
      });
      
      // Generate file path and save
      const fileName = `student_revenue_report_${Date.now()}.xlsx`;
      const filePath = path.join(__dirname, '../exports', fileName);
      
      await workbook.xlsx.writeFile(filePath);
      return filePath;
    } catch (error) {
      throw new Error(`Failed to generate student revenue Excel: ${error.message}`);
    }
  }

  /**
   * Generate teacher expenses Excel report
   * @param {Object} teacherData - Teacher data
   * @returns {String} File path
   */
  async generateTeacherExpensesExcel(teacherData) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Teacher Expenses Report');
      
      // Add headers
      worksheet.addRow(['Teacher Expenses Report']);
      worksheet.addRow([`Period: ${teacherData.period.start.toDateString()} - ${teacherData.period.end.toDateString()}`]);
      worksheet.addRow(['Generated:', new Date().toISOString()]);
      worksheet.addRow([]); // Empty row
      
      // Summary
      worksheet.addRow(['SUMMARY']);
      worksheet.addRow(['Total Teachers', teacherData.teacherCount]);
      worksheet.addRow(['Total Hours', teacherData.totals.totalHours]);
      worksheet.addRow(['Total Earnings', teacherData.totals.totalEarnings]);
      worksheet.addRow(['Total Paid', teacherData.totals.totalPaid]);
      worksheet.addRow(['Total Pending', teacherData.totals.totalPending]);
      worksheet.addRow(['Total Unpaid', teacherData.totals.totalUnpaid]);
      worksheet.addRow(['Total Deficit', teacherData.totals.totalDeficit]);
      worksheet.addRow([]); // Empty row
      
      // Teacher details header
      worksheet.addRow(['TEACHER DETAILS']);
      worksheet.addRow(['Name', 'Email', 'Hours Worked', 'Earnings', 'Paid', 'Pending', 'Unpaid', 'Status', 'Time Entries']);
      
      // Teacher details
      teacherData.teachers.forEach(teacher => {
        worksheet.addRow([
          teacher.teacher.name,
          teacher.teacher.email,
          teacher.hours.totalHours,
          teacher.hours.totalEarnings,
          teacher.payments.totalPaid,
          teacher.payments.totalPending,
          teacher.payments.unpaidEarnings,
          teacher.status.isPaidUp ? 'Paid Up' : 'Payment Due',
          teacher.timeEntries
        ]);
      });
      
      // Style headers
      worksheet.getRow(1).font = { bold: true, size: 16 };
      worksheet.getRow(5).font = { bold: true };
      worksheet.getRow(14).font = { bold: true };
      worksheet.getRow(15).font = { bold: true };
      
      // Auto-fit columns
      worksheet.columns.forEach(column => {
        column.width = 15;
      });
      
      // Generate file path and save
      const fileName = `teacher_expenses_report_${Date.now()}.xlsx`;
      const filePath = path.join(__dirname, '../exports', fileName);
      
      await workbook.xlsx.writeFile(filePath);
      return filePath;
    } catch (error) {
      throw new Error(`Failed to generate teacher expenses Excel: ${error.message}`);
    }
  }

  /**
   * Generate cash flow Excel report
   * @param {Object} cashFlowData - Cash flow data
   * @returns {String} File path
   */
  async generateCashFlowExcel(cashFlowData) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Cash Flow Report');
      
      // Add headers
      worksheet.addRow(['Cash Flow Report']);
      worksheet.addRow([`Period: ${cashFlowData.period.start.toDateString()} - ${cashFlowData.period.end.toDateString()}`]);
      worksheet.addRow(['Generated:', new Date().toISOString()]);
      worksheet.addRow([]); // Empty row
      
      // Summary
      worksheet.addRow(['SUMMARY']);
      worksheet.addRow(['Total Inflow', cashFlowData.summary.totalInflow]);
      worksheet.addRow(['Total Outflow', cashFlowData.summary.totalOutflow]);
      worksheet.addRow(['Net Cash Flow', cashFlowData.summary.netCashFlow]);
      worksheet.addRow(['Final Balance', cashFlowData.summary.finalBalance]);
      worksheet.addRow([]); // Empty row
      
      // Cash flow details header
      worksheet.addRow(['CASH FLOW DETAILS']);
      worksheet.addRow(['Period', 'Inflow', 'Outflow', 'Net Cash Flow', 'Running Total', 'Teacher Payments', 'General Expenses']);
      
      // Cash flow details
      cashFlowData.cashFlow.forEach(item => {
        worksheet.addRow([
          item.period,
          item.inflow,
          item.outflow,
          item.netCashFlow,
          item.runningTotal,
          item.details.teacherPayments,
          item.details.generalExpenses
        ]);
      });
      
      // Style headers
      worksheet.getRow(1).font = { bold: true, size: 16 };
      worksheet.getRow(5).font = { bold: true };
      worksheet.getRow(11).font = { bold: true };
      worksheet.getRow(12).font = { bold: true };
      
      // Auto-fit columns
      worksheet.columns.forEach(column => {
        column.width = 15;
      });
      
      // Generate file path and save
      const fileName = `cash_flow_report_${Date.now()}.xlsx`;
      const filePath = path.join(__dirname, '../exports', fileName);
      
      await workbook.xlsx.writeFile(filePath);
      return filePath;
    } catch (error) {
      throw new Error(`Failed to generate cash flow Excel: ${error.message}`);
    }
  }

  /**
   * Get saved reports
   * @param {Object} options - Query options
   * @returns {Object} Reports list with pagination
   */
  async getSavedReports(options = {}) {
    try {
      const { page = 1, limit = 10, reportType, startDate, endDate } = options;
      
      const query = { isArchived: false };
      
      if (reportType) {
        query.reportType = reportType;
      }
      
      if (startDate && endDate) {
        query.reportDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }
      
      const reports = await FinancialReport.find(query)
        .populate('generatedBy', 'profile.firstName profile.lastName email')
        .sort({ reportDate: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      
      const total = await FinancialReport.countDocuments(query);
      
      return {
        reports,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      };
    } catch (error) {
      throw new Error(`Failed to get saved reports: ${error.message}`);
    }
  }
}

module.exports = new ReportingService();
