import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { IsInterestList } from './interests.decorator';

class Holder {
  @IsInterestList()
  interests?: string[];
}

const check = (interests: unknown) => {
  const holder = plainToInstance(Holder, { interests });
  return { holder, errors: validateSync(holder) };
};

describe('IsInterestList', () => {
  it('normaliza antes de validar', () => {
    const { holder, errors } = check([' Robótica ', 'robotica', 'IoT']);
    expect(errors).toEqual([]);
    expect(holder.interests).toEqual(['Robótica', 'IoT']);
  });

  it('es opcional; [] borra los intereses', () => {
    expect(check(undefined).errors).toEqual([]);
    expect(check([]).errors).toEqual([]);
  });

  it.each([
    [null, 'interests debe ser una lista de textos'],
    ['IA', 'interests debe ser una lista de textos'],
    [[1, 2], 'interests debe ser una lista de textos'],
    [
      Array.from({ length: 11 }, (_, i) => `Tema ${i}`),
      'Puedes registrar hasta 10 intereses',
    ],
  ])('rechaza %j', (value, message) => {
    const [error] = check(value).errors;
    expect(Object.values(error.constraints ?? {})).toEqual([message]);
  });
});
