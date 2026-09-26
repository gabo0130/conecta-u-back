import type { AvailabilityStatus } from './availability-status.type';
import { CollaboratorSkillEntity } from './collaborator-skill.entity';
import type { CollaboratorSource } from './collaborator-source.type';
import { ExperienceEntity } from './experience.entity';
import type { PersonType } from './person-type.type';

export interface CollaboratorProps {
  id: string;
  email: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  personType: PersonType;
  programId: string;
  semester?: number | null;
  researchGroup?: string | null;
  summary?: string | null;
  profileUrl?: string | null;
  availabilityStatus?: AvailabilityStatus;
  weeklyHours?: number;
  dataConsent?: boolean;
  dataConsentAt?: Date | null;
  source?: CollaboratorSource;
  active?: boolean;
  skills?: CollaboratorSkillEntity[];
  experiences?: ExperienceEntity[];
}

export class CollaboratorEntity {
  readonly id: string;
  readonly email: string;
  readonly userId: string | null;
  readonly firstName: string;
  readonly lastName: string;
  readonly personType: PersonType;
  readonly programId: string;
  readonly semester: number | null;
  readonly researchGroup: string | null;
  readonly summary: string | null;
  readonly profileUrl: string | null;
  readonly availabilityStatus: AvailabilityStatus;
  readonly weeklyHours: number;
  readonly dataConsent: boolean;
  readonly dataConsentAt: Date | null;
  readonly source: CollaboratorSource;
  readonly active: boolean;
  readonly skills: CollaboratorSkillEntity[];
  readonly experiences: ExperienceEntity[];

  constructor(props: CollaboratorProps) {
    this.id = props.id;
    this.email = props.email;
    this.userId = props.userId;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.personType = props.personType;
    this.programId = props.programId;
    this.semester = props.semester ?? null;
    this.researchGroup = props.researchGroup ?? null;
    this.summary = props.summary ?? null;
    this.profileUrl = props.profileUrl ?? null;
    this.availabilityStatus = props.availabilityStatus ?? 'DISPONIBLE';
    this.weeklyHours = props.weeklyHours ?? 0;
    this.dataConsent = props.dataConsent ?? false;
    this.dataConsentAt = props.dataConsentAt ?? null;
    this.source = props.source ?? 'REGISTRO';
    this.active = props.active ?? true;
    this.skills = props.skills ?? [];
    this.experiences = props.experiences ?? [];
  }
}
