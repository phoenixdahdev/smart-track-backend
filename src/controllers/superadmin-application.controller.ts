import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { type Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SignupApplicationService } from '@services/signup-application.service';
import { TenantProvisioningService } from '@services/tenant-provisioning.service';
import { SubmitApplicationDto } from '@dtos/submit-application.dto';
import { ApplicationQueryDto } from '@dtos/application-query.dto';
import { TransitionApplicationDto } from '@dtos/transition-application.dto';
import { AddApplicationNoteDto } from '@dtos/add-application-note.dto';
import { VerifyDocumentDto } from '@dtos/verify-document.dto';
import { Roles, Public } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { PlatformRole } from '@enums/role.enum';
import { type AuthenticatedUser } from '@app-types/auth.types';

@ApiTags('SuperAdmin — Applications')
@ApiBearerAuth()
@Roles(PlatformRole.PLATFORM_OWNER, PlatformRole.PLATFORM_ADMIN)
@Controller('superadmin/applications')
export class SuperadminApplicationController {
  constructor(
    private readonly applicationService: SignupApplicationService,
    private readonly provisioningService: TenantProvisioningService,
  ) {}

  @ApiOperation({ summary: 'Submit a signup application (public)' })
  @Public()
  @Post('public/signup')
  async submit(@Body() dto: SubmitApplicationDto) {
    const application = await this.applicationService.submit(dto);
    return { message: 'Application submitted', data: application };
  }

  @ApiOperation({ summary: 'List applications' })
  @Get()
  async list(@Query() query: ApplicationQueryDto) {
    const result = await this.applicationService.list(query, {
      status: query.status,
      plan_tier: query.plan_tier,
      date_from: query.date_from,
      date_to: query.date_to,
      reviewed_by: query.reviewed_by,
    });
    return { message: 'Applications retrieved', data: result.payload, meta: result.paginationMeta };
  }

  @ApiOperation({ summary: 'Get application summary counts' })
  @Get('summary')
  async summary() {
    const counts = await this.applicationService.getSummaryCounts();
    return { message: 'Summary counts retrieved', data: counts };
  }

  @ApiOperation({ summary: 'Get application by ID' })
  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const application = await this.applicationService.findById(id);
    return { message: 'Application retrieved', data: application };
  }

  @ApiOperation({ summary: 'Transition application status' })
  @Post(':id/transition')
  async transition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionApplicationDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const ua = req.headers['user-agent'] ?? '';

    const application = await this.applicationService.transition(
      id, dto.status, currentUser.id, dto.reason, ip, ua,
    );
    return { message: 'Application status updated', data: application };
  }

  @ApiOperation({ summary: 'Assign reviewer to application' })
  @Post(':id/assign')
  async assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reviewer_id', ParseUUIDPipe) reviewerId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const ua = req.headers['user-agent'] ?? '';

    const application = await this.applicationService.assign(
      id, reviewerId, currentUser.id, ip, ua,
    );
    return { message: 'Reviewer assigned', data: application };
  }

  @ApiOperation({ summary: 'Add note to application' })
  @Post(':id/notes')
  async addNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddApplicationNoteDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const ua = req.headers['user-agent'] ?? '';

    const note = await this.applicationService.addNote(
      id, currentUser.id, dto.note_text, ip, ua,
    );
    return { message: 'Note added', data: note };
  }

  @ApiOperation({ summary: 'Get notes for application' })
  @Get(':id/notes')
  async getNotes(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.applicationService.getNotes(id);
    return { message: 'Notes retrieved', data: result.payload };
  }

  @ApiOperation({ summary: 'Get documents for application' })
  @Get(':id/documents')
  async getDocuments(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.applicationService.getDocuments(id);
    return { message: 'Documents retrieved', data: result.payload };
  }

  @ApiOperation({ summary: 'Verify application document' })
  @Patch(':id/documents/:docId/verify')
  async verifyDocument(
    @Param('docId', ParseUUIDPipe) docId: string,
    @Body() dto: VerifyDocumentDto,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const ua = req.headers['user-agent'] ?? '';

    const doc = await this.applicationService.verifyDocument(
      docId, dto.verified, currentUser.id, dto.notes, ip, ua,
    );
    return { message: 'Document verification updated', data: doc };
  }

  @ApiOperation({ summary: 'Provision tenant from approved application' })
  @Post(':id/provision')
  async provision(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const ip = (req.ip ?? req.socket?.remoteAddress) || '';
    const ua = req.headers['user-agent'] ?? '';

    const manifest = await this.provisioningService.provision(
      id, currentUser.id, ip, ua,
    );
    return { message: 'Tenant provisioned', data: manifest };
  }
}
