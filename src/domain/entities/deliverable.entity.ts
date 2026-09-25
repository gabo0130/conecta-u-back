export class DeliverableEntity {
  constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly name: string,
    public readonly scope: string,
  ) {}
}
