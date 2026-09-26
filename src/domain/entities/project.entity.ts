import { DeliverableEntity } from './deliverable.entity';
import type { ProjectStatus } from './project-status.type';
import { SkillEntity } from './skill.entity';

export interface ProjectProps {
  id: string;
  title: string;
  summary: string;
  objectives: string;
  typeId: string;
  categoryId: string;
  programId: string | null;
  typeData: Record<string, unknown>;
  knownSkills: SkillEntity[];
  deliverables: DeliverableEntity[];
  leaderId: string;
  status: ProjectStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ProjectEntity {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly objectives: string;
  readonly typeId: string;
  readonly categoryId: string;
  readonly programId: string | null;
  readonly typeData: Record<string, unknown>;
  readonly knownSkills: SkillEntity[];
  readonly deliverables: DeliverableEntity[];
  readonly leaderId: string;
  readonly status: ProjectStatus;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;

  constructor(props: ProjectProps) {
    this.id = props.id;
    this.title = props.title;
    this.summary = props.summary;
    this.objectives = props.objectives;
    this.typeId = props.typeId;
    this.categoryId = props.categoryId;
    this.programId = props.programId;
    this.typeData = props.typeData;
    this.knownSkills = props.knownSkills;
    this.deliverables = props.deliverables;
    this.leaderId = props.leaderId;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
