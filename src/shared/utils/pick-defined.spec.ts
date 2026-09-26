import { pickDefined } from './pick-defined';

describe('pickDefined', () => {
  it('drops undefined values and keeps null, false, 0 and empty strings', () => {
    expect(
      pickDefined({
        title: 'Nuevo',
        summary: undefined,
        programId: null,
        active: false,
        weeklyHours: 0,
        description: '',
      }),
    ).toEqual({
      title: 'Nuevo',
      programId: null,
      active: false,
      weeklyHours: 0,
      description: '',
    });
  });

  it('returns an empty object when nothing was sent', () => {
    expect(pickDefined({ title: undefined })).toEqual({});
  });
});
