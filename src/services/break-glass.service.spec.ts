import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BreakGlassService } from './break-glass.service';

describe('BreakGlassService', () => {
  let service: BreakGlassService;
  let sessionDal: { get: jest.Mock; find: jest.Mock; create: jest.Mock; update: jest.Mock };
  let auditLogService: { logPlatformAction: jest.Mock };

  const mockSession = {
    id: 'session-uuid',
    operator_id: 'engineer-uuid',
    org_id: 'org-uuid',
    ticket_id: 'TICK-123',
    reason: 'Urgent data fix',
    data_scope: 'READ_ONLY',
    approved_by: null,
    approved_at: null,
    start_at: new Date(),
    end_at: null,
    actions_summary: null,
  };

  beforeEach(() => {
    sessionDal = {
      get: jest.fn().mockResolvedValue(mockSession),
      find: jest.fn().mockResolvedValue({ payload: [mockSession], paginationMeta: { total: 1 } }),
      create: jest.fn().mockResolvedValue(mockSession),
      update: jest.fn().mockResolvedValue(mockSession),
    };
    auditLogService = { logPlatformAction: jest.fn().mockResolvedValue(undefined) };

    service = new BreakGlassService(sessionDal as never, auditLogService as never);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('request', () => {
    it('should create a break-glass session', async () => {
      const dto = {
        org_id: 'org-uuid',
        ticket_id: 'TICK-123',
        reason: 'Urgent data fix',
        data_scope: 'READ_ONLY',
      };

      const result = await service.request(dto, 'engineer-uuid', '127.0.0.1', 'jest');

      expect(result.ticket_id).toBe('TICK-123');
      expect(auditLogService.logPlatformAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'BREAK_GLASS_REQUESTED' }),
      );
    });
  });

  describe('approve', () => {
    it('should approve a break-glass session', async () => {
      await service.approve('session-uuid', 'admin-uuid', '127.0.0.1', 'jest');

      expect(sessionDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            approved_by: 'admin-uuid',
          }) as unknown,
        }),
      );
      expect(auditLogService.logPlatformAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'BREAK_GLASS_APPROVED' }),
      );
    });

    it('should throw BadRequestException when self-approving', async () => {
      await expect(
        service.approve('session-uuid', 'engineer-uuid', '127.0.0.1', 'jest'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when already approved', async () => {
      sessionDal.get.mockResolvedValue({ ...mockSession, approved_by: 'other-uuid' });

      await expect(
        service.approve('session-uuid', 'admin-uuid', '127.0.0.1', 'jest'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when session not found', async () => {
      sessionDal.get.mockResolvedValue(null);

      await expect(
        service.approve('bad-id', 'admin-uuid', '127.0.0.1', 'jest'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('end', () => {
    it('should end a break-glass session', async () => {
      await service.end('session-uuid', 'engineer-uuid', 'Fixed data', '127.0.0.1', 'jest');

      expect(sessionDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            end_at: expect.any(Date) as unknown,
            actions_summary: 'Fixed data',
          }) as unknown,
        }),
      );
      expect(auditLogService.logPlatformAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'BREAK_GLASS_ENDED' }),
      );
    });
  });

  describe('list', () => {
    it('should return paginated sessions', async () => {
      const result = await service.list();
      expect(result.payload).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should return a session when found', async () => {
      const result = await service.findById('session-uuid');
      expect(result.ticket_id).toBe('TICK-123');
    });

    it('should throw NotFoundException when not found', async () => {
      sessionDal.get.mockResolvedValue(null);
      await expect(service.findById('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getActiveByOrg', () => {
    it('should return active sessions for an org', async () => {
      const result = await service.getActiveByOrg('org-uuid');

      expect(sessionDal.find).toHaveBeenCalledWith(
        expect.objectContaining({
          findOptions: expect.objectContaining({
            org_id: 'org-uuid',
            end_at: null,
          }) as unknown,
        }),
      );
      expect(result.payload).toHaveLength(1);
    });
  });
});
