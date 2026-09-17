import { ArgumentsHost, BadRequestException } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  const createHost = (response: { status: jest.Mock; json: jest.Mock }) =>
    ({
      switchToHttp: () => ({
        getResponse: () => response,
      }),
    }) as unknown as ArgumentsHost;

  it('handles HttpException and sends its message with status', () => {
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    filter.catch(
      new BadRequestException({ message: ['campo inválido'] }),
      createHost(response),
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 400,
      message: 'campo inválido',
    });
  });

  it('handles unknown errors as 500', () => {
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    filter.catch(new Error('boom'), createHost(response));

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Error interno del servidor',
    });
  });
});
