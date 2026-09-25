export class ProjectCategoryEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly active: boolean = true,
  ) {}
}
