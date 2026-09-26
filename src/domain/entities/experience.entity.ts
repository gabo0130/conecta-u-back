import type { ExperienceType } from './experience-type.type';
import type { Level } from './level.type';
import { SkillEntity } from './skill.entity';

export interface ExperienceProps {
  id: string;
  collaboratorId: string;
  type: ExperienceType;
  role: string;
  organization: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  weeklyHours: number;
  level: Level;
  description?: string | null;
  technologies?: SkillEntity[];
}

export class ExperienceEntity {
  readonly id: string;
  readonly collaboratorId: string;
  readonly type: ExperienceType;
  readonly role: string;
  readonly organization: string;
  readonly startDate: string;
  readonly endDate: string | null;
  readonly current: boolean;
  readonly weeklyHours: number;
  readonly level: Level;
  readonly description: string | null;
  readonly technologies: SkillEntity[];

  constructor(props: ExperienceProps) {
    this.id = props.id;
    this.collaboratorId = props.collaboratorId;
    this.type = props.type;
    this.role = props.role;
    this.organization = props.organization;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.current = props.current;
    this.weeklyHours = props.weeklyHours;
    this.level = props.level;
    this.description = props.description ?? null;
    this.technologies = props.technologies ?? [];
  }
}
