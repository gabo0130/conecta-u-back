import { BadRequestException } from '@nestjs/common';
import { UuidParamPipe } from './uuid-param.pipe';

describe('UuidParamPipe', () => {
  const metadata = { type: 'param' as const, data: 'id' };

  it('lets a valid uuid through', async () => {
    const id = '3f1c2a8e-1b2c-4d5e-8f90-123456789abc';
    await expect(UuidParamPipe.transform(id, metadata)).resolves.toBe(id);
  });

  it('rejects a malformed id with a 400 in Spanish', async () => {
    await expect(UuidParamPipe.transform('abc', metadata)).rejects.toThrow(
      new BadRequestException({ message: 'Identificador inválido' }),
    );
  });
});
