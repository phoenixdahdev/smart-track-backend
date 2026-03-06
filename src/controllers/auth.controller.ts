import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { type Request } from 'express';
import { AuthService } from '@services/auth.service';
import { SignupDto } from '@dtos/signup.dto';
import { SigninDto } from '@dtos/signin.dto';
import { GoogleSigninDto } from '@dtos/google-signin.dto';
import { VerifyEmailDto } from '@dtos/verify-email.dto';
import { ForgotPasswordDto } from '@dtos/forgot-password.dto';
import { ResetPasswordDto } from '@dtos/reset-password.dto';
import { Public } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { PrivateFields } from '@decorators/private.decorator';
import { type AuthenticatedUser } from '@app-types/auth.types';

@Controller('auth')
@PrivateFields(['password', 'otp_code', 'reset_token'])
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  async signup(@Body() dto: SignupDto, @Req() req: Request) {
    const { ip, userAgent } = this.extractRequestMeta(req);
    const result = await this.authService.signup(dto, ip, userAgent);
    return {
      message: 'Account created successfully. Please verify your email.',
      data: result,
    };
  }

  @Public()
  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    const result = await this.authService.verifyEmail(dto.email, dto.otp);
    return result;
  }

  @Public()
  @Post('resend-otp')
  async resendOtp(@Body() dto: ForgotPasswordDto) {
    const result = await this.authService.resendOtp(dto.email);
    return result;
  }

  @Public()
  @Post('signin')
  async signin(@Body() dto: SigninDto, @Req() req: Request) {
    const { ip, userAgent } = this.extractRequestMeta(req);
    const result = await this.authService.signin(dto, ip, userAgent);
    return {
      message: 'Signed in successfully',
      data: result,
    };
  }

  @Public()
  @Post('signin/google')
  async googleSignin(@Body() dto: GoogleSigninDto, @Req() req: Request) {
    const { ip, userAgent } = this.extractRequestMeta(req);
    const result = await this.authService.googleSignin(dto, ip, userAgent);
    return {
      message: 'Signed in with Google successfully',
      data: result,
    };
  }

  @Get('me')
  async me(@CurrentUser('id') userId: string) {
    const user = await this.authService.getMe(userId);
    return {
      message: 'User retrieved',
      data: user,
    };
  }

  @Get('session')
  async session(@CurrentUser('id') userId: string) {
    const user = await this.authService.getMe(userId);
    return {
      message: 'Session retrieved',
      data: user,
    };
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(dto.email);
    return result;
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const result = await this.authService.resetPassword(
      dto.token,
      dto.newPassword,
    );
    return result;
  }

  @Post('signout')
  async signout(@CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    const { ip, userAgent } = this.extractRequestMeta(req);
    await this.authService.signout(
      user.id,
      user.org_id,
      user.role,
      ip,
      userAgent,
    );
    return { message: 'Signed out successfully' };
  }

  @Public()
  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    const tokens = await this.authService.refreshToken(refreshToken);
    return {
      message: 'Tokens refreshed',
      data: tokens,
    };
  }

  private extractRequestMeta(req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '';
    const userAgent = req.headers['user-agent'] || '';
    return { ip, userAgent };
  }
}
