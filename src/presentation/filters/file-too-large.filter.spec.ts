import { ArgumentsHost, PayloadTooLargeException } from '@nestjs/common';
import { FileTooLargeFilter } from './file-too-large.filter';

describe('FileTooLargeFilter', () => {
  it('answers the Multer size limit with a Spanish 413', () => {
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const host = {
      switchToHttp: () => ({ getResponse: () => response }),
    } as unknown as ArgumentsHost;

    new FileTooLargeFilter().catch(
      new PayloadTooLargeException('File too large'),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(413);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 413,
      message: 'El archivo supera el tamaño máximo permitido (5 MB)',
    });
  });
});
