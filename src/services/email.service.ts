import nodemailer from "nodemailer";
import prisma from "../lib/db";
import {
  EmailTemplate,
  ExamNotificationData,
  AssignmentNotificationData,
  AttendanceNotificationData,
  CourseNotificationData,
  SystemNotificationData,
  NotificationCategory,
  NotificationType,
} from "../types/notification.types";

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Initialize email transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(
    to: string,
    template: EmailTemplate,
    from?: string,
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: from || process.env.SMTP_FROM || "noreply@university.edu",
        to,
        subject: template.subject,
        text: template.text,
        html: template.html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", result.messageId);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }

  /**
   * Generate email template for exam notifications
   */
  generateExamNotificationTemplate(data: ExamNotificationData): EmailTemplate {
    const subject = `Exam Reminder: ${data.examTitle} - ${data.courseName}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Exam Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .exam-details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📚 Exam Reminder</h1>
          </div>
          <div class="content">
            <p>Dear ${data.studentName},</p>
            <p>This is a reminder about your upcoming exam:</p>
            
            <div class="exam-details">
              <h3>${data.examTitle}</h3>
              <p><strong>Course:</strong> ${data.courseName}</p>
              <p><strong>Date:</strong> ${data.examDate}</p>
              <p><strong>Time:</strong> ${data.examTime}</p>
              ${data.examLocation ? `<p><strong>Location:</strong> ${data.examLocation}</p>` : ""}
              ${data.examDuration ? `<p><strong>Duration:</strong> ${data.examDuration}</p>` : ""}
            </div>
            
            <p>Please make sure to arrive on time and bring all necessary materials.</p>
            <p>Good luck with your exam!</p>
          </div>
          <div class="footer">
            <p>This is an automated message from the University Management System.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Exam Reminder: ${data.examTitle}
      
      Dear ${data.studentName},
      
      This is a reminder about your upcoming exam:
      
      Course: ${data.courseName}
      Date: ${data.examDate}
      Time: ${data.examTime}
      ${data.examLocation ? `Location: ${data.examLocation}` : ""}
      ${data.examDuration ? `Duration: ${data.examDuration}` : ""}
      
      Please make sure to arrive on time and bring all necessary materials.
      Good luck with your exam!
      
      This is an automated message from the University Management System.
    `;

    return { subject, html, text };
  }

  /**
   * Generate email template for assignment notifications
   */
  generateAssignmentNotificationTemplate(
    data: AssignmentNotificationData,
  ): EmailTemplate {
    const subject = `Assignment Due: ${data.assignmentTitle} - ${data.courseName}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Assignment Due</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .assignment-details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📝 Assignment Due</h1>
          </div>
          <div class="content">
            <p>Dear ${data.studentName},</p>
            <p>This is a reminder about your assignment deadline:</p>
            
            <div class="assignment-details">
              <h3>${data.assignmentTitle}</h3>
              <p><strong>Course:</strong> ${data.courseName}</p>
              <p><strong>Due Date:</strong> ${data.dueDate}</p>
              <p><strong>Due Time:</strong> ${data.dueTime}</p>
              ${data.assignmentDescription ? `<p><strong>Description:</strong> ${data.assignmentDescription}</p>` : ""}
            </div>
            
            <p>Please make sure to submit your assignment before the deadline.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from the University Management System.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Assignment Due: ${data.assignmentTitle}
      
      Dear ${data.studentName},
      
      This is a reminder about your assignment deadline:
      
      Course: ${data.courseName}
      Due Date: ${data.dueDate}
      Due Time: ${data.dueTime}
      ${data.assignmentDescription ? `Description: ${data.assignmentDescription}` : ""}
      
      Please make sure to submit your assignment before the deadline.
      
      This is an automated message from the University Management System.
    `;

    return { subject, html, text };
  }

  /**
   * Generate email template for attendance notifications
   */
  generateAttendanceNotificationTemplate(
    data: AttendanceNotificationData,
  ): EmailTemplate {
    const subject = `Attendance Update: ${data.courseName}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Attendance Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .attendance-details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Attendance Update</h1>
          </div>
          <div class="content">
            <p>Dear ${data.studentName},</p>
            <p>Your attendance has been updated:</p>
            
            <div class="attendance-details">
              <h3>${data.courseName}</h3>
              <p><strong>Date:</strong> ${data.attendanceDate}</p>
              <p><strong>Status:</strong> ${data.attendanceStatus}</p>
              ${data.attendancePercentage ? `<p><strong>Overall Attendance:</strong> ${data.attendancePercentage}%</p>` : ""}
            </div>
            
            <p>Keep up the good work!</p>
          </div>
          <div class="footer">
            <p>This is an automated message from the University Management System.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Attendance Update: ${data.courseName}
      
      Dear ${data.studentName},
      
      Your attendance has been updated:
      
      Course: ${data.courseName}
      Date: ${data.attendanceDate}
      Status: ${data.attendanceStatus}
      ${data.attendancePercentage ? `Overall Attendance: ${data.attendancePercentage}%` : ""}
      
      Keep up the good work!
      
      This is an automated message from the University Management System.
    `;

    return { subject, html, text };
  }

  /**
   * Generate email template for course notifications
   */
  generateCourseNotificationTemplate(
    data: CourseNotificationData,
  ): EmailTemplate {
    const subject = `Course Update: ${data.courseName}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Course Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #9C27B0; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .course-details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📚 Course Update</h1>
          </div>
          <div class="content">
            <p>Dear ${data.studentName},</p>
            <p>You have a new course notification:</p>
            
            <div class="course-details">
              <h3>${data.courseName} (${data.courseCode})</h3>
              <p><strong>Professor:</strong> ${data.professorName}</p>
              <p><strong>Message:</strong> ${data.notificationMessage}</p>
              ${data.actionRequired ? "<p><strong>Action Required:</strong> Yes</p>" : ""}
            </div>
            
            <p>Please check your course dashboard for more details.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from the University Management System.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Course Update: ${data.courseName}
      
      Dear ${data.studentName},
      
      You have a new course notification:
      
      Course: ${data.courseName} (${data.courseCode})
      Professor: ${data.professorName}
      Message: ${data.notificationMessage}
      ${data.actionRequired ? "Action Required: Yes" : ""}
      
      Please check your course dashboard for more details.
      
      This is an automated message from the University Management System.
    `;

    return { subject, html, text };
  }

  /**
   * Generate email template for system notifications
   */
  generateSystemNotificationTemplate(
    data: SystemNotificationData,
  ): EmailTemplate {
    const subject = `System Notification`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>System Notification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #607D8B; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .system-details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 System Notification</h1>
          </div>
          <div class="content">
            <p>Dear ${data.userName},</p>
            <p>You have a system notification:</p>
            
            <div class="system-details">
              <p><strong>Message:</strong> ${data.systemMessage}</p>
              ${data.actionRequired ? "<p><strong>Action Required:</strong> Yes</p>" : ""}
              ${data.supportContact ? `<p><strong>Support Contact:</strong> ${data.supportContact}</p>` : ""}
            </div>
            
            <p>Please take appropriate action if required.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from the University Management System.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      System Notification
      
      Dear ${data.userName},
      
      You have a system notification:
      
      Message: ${data.systemMessage}
      ${data.actionRequired ? "Action Required: Yes" : ""}
      ${data.supportContact ? `Support Contact: ${data.supportContact}` : ""}
      
      Please take appropriate action if required.
      
      This is an automated message from the University Management System.
    `;

    return { subject, html, text };
  }

  /**
   * Generate generic notification email template
   */
  generateGenericNotificationTemplate(
    title: string,
    message: string,
    userName: string,
    category: NotificationCategory,
    type: NotificationType,
  ): EmailTemplate {
    const subject = `${title}`;

    const colors: Record<string, string> = {
      INFO: "#2196F3",
      WARNING: "#FF9800",
      ERROR: "#F44336",
      SUCCESS: "#4CAF50",
      URGENT: "#E91E63",
    };

    const icons: Record<string, string> = {
      EXAM: "📚",
      ASSIGNMENT: "📝",
      ATTENDANCE: "📊",
      COURSE: "🎓",
      SYSTEM: "🔔",
      ANNOUNCEMENT: "📢",
      DEADLINE: "⏰",
      REMINDER: "🔔",
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${colors[type]}; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .notification-details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${icons[category]} ${title}</h1>
          </div>
          <div class="content">
            <p>Dear ${userName},</p>
            
            <div class="notification-details">
              <p>${message}</p>
            </div>
            
            <p>Please check your dashboard for more details.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from the University Management System.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ${title}
      
      Dear ${userName},
      
      ${message}
      
      Please check your dashboard for more details.
      
      This is an automated message from the University Management System.
    `;

    return { subject, html, text };
  }

  /**
   * Check if user has email notifications enabled
   */
  async isEmailNotificationEnabled(
    userId: number,
    category: NotificationCategory,
  ): Promise<boolean> {
    try {
      const settings = await prisma.notificationSettings.findUnique({
        where: { userId },
      });

      if (!settings) {
        return true; // Default to enabled if no settings found
      }

      if (!settings.emailNotifications) {
        return false;
      }

      // Check category-specific settings
      switch (category) {
        case NotificationCategory.EXAM:
          return settings.examNotifications;
        case NotificationCategory.ASSIGNMENT:
          return settings.assignmentNotifications;
        case NotificationCategory.ATTENDANCE:
          return settings.attendanceNotifications;
        case NotificationCategory.COURSE:
          return settings.courseNotifications;
        case NotificationCategory.SYSTEM:
          return settings.systemNotifications;
        default:
          return true;
      }
    } catch (error) {
      console.error("Error checking email notification settings:", error);
      return false;
    }
  }

  /**
   * Check if it's within quiet hours
   */
  async isWithinQuietHours(userId: number): Promise<boolean> {
    try {
      const settings = await prisma.notificationSettings.findUnique({
        where: { userId },
      });

      if (!settings || !settings.quietHoursStart || !settings.quietHoursEnd) {
        return false;
      }

      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      const [startHour, startMin] = settings.quietHoursStart
        .split(":")
        .map(Number);
      const [endHour, endMin] = settings.quietHoursEnd.split(":").map(Number);

      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;

      return currentTime >= startTime && currentTime <= endTime;
    } catch (error) {
      console.error("Error checking quiet hours:", error);
      return false;
    }
  }
}

export const getEmailService = () => new EmailService();
export default EmailService;
