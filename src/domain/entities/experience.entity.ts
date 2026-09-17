export class ExperienceEntity {
  constructor(
    public readonly id: string,
    public readonly collaboratorId: string,
    public readonly title: string,
    public readonly organization: string | null = null,
    public readonly period: string | null = null,
    public readonly description: string | null = null,
  ) {}
}
