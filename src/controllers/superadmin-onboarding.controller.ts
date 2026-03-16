import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import { type Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OnboardingService } from '@services/onboarding.service';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { PlatformRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('SuperAdmin — Onboarding')
@ApiBearerAuth()
@Roles(
  PlatformRole.PLATFORM_OWNER,
  PlatformRole.PLATFORM_ADMIN,
  PlatformRole.ONBOARDING_SPECIALIST,
)
@Controller('superadmin/onboarding')
export class SuperadminOnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @ApiOperation({ summary: 'Get onboarding checklist for org' })
  @Get(':orgId')
  async getChecklist(@Param('orgId', ParseUUIDPipe) orgId: string) {
    const checklist = await this.onboardingService.getChecklist(orgId);
    return { message: 'Checklist retrieved', data: checklist };
  }

  @ApiOperation({ summary: 'Assign onboarding specialist' })
  @Post(':orgId/assign')
  async assignSpecialist(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body('specialist_id', ParseUUIDPipe) specialistId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const ua = req.headers['user-agent'] ?? '';

    // First get the checklist by orgId to get its ID
    const checklist = await this.onboardingService.getChecklist(orgId);
    const result = await this.onboardingService.assignSpecialist(
      checklist.id, specialistId, currentUser.id, ip, ua,
    );
    return { message: 'Specialist assigned', data: result };
  }

  @ApiOperation({ summary: 'Complete onboarding task' })
  @Post('tasks/:taskId/complete')
  async completeTask(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() body: { notes?: string },
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const ua = req.headers['user-agent'] ?? '';

    const task = await this.onboardingService.completeTask(
      taskId, currentUser.id, body.notes, ip, ua,
    );
    return { message: 'Task completed', data: task };
  }

  @ApiOperation({ summary: 'Skip onboarding task' })
  @Post('tasks/:taskId/skip')
  async skipTask(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() body: { notes?: string },
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const ua = req.headers['user-agent'] ?? '';

    const task = await this.onboardingService.skipTask(
      taskId, currentUser.id, body.notes, ip, ua,
    );
    return { message: 'Task skipped', data: task };
  }

  @ApiOperation({ summary: 'Complete onboarding checklist' })
  @Post(':checklistId/complete')
  async completeChecklist(
    @Param('checklistId', ParseUUIDPipe) checklistId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const ua = req.headers['user-agent'] ?? '';

    const checklist = await this.onboardingService.completeChecklist(
      checklistId, currentUser.id, ip, ua,
    );
    return { message: 'Checklist completed', data: checklist };
  }
}
