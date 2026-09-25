import type { AvailabilityStatus } from './availability-status.type';
import { CollaboratorSkillEntity } from './collaborator-skill.entity';
import type { CollaboratorSource } from './collaborator-source.type';
import { ExperienceEntity } from './experience.entity';
import type { PersonType } from './person-type.type';

export class CollaboratorEntity {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly userId: string | null,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly personType: PersonType,
    public readonly programId: string,
    public readonly semester: number | null = null,
    public readonly researchGroup: string | null = null,
    public readonly summary: string | null = null,
    public readonly profileUrl: string | null = null,
    public readonly availabilityStatus: AvailabilityStatus = 'DISPONIBLE',
    public readonly weeklyHours: number = 0,
    public readonly dataConsent: boolean = false,
    public readonly dataConsentAt: Date | null = null,
    public readonly source: CollaboratorSource = 'REGISTRO',
    public readonly active: boolean = true,
    public readonly skills: CollaboratorSkillEntity[] = [],
    public readonly experiences: ExperienceEntity[] = [],
  ) {}
}
