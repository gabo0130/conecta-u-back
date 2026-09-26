import { BadRequestException, ParseUUIDPipe } from '@nestjs/common';

/** `@Param('id', UuidParamPipe)`: rechaza ids mal formados con 400 antes de llegar a Postgres. */
export const UuidParamPipe = new ParseUUIDPipe({
  exceptionFactory: () =>
    new BadRequestException({ message: 'Identificador inválido' }),
});
