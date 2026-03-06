import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(configService.get<string>('RESEND_API_KEY', ''));
    this.fromEmail = configService.get<string>(
      'FROM_EMAIL',
      'noreply@smarttrack.health',
    );
  }

  async sendOtp(to: string, name: string, otp: string): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: 'SmartTrack - Verify your email',
        html: `
          <h2>Welcome to SmartTrack Health, ${this.escapeHtml(name)}!</h2>
          <p>Your verification code is:</p>
          <h1 style="letter-spacing: 8px; font-size: 36px; text-align: center; padding: 16px; background: #f4f4f4; border-radius: 8px;">${otp}</h1>
          <p>This code expires in 10 minutes.</p>
          <p>If you did not create an account, please ignore this email.</p>
        `,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send OTP email to ${to}: ${message}`);
    }
  }

  async sendPasswordReset(
    to: string,
    name: string,
    resetToken: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3001',
    );
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: 'SmartTrack - Reset your password',
        html: `
          <h2>Password Reset Request</h2>
          <p>Hi ${this.escapeHtml(name)},</p>
          <p>We received a request to reset your password. Click the link below:</p>
          <p><a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
          <p>Or copy this token: <code>${resetToken}</code></p>
          <p>This link expires in 1 hour.</p>
          <p>If you did not request this, please ignore this email.</p>
        `,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to send password reset email to ${to}: ${message}`,
      );
    }
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
