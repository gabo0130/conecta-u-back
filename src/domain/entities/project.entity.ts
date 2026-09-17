import type { ProjectStatus } from './project-status.type';

export class ProjectEntity {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly summary: string,
    public readonly objectives: string,
    public readonly knownSkills: string[] | null,
    public readonly semillero: string | null,
    public readonly program: string | null,
    public readonly leaderId: string,
    public readonly status: ProjectStatus,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}
