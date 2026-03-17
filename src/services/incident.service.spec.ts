import { BadRequestException, NotFoundException } from '@nestjs/common';
import { IncidentService } from './incident.service';
import { IncidentStatus } from '@enums/incident-status.enum';

const mockEncrypt = jest.fn((v: string) => `ENC(${v})`);
const mockDecrypt = jest.fn((v: string) => v.replace(/^ENC\((.+)\)$/, '$1'));

describe('IncidentService', () => {
  let service: IncidentService;
  let incidentDal: {
    find: jest.Mock;
    get: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let encryptionService: { encrypt: jest.Mock; decrypt: jest.Mock };
  let auditLogService: { logAgencyAction: jest.Mock };
  let notificationTriggerService: { onIncidentReportedForGuardian: jest.Mock };

  const mockIncident = {
    id: 'inc-uuid',
    org_id: 'org-uuid',
    individual_id: 'ind-uuid',
    reported_by: 'staff-uuid',
    type: 'BEHAVIORAL',
    description: 'ENC(Incident description)',
    immediate_action: null,
    supervisor_comments: null,
    status: IncidentStatus.DRAFT,
    occurred_at: new Date(),
  };

  beforeEach(() => {
    incidentDal = {
      find: jest.fn().mockResolvedValue({
        payload: [mockIncident],
        paginationMeta: { total: 1 },
      }),
      get: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(mockIncident),
      update: jest.fn().mockResolvedValue(mockIncident),
    };
    encryptionService = { encrypt: mockEncrypt, decrypt: mockDecrypt };
    auditLogService = {
      logAgencyAction: jest.fn().mockResolvedValue(undefined),
    };
    notificationTriggerService = {
      onIncidentReportedForGuardian: jest.fn().mockResolvedValue(undefined),
    };

    service = new IncidentService(
      incidentDal as never,
      encryptionService as never,
      auditLogService as never,
      notificationTriggerService as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should encrypt PHI fields and create incident', async () => {
      const dto = {
        individual_id: 'ind-uuid',
        type: 'BEHAVIORAL',
        description: 'Incident description',
        occurred_at: '2026-03-10T14:30:00.000Z',
      };

      await service.create(dto, 'org-uuid', 'staff-uuid', 'DSP', '127.0.0.1', 'jest');

      expect(mockEncrypt).toHaveBeenCalledWith('Incident description');
      expect(incidentDal.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should allow update on DRAFT incident', async () => {
      incidentDal.get.mockResolvedValue(mockIncident);

      await service.update(
        'inc-uuid',
        'org-uuid',
        { description: 'Updated' },
        'staff-uuid',
        'DSP',
        '127.0.0.1',
        'jest',
      );

      expect(incidentDal.update).toHaveBeenCalled();
    });

    it('should throw when updating a SUBMITTED incident', async () => {
      incidentDal.get.mockResolvedValue({
        ...mockIncident,
        status: IncidentStatus.SUBMITTED,
      });

      await expect(
        service.update(
          'inc-uuid',
          'org-uuid',
          { description: 'Updated' },
          'staff-uuid',
          'DSP',
          '127.0.0.1',
          'jest',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('submit', () => {
    it('should transition DRAFT to SUBMITTED', async () => {
      incidentDal.get.mockResolvedValue(mockIncident);

      await service.submit('inc-uuid', 'org-uuid', 'staff-uuid', 'DSP', '127.0.0.1', 'jest');

      expect(incidentDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            status: IncidentStatus.SUBMITTED,
          }) as unknown,
        }),
      );
    });

    it('should throw for invalid transition', async () => {
      incidentDal.get.mockResolvedValue({
        ...mockIncident,
        status: IncidentStatus.CLOSED,
      });

      await expect(
        service.submit('inc-uuid', 'org-uuid', 'staff-uuid', 'DSP', '127.0.0.1', 'jest'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('startReview', () => {
    it('should transition SUBMITTED to UNDER_REVIEW', async () => {
      incidentDal.get.mockResolvedValue({
        ...mockIncident,
        status: IncidentStatus.SUBMITTED,
      });

      await service.startReview(
        'inc-uuid',
        'org-uuid',
        'supervisor-uuid',
        'SUPERVISOR',
        '127.0.0.1',
        'jest',
      );

      expect(incidentDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            status: IncidentStatus.UNDER_REVIEW,
          }) as unknown,
        }),
      );
    });
  });

  describe('close', () => {
    it('should transition UNDER_REVIEW to CLOSED with comments', async () => {
      incidentDal.get.mockResolvedValue({
        ...mockIncident,
        status: IncidentStatus.UNDER_REVIEW,
      });

      await service.close(
        'inc-uuid',
        'org-uuid',
        'All resolved',
        'supervisor-uuid',
        'SUPERVISOR',
        '127.0.0.1',
        'jest',
      );

      expect(mockEncrypt).toHaveBeenCalledWith('All resolved');
      expect(incidentDal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            status: IncidentStatus.CLOSED,
          }) as unknown,
        }),
      );
    });
  });

  describe('findById', () => {
    it('should throw NotFoundException when not found', async () => {
      await expect(
        service.findById('bad-id', 'org-uuid', 'staff-uuid', 'DSP', '127.0.0.1', 'jest'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should decrypt and log PHI access', async () => {
      incidentDal.get.mockResolvedValue(mockIncident);

      await service.findById('inc-uuid', 'org-uuid', 'staff-uuid', 'DSP', '127.0.0.1', 'jest');

      expect(mockDecrypt).toHaveBeenCalled();
      expect(auditLogService.logAgencyAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'INCIDENT_ACCESSED' }),
      );
    });
  });
});
