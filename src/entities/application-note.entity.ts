import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { SignupApplicationEntity } from './signup-application.entity';
import { SmarttrackOperatorEntity } from './smarttrack-operator.entity';

@Entity('application_notes')
export class ApplicationNoteEntity extends BaseEntity {
  @Column('uuid')
  application_id: string;

  @Column('uuid')
  operator_id: string;

  @Column('text')
  note_text: string;

  @ManyToOne(() => SignupApplicationEntity)
  @JoinColumn({ name: 'application_id' })
  application: SignupApplicationEntity;

  @ManyToOne(() => SmarttrackOperatorEntity)
  @JoinColumn({ name: 'operator_id' })
  operator: SmarttrackOperatorEntity;
}
