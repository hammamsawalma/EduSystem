const nodemailer = require('nodemailer');
const cron = require('node-cron');
const User = require('../models/User');
const Student = require('../models/Student');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');
const TimeEntry = require('../models/TimeEntry');
const Expense = require('../models/Expense');

/**
 * Notification Service for handling email notifications and automated reminders
 */
class NotificationService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
    this.scheduleAutomatedNotifications();
  }

  /**
   * Initialize email transporter
   */
  initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Verify transporter configuration
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('Email transporter verification failed:', error);
        } else {
          console.log('Email transporter is ready');
        }
      });
    }
  }

  /**
   * Send email notification
   * @param {Object} options - Email options
   * @returns {Promise} Email result
   */
  async sendEmail(options) {
    const {
      to,
      subject,
      html,
      text,
      cc,
      bcc,
      attachments
    } = options;

    if (!this.transporter) {
      throw new Error('Email transporter not configured');
    }

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'Education System'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
      cc,
      bcc,
      attachments
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }

  /**
   * Send welcome email to new teachers
   * @param {Object} user - User object
   * @param {String} tempPassword - Temporary password
   */
  async sendWelcomeEmail(user, tempPassword) {
    const subject = 'Welcome to Education Management System';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Welcome to Education Management System!</h2>
        <p>Dear ${user.profile.firstName} ${user.profile.lastName},</p>
        <p>Your account has been created successfully. Here are your login details:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Temporary Password:</strong> ${tempPassword}</p>
          <p><strong>Login URL:</strong> <a href="${process.env.CLIENT_URL}/login">${process.env.CLIENT_URL}/login</a></p>
        </div>
        <p style="color: #e74c3c;"><strong>Important:</strong> Please change your password after your first login.</p>
        <p>If you have any questions, please contact our support team.</p>
        <p>Best regards,<br>Education Management System Team</p>
      </div>
    `;

    return await this.sendEmail({
      to: user.email,
      subject,
      html
    });
  }

  /**
   * Send account approval notification
   * @param {Object} user - User object
   */
  async sendAccountApprovalEmail(user) {
    const subject = 'Account Approved - Education Management System';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #27ae60;">Account Approved!</h2>
        <p>Dear ${user.profile.firstName} ${user.profile.lastName},</p>
        <p>Great news! Your account has been approved and is now active.</p>
        <p>You can now log in and start using the Education Management System:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/login" style="background-color: #27ae60; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Login Now</a>
        </div>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br>Education Management System Team</p>
      </div>
    `;

    return await this.sendEmail({
      to: user.email,
      subject,
      html
    });
  }

  /**
   * Send teacher approval notification with new password
   * @param {Object} user - User object
   * @param {String} newPassword - New temporary password
   */
  async sendTeacherApprovalEmail(user, newPassword) {
    const subject = 'Account Approved - Education Management System';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #27ae60;">Account Approved!</h2>
        <p>Dear ${user.profile.firstName} ${user.profile.lastName},</p>
        <p>Great news! Your teacher account has been approved and is now active.</p>
        <p>For security purposes, we've generated a new password for your account:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>New Password:</strong> ${newPassword}</p>
          <p><strong>Login URL:</strong> <a href="${process.env.CLIENT_URL}/login">${process.env.CLIENT_URL}/login</a></p>
        </div>
        <p style="color: #e74c3c;"><strong>Important:</strong> Please change your password after your first login for security.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/login" style="background-color: #27ae60; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Login Now</a>
        </div>
        <p>You now have access to the teacher dashboard where you can manage your classes, track student attendance, and monitor your earnings.</p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br>Education Management System Team</p>
      </div>
    `;

    return await this.sendEmail({
      to: user.email,
      subject,
      html
    });
  }

  /**
   * Send payment reminder notification
   * @param {Object} payment - Payment object
   * @param {Object} student - Student object
   */
  async sendPaymentReminder(payment, student) {
    const subject = `Payment Reminder - ${payment.academicPeriod}`;
    const overdueText = payment.isOverdue ? 'OVERDUE' : 'DUE';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">Payment ${overdueText}</h2>
        <p>Dear ${student.parentInfo.parentName || student.personalInfo.firstName},</p>
        <p>This is a reminder that a payment is ${overdueText.toLowerCase()} for ${student.personalInfo.firstName} ${student.personalInfo.lastName}.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Student:</strong> ${student.personalInfo.firstName} ${student.personalInfo.lastName}</p>
          <p><strong>Amount:</strong> ${payment.formattedAmount}</p>
          <p><strong>Payment Type:</strong> ${payment.paymentType}</p>
          <p><strong>Academic Period:</strong> ${payment.academicPeriod}</p>
          <p><strong>Due Date:</strong> ${payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : 'N/A'}</p>
          ${payment.isOverdue ? `<p style="color: #e74c3c;"><strong>Days Overdue:</strong> ${payment.daysOverdue}</p>` : ''}
        </div>
        <p>Please arrange payment at your earliest convenience.</p>
        <p>If you have any questions, please contact us.</p>
        <p>Best regards,<br>Education Management System</p>
      </div>
    `;

    const emailTo = student.parentInfo.parentEmail || student.personalInfo.email;
    if (emailTo) {
      return await this.sendEmail({
        to: emailTo,
        subject,
        html
      });
    }
  }

  /**
   * Send expense approval notification
   * @param {Object} expense - Expense object
   * @param {Object} teacher - Teacher object
   * @param {String} status - Approval status
   */
  async sendExpenseApprovalEmail(expense, teacher, status) {
    const subject = `Expense ${status.charAt(0).toUpperCase() + status.slice(1)} - ${expense.category}`;
    const statusColor = status === 'approved' ? '#27ae60' : '#e74c3c';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${statusColor};">Expense ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
        <p>Dear ${teacher.profile.firstName} ${teacher.profile.lastName},</p>
        <p>Your expense submission has been ${status}.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Category:</strong> ${expense.category}</p>
          <p><strong>Amount:</strong> ${expense.currency} ${expense.amount}</p>
          <p><strong>Description:</strong> ${expense.description}</p>
          <p><strong>Date:</strong> ${new Date(expense.date).toLocaleDateString()}</p>
          ${expense.rejectionReason ? `<p><strong>Reason:</strong> ${expense.rejectionReason}</p>` : ''}
        </div>
        <p>If you have any questions, please contact the administrator.</p>
        <p>Best regards,<br>Education Management System</p>
      </div>
    `;

    return await this.sendEmail({
      to: teacher.email,
      subject,
      html
    });
  }

  /**
   * Send attendance alert notification
   * @param {Object} student - Student object
   * @param {Object} teacher - Teacher object
   */
  async sendAttendanceAlert(student, teacher) {
    const subject = `Attendance Alert - ${student.personalInfo.firstName} ${student.personalInfo.lastName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f39c12;">Attendance Alert</h2>
        <p>Dear ${student.parentInfo.parentName || student.personalInfo.firstName},</p>
        <p>We noticed that ${student.personalInfo.firstName} has had some attendance issues recently.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Student:</strong> ${student.personalInfo.firstName} ${student.personalInfo.lastName}</p>
          <p><strong>Teacher:</strong> ${teacher.profile.firstName} ${teacher.profile.lastName}</p>
          <p><strong>Teacher Email:</strong> ${teacher.email}</p>
        </div>
        <p>Please ensure regular attendance for better academic performance.</p>
        <p>If you have any concerns, please contact the teacher directly.</p>
        <p>Best regards,<br>Education Management System</p>
      </div>
    `;

    const emailTo = student.parentInfo.parentEmail || student.personalInfo.email;
    if (emailTo) {
      return await this.sendEmail({
        to: emailTo,
        subject,
        html
      });
    }
  }

  /**
   * Send monthly earnings summary to teachers
   * @param {Object} teacher - Teacher object
   * @param {Object} summary - Earnings summary
   */
  async sendMonthlyEarningsSummary(teacher, summary) {
    const subject = `Monthly Earnings Summary - ${summary.month}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">Monthly Earnings Summary</h2>
        <p>Dear ${teacher.profile.firstName} ${teacher.profile.lastName},</p>
        <p>Here's your earnings summary for ${summary.month}:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Total Hours Worked:</strong> ${summary.totalHours}</p>
          <p><strong>Total Earnings:</strong> ${summary.totalEarnings}</p>
          <p><strong>Total Lessons:</strong> ${summary.totalLessons}</p>
          <p><strong>Average Hourly Rate:</strong> ${summary.averageRate}</p>
        </div>
        <p>You can view detailed reports in your dashboard.</p>
        <p>Best regards,<br>Education Management System</p>
      </div>
    `;

    return await this.sendEmail({
      to: teacher.email,
      subject,
      html
    });
  }

  /**
   * Schedule automated notifications
   */
  scheduleAutomatedNotifications() {
    // Daily payment reminders - Run every day at 9 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('Running daily payment reminders...');
      await this.sendDailyPaymentReminders();
    });

    // Weekly attendance alerts - Run every Monday at 8 AM
    cron.schedule('0 8 * * MON', async () => {
      console.log('Running weekly attendance alerts...');
      await this.sendWeeklyAttendanceAlerts();
    });

    // Monthly earnings summary - Run on the 1st of each month at 9 AM
    cron.schedule('0 9 1 * *', async () => {
      console.log('Running monthly earnings summaries...');
      await this.sendMonthlyEarningsSummaries();
    });
  }

  /**
   * Send daily payment reminders for overdue payments
   */
  async sendDailyPaymentReminders() {
    try {
      const overduePayments = await Payment.find({
        status: 'pending',
        dueDate: { $lt: new Date() }
      }).populate('studentId teacherId');

      for (const payment of overduePayments) {
        if (payment.studentId && payment.teacherId) {
          await this.sendPaymentReminder(payment, payment.studentId);
        }
      }

      console.log(`Sent ${overduePayments.length} payment reminders`);
    } catch (error) {
      console.error('Error sending daily payment reminders:', error);
    }
  }

  /**
   * Send weekly attendance alerts for students with poor attendance
   */
  async sendWeeklyAttendanceAlerts() {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const students = await Student.find({ status: 'active' }).populate('teacherId');

      for (const student of students) {
        const attendanceRecords = await Attendance.find({
          studentId: student._id,
          lessonDate: { $gte: oneWeekAgo }
        });

        const absentCount = attendanceRecords.filter(record => record.status === 'absent').length;
        const totalLessons = attendanceRecords.length;

        // Send alert if attendance rate is below 70%
        if (totalLessons > 0 && (absentCount / totalLessons) > 0.3) {
          await this.sendAttendanceAlert(student, student.teacherId);
        }
      }

      console.log('Sent weekly attendance alerts');
    } catch (error) {
      console.error('Error sending weekly attendance alerts:', error);
    }
  }

  /**
   * Send monthly earnings summaries to all teachers
   */
  async sendMonthlyEarningsSummaries() {
    try {
      const teachers = await User.find({ role: 'teacher', status: 'approved' });
      const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

      for (const teacher of teachers) {
        const timeEntries = await TimeEntry.find({
          teacherId: teacher._id,
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }).populate('lessonTypeId');

        const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hoursWorked, 0);
        const totalEarnings = timeEntries.reduce((sum, entry) => sum + entry.totalAmount, 0);
        const averageRate = totalHours > 0 ? (totalEarnings / totalHours).toFixed(2) : 0;

        const summary = {
          month: currentMonth,
          totalHours: totalHours.toFixed(2),
          totalEarnings: `$${totalEarnings.toFixed(2)}`,
          totalLessons: timeEntries.length,
          averageRate: `$${averageRate}`
        };

        await this.sendMonthlyEarningsSummary(teacher, summary);
      }

      console.log('Sent monthly earnings summaries');
    } catch (error) {
      console.error('Error sending monthly earnings summaries:', error);
    }
  }

  /**
   * Test notification configuration
   */
  async testNotification(email) {
    const subject = 'Test Notification - Education Management System';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">Test Notification</h2>
        <p>This is a test notification to verify that the email system is working correctly.</p>
        <p>If you receive this email, the notification system is configured properly.</p>
        <p>Timestamp: ${new Date().toLocaleString()}</p>
        <p>Best regards,<br>Education Management System</p>
      </div>
    `;

    return await this.sendEmail({
      to: email,
      subject,
      html
    });
  }
}

module.exports = NotificationService;
