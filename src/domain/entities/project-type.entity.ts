import type { TemplateField } from './template-field.type';

export class ProjectTypeEntity {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly name: string,
    public readonly templateFields: TemplateField[] = [],
    public readonly active: boolean = true,
  ) {}
}
