import type { Level } from './level.type';
import type { Priority } from './priority.type';
import type { RequiredProfileSource } from './required-profile-source.type';
import type { SkillType } from './skill-type.type';

/** Habilidad que pide un perfil. `skillId` es null si la IA propuso algo fuera del catálogo. */
export class RequiredProfileSkillEntity {
  constructor(
    public readonly id: string,
    public readonly requiredProfileId: string,
    public readonly skillId: string | null,
    public readonly rawName: string,
    public readonly type: SkillType,
    public readonly minLevel: Level,
    public readonly importance: Priority,
    /** Nombre canónico en el catálogo (null si la habilidad no está catalogada). */
    public readonly skillName: string | null = null,
  ) {}
}

export interface RequiredProfileProps {
  id: string;
  projectId: string;
  /** null si el perfil es manual. */
  analysisId: string | null;
  source: RequiredProfileSource;
  name: string;
  description: string;
  /** RF14: por qué el proyecto necesita este perfil. */
  justification: string;
  quantity: number;
  priority: Priority;
  minWeeklyHours: number | null;
  position: number;
  active: boolean;
  skills: RequiredProfileSkillEntity[];
  createdAt: Date;
  updatedAt: Date;
}

/** Perfil que el proyecto necesita (RF13), con sus habilidades. */
export class RequiredProfileEntity implements RequiredProfileProps {
  readonly id: string;
  readonly projectId: string;
  readonly analysisId: string | null;
  readonly source: RequiredProfileSource;
  readonly name: string;
  readonly description: string;
  readonly justification: string;
  readonly quantity: number;
  readonly priority: Priority;
  readonly minWeeklyHours: number | null;
  readonly position: number;
  readonly active: boolean;
  readonly skills: RequiredProfileSkillEntity[];
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: RequiredProfileProps) {
    Object.assign(this, props);
  }
}
