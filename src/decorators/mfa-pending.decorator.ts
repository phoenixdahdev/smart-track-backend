import { SetMetadata } from '@nestjs/common';

export const MFA_PENDING_KEY = 'mfaPending';
export const MfaPending = () => SetMetadata(MFA_PENDING_KEY, true);
