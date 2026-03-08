/**
 * Development seed data for SmartTrack Health.
 *
 * Usage:
 *   pnpm ts-node -r tsconfig-paths/register src/database/seeds/dev.seed.ts
 *
 * This script:
 *   1. Connects to the database using the TypeORM data source.
 *   2. Creates a sample organization.
 *   3. Creates an AGENCY_OWNER user (no password — use auth endpoints to set one).
 *   4. Creates a sample program and site.
 *   5. Creates a sample individual (PHI encrypted inline via EncryptionService).
 *
 * IMPORTANT: Run this against a local development database only.
 * Never run against production or staging.
 */

import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { AppDataSource } from '../data-source';
import { OrganizationEntity } from '@entities/organization.entity';
import { UserEntity } from '@entities/user.entity';
import { ProgramEntity } from '@entities/program.entity';
import { SiteEntity } from '@entities/site.entity';
import { IndividualEntity } from '@entities/individual.entity';
import { OrgStatus } from '@enums/org-status.enum';
import { AgencyRole } from '@enums/role.enum';
import { UserStatus } from '@enums/user-status.enum';
import { MfaType } from '@enums/mfa-type.enum';
import { createCipheriv, randomBytes } from 'crypto';

// ---------------------------------------------------------------------------
// Inline encryption helper (mirrors EncryptionService without DI)
// ---------------------------------------------------------------------------
function encryptField(plaintext: string, hexKey: string): string {
  const key = Buffer.from(hexKey, 'hex');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv, {
    authTagLength: 16,
  });
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------
async function seed() {
  const encryptionKey = process.env.ENCRYPTION_KEY ?? '';
  if (!encryptionKey || encryptionKey.length !== 64) {
    throw new Error(
      'ENCRYPTION_KEY must be configured in your .env file as a 64-character hex string (32 bytes). ' +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }

  await AppDataSource.initialize();
  console.log('✅ Database connected');

  const orgRepo = AppDataSource.getRepository(OrganizationEntity);
  const userRepo = AppDataSource.getRepository(UserEntity);
  const programRepo = AppDataSource.getRepository(ProgramEntity);
  const siteRepo = AppDataSource.getRepository(SiteEntity);
  const individualRepo = AppDataSource.getRepository(IndividualEntity);

  // ------------------------------------------------------------------
  // Organization
  // ------------------------------------------------------------------
  let org = await orgRepo.findOne({ where: { npi: '1234567890' } });
  if (!org) {
    org = orgRepo.create({
      legal_name: 'Sunrise Care Services LLC',
      dba: 'Sunrise Care',
      npi: '1234567890',
      ein: '12-3456789',
      status: OrgStatus.ACTIVE,
      address_line1: '100 Main Street',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      phone: '512-555-0100',
    });
    org = await orgRepo.save(org);
    console.log(`✅ Organization created: ${org.id}`);
  } else {
    console.log(`⏭  Organization already exists: ${org.id}`);
  }

  // ------------------------------------------------------------------
  // Agency Owner User
  // ------------------------------------------------------------------
  let owner = await userRepo.findOne({
    where: { email: 'owner@sunrisecare.dev' },
  });
  if (!owner) {
    owner = userRepo.create({
      org_id: org.id,
      email: 'owner@sunrisecare.dev',
      name: 'Alice Owner',
      password: null,
      role: AgencyRole.AGENCY_OWNER,
      status: UserStatus.ACTIVE,
      email_verified: true,
      mfa_enabled: false,
      mfa_type: MfaType.NONE,
      sub_permissions: {},
      session_timeout: 30,
    });
    owner = await userRepo.save(owner);
    console.log(`✅ Agency owner created: ${owner.id}`);
  } else {
    console.log(`⏭  Owner user already exists: ${owner.id}`);
  }

  // Supervisor
  let supervisor = await userRepo.findOne({
    where: { email: 'supervisor@sunrisecare.dev' },
  });
  if (!supervisor) {
    supervisor = userRepo.create({
      org_id: org.id,
      email: 'supervisor@sunrisecare.dev',
      name: 'Bob Supervisor',
      password: null,
      role: AgencyRole.SUPERVISOR,
      status: UserStatus.ACTIVE,
      email_verified: true,
      mfa_enabled: false,
      mfa_type: MfaType.NONE,
      sub_permissions: {},
      session_timeout: 30,
    });
    supervisor = await userRepo.save(supervisor);
    console.log(`✅ Supervisor created: ${supervisor.id}`);
  } else {
    console.log(`⏭  Supervisor already exists: ${supervisor.id}`);
  }

  // DSP
  let dsp = await userRepo.findOne({
    where: { email: 'dsp@sunrisecare.dev' },
  });
  if (!dsp) {
    dsp = userRepo.create({
      org_id: org.id,
      email: 'dsp@sunrisecare.dev',
      name: 'Carol DSP',
      password: null,
      role: AgencyRole.DSP,
      status: UserStatus.ACTIVE,
      email_verified: true,
      mfa_enabled: false,
      mfa_type: MfaType.NONE,
      sub_permissions: {},
      session_timeout: 60,
      supervisor_id: supervisor.id,
    });
    dsp = await userRepo.save(dsp);
    console.log(`✅ DSP created: ${dsp.id}`);
  } else {
    console.log(`⏭  DSP already exists: ${dsp.id}`);
  }

  // ------------------------------------------------------------------
  // Program
  // ------------------------------------------------------------------
  let program = await programRepo.findOne({
    where: { org_id: org.id, name: 'Residential Support Services' },
  });
  if (!program) {
    program = programRepo.create({
      org_id: org.id,
      name: 'Residential Support Services',
      type: 'RESIDENTIAL',
      description: '24-hour residential support for individuals with IDD.',
      active: true,
    });
    program = await programRepo.save(program);
    console.log(`✅ Program created: ${program.id}`);
  } else {
    console.log(`⏭  Program already exists: ${program.id}`);
  }

  // ------------------------------------------------------------------
  // Site
  // ------------------------------------------------------------------
  let site = await siteRepo.findOne({
    where: { org_id: org.id, name: 'Sunrise House — Main' },
  });
  if (!site) {
    site = siteRepo.create({
      org_id: org.id,
      program_id: program.id,
      name: 'Sunrise House — Main',
      address_line1: '200 Oak Street',
      city: 'Austin',
      state: 'TX',
      zip: '78702',
      latitude: 30.2672,
      longitude: -97.7431,
      active: true,
    });
    site = await siteRepo.save(site);
    console.log(`✅ Site created: ${site.id}`);
  } else {
    console.log(`⏭  Site already exists: ${site.id}`);
  }

  // ------------------------------------------------------------------
  // Individual (PHI encrypted)
  // ------------------------------------------------------------------
  let individual = await individualRepo.findOne({
    where: { org_id: org.id, first_name: 'Dev', last_name: 'Individual' },
  });
  if (!individual) {
    individual = individualRepo.create({
      org_id: org.id,
      first_name: 'Dev',
      last_name: 'Individual',
      ssn: encryptField('999-00-0001', encryptionKey),
      date_of_birth: encryptField('1985-06-15', encryptionKey),
      medicaid_id: encryptField('MA00000001', encryptionKey),
      diagnosis_codes: encryptField('F70', encryptionKey),
      address: encryptField('300 Pine Ave, Austin TX 78703', encryptionKey),
      phone: encryptField('512-555-9999', encryptionKey),
      emergency_contact: encryptField(
        'Guardian Name — 512-555-8888',
        encryptionKey,
      ),
      guardian_id: null,
      active: true,
    });
    individual = await individualRepo.save(individual);
    console.log(`✅ Individual created: ${individual.id}`);
  } else {
    console.log(`⏭  Individual already exists: ${individual.id}`);
  }

  // ------------------------------------------------------------------
  // Done
  // ------------------------------------------------------------------
  console.log('\n🌱 Seed complete. Summary:');
  console.log(`   Organization : ${org.id}`);
  console.log(`   Owner        : ${owner.id}`);
  console.log(`   Supervisor   : ${supervisor.id}`);
  console.log(`   DSP          : ${dsp.id}`);
  console.log(`   Program      : ${program.id}`);
  console.log(`   Site         : ${site.id}`);
  console.log(`   Individual   : ${individual.id}`);

  await AppDataSource.destroy();
}

seed().catch((err: unknown) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
