import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { type Request } from 'express';
import { AuthService } from '@services/auth.service';
import { SignupDto } from '@dtos/signup.dto';
import { SigninDto } from '@dtos/signin.dto';
import { GoogleSigninDto } from '@dtos/google-signin.dto';
import { Public } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { PrivateFields } from '@decorators/private.decorator';
import { type AuthenticatedUser } from '@app-types/auth.types';

@Controller('auth')
@PrivateFields(['password'])
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  async signup(@Body() dto: SignupDto, @Req() req: Request) {
    const { ip, userAgent } = this.extractRequestMeta(req);
    const result = await this.authService.signup(dto, ip, userAgent);
    return {
      message: 'Account created successfully',
      data: result,
    };
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

  @Get('session')
  async session(@CurrentUser('id') userId: string) {
    const user = await this.authService.getSession(userId);
    return {
      message: 'Session retrieved',
      data: user,
    };
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
