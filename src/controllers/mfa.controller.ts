import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { type Request } from 'express';
import { MfaService } from '@services/mfa.service';
import { MfaVerifyDto } from '@dtos/mfa-verify.dto';
import { MfaVerifyBackupDto } from '@dtos/mfa-verify-backup.dto';
import { MfaTotpConfirmDto } from '@dtos/mfa-totp-confirm.dto';
import { MfaDisableDto } from '@dtos/mfa-disable.dto';
import { MfaRegenerateBackupDto } from '@dtos/mfa-regenerate-backup.dto';
import { CurrentUser } from '@decorators/current-user.decorator';
import { MfaPending } from '@decorators/mfa-pending.decorator';
import { PrivateFields } from '@decorators/private.decorator';
import { type AuthenticatedUser } from '@app-types/auth.types';

@Controller('auth/mfa')
@PrivateFields([
  'password',
  'mfa_secret',
  'mfa_otp_code',
  'mfa_backup_codes',
])
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @Get('status')
  async getStatus(@CurrentUser('id') userId: string) {
    const status = await this.mfaService.getMfaStatus(userId);
    return {
      message: 'MFA status retrieved',
      data: status,
    };
  }

  @Post('totp/setup')
  async setupTotp(@CurrentUser('id') userId: string) {
    const result = await this.mfaService.setupTotp(userId);
    return {
      message:
        'TOTP setup initiated. Scan the QR code and confirm with a code.',
      data: result,
    };
  }

  @Post('totp/confirm')
  async confirmTotp(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MfaTotpConfirmDto,
    @Req() req: Request,
  ) {
    const { ip, userAgent } = this.extractRequestMeta(req);
    const result = await this.mfaService.confirmTotpSetup(
      user.id,
      dto.code,
      ip,
      userAgent,
    );
    return {
      message:
        'TOTP MFA enabled successfully. Save your backup codes securely.',
      data: result,
    };
  }

  @Post('email-otp/setup')
  async setupEmailOtp(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const { ip, userAgent } = this.extractRequestMeta(req);
    const result = await this.mfaService.setupEmailOtp(
      user.id,
      ip,
      userAgent,
    );
    return {
      message:
        'Email OTP MFA enabled successfully. Save your backup codes securely.',
      data: result,
    };
  }

  @MfaPending()
  @Post('verify')
  async verify(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MfaVerifyDto,
    @Req() req: Request,
  ) {
    const { ip, userAgent } = this.extractRequestMeta(req);
    const tokens = await this.mfaService.verifyMfa(
      user.id,
      dto.code,
      ip,
      userAgent,
    );
    return {
      message: 'MFA verified successfully',
      data: tokens,
    };
  }

  @MfaPending()
  @Post('verify/backup')
  async verifyBackup(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MfaVerifyBackupDto,
    @Req() req: Request,
  ) {
    const { ip, userAgent } = this.extractRequestMeta(req);
    const tokens = await this.mfaService.verifyBackupCode(
      user.id,
      dto.code,
      ip,
      userAgent,
    );
    return {
      message: 'Backup code verified successfully',
      data: tokens,
    };
  }

  @MfaPending()
  @Post('resend')
  async resendMfaOtp(@CurrentUser('id') userId: string) {
    await this.mfaService.sendMfaEmailOtp(userId);
    return {
      message: 'MFA verification code resent',
    };
  }

  @Post('disable')
  async disable(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MfaDisableDto,
    @Req() req: Request,
  ) {
    const { ip, userAgent } = this.extractRequestMeta(req);
    const result = await this.mfaService.disableMfa(
      user.id,
      dto.password,
      ip,
      userAgent,
    );
    return result;
  }

  @Post('backup-codes/regenerate')
  async regenerateBackupCodes(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MfaRegenerateBackupDto,
    @Req() req: Request,
  ) {
    const { ip, userAgent } = this.extractRequestMeta(req);
    const result = await this.mfaService.regenerateBackupCodes(
      user.id,
      dto.password,
      ip,
      userAgent,
    );
    return {
      message: 'Backup codes regenerated. Save them securely.',
      data: result,
    };
  }

  private extractRequestMeta(req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '';
    const userAgent = req.headers['user-agent'] || '';
    return { ip, userAgent };
  }
}
