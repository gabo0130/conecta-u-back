import { DeliverableEntity } from './deliverable.entity';
import type { ProjectStatus } from './project-status.type';
import { SkillEntity } from './skill.entity';

export class ProjectEntity {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly summary: string,
    public readonly objectives: string,
    public readonly typeId: string,
    public readonly categoryId: string,
    public readonly programId: string | null,
    public readonly typeData: Record<string, unknown>,
    public readonly knownSkills: SkillEntity[],
    public readonly deliverables: DeliverableEntity[],
    public readonly leaderId: string,
    public readonly status: ProjectStatus,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}
