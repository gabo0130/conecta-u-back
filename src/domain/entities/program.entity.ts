export class ProgramEntity {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly name: string,
    public readonly faculty: string | null = null,
    public readonly active: boolean = true,
  ) {}
}
