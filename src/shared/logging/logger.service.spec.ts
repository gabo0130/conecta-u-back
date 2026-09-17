import { AppLoggerService } from './logger.service';
import { RequestContext } from './request-context';

function parseLastLogLine(spy: jest.SpyInstance): Record<string, unknown> {
  const lastCall = spy.mock.calls[spy.mock.calls.length - 1];
  return JSON.parse(lastCall[0] as string) as Record<string, unknown>;
}

describe('AppLoggerService', () => {
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let logger: AppLoggerService;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    logger = new AppLoggerService();
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  describe('forContext()', () => {
    it('writes info logs with context, method and meta', () => {
      const contextLogger = logger.forContext('LoginUseCase');

      contextLogger.info('Login exitoso', { method: 'execute', userId: '1' });

      const entry = parseLastLogLine(logSpy);
      expect(entry).toMatchObject({
        level: 'info',
        context: 'LoginUseCase',
        method: 'execute',
        message: 'Login exitoso',
        meta: { userId: '1' },
      });
      expect(entry.timestamp).toEqual(expect.any(String));
    });

    it('writes error logs to console.error with the stack trace', () => {
      const contextLogger = logger.forContext('LoginUseCase');
      const error = new Error('Credenciales inválidas');

      contextLogger.error('Login falló', error, { method: 'execute' });

      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).not.toHaveBeenCalled();

      const entry = parseLastLogLine(errorSpy);
      expect(entry).toMatchObject({
        level: 'error',
        context: 'LoginUseCase',
        method: 'execute',
        message: 'Login falló',
      });
      expect(entry.stack).toContain('Credenciales inválidas');
    });

    it('includes the active traceId from RequestContext', () => {
      const contextLogger = logger.forContext('LoginUseCase');

      RequestContext.run({ traceId: 'trace-abc' }, () => {
        contextLogger.info('dentro de una request');
      });

      const entry = parseLastLogLine(logSpy);
      expect(entry.traceId).toBe('trace-abc');
    });

    it('falls back to a placeholder traceId outside of RequestContext', () => {
      const contextLogger = logger.forContext('LoginUseCase');

      contextLogger.info('fuera de una request');

      const entry = parseLastLogLine(logSpy);
      expect(entry.traceId).toBe('no-trace-id');
    });

    it('omits meta entirely when there is nothing beyond method', () => {
      const contextLogger = logger.forContext('LoginUseCase');

      contextLogger.info('sin meta extra', { method: 'execute' });

      const entry = parseLastLogLine(logSpy);
      expect(entry.meta).toBeUndefined();
    });

    it('warn(), debug() and verbose() all write with their own level', () => {
      const contextLogger = logger.forContext('LoginUseCase');

      contextLogger.warn('warn msg');
      contextLogger.debug('debug msg');
      contextLogger.verbose('verbose msg');

      expect(logSpy).toHaveBeenCalledTimes(3);
      const levels = logSpy.mock.calls.map(
        (call) => JSON.parse(call[0] as string).level,
      );
      expect(levels).toEqual(['warn', 'debug', 'verbose']);
    });
  });

  describe('Nest LoggerService interface', () => {
    it('log() writes an info entry using the trailing string as context', () => {
      logger.log('Nest application successfully started', 'NestApplication');

      const entry = parseLastLogLine(logSpy);
      expect(entry).toMatchObject({
        level: 'info',
        context: 'NestApplication',
        message: 'Nest application successfully started',
      });
    });

    it('error() reads (message, trace, context) like Nest calls it', () => {
      logger.error(
        'Unhandled exception',
        'stack trace here',
        'ExceptionsHandler',
      );

      const entry = parseLastLogLine(errorSpy);
      expect(entry).toMatchObject({
        level: 'error',
        context: 'ExceptionsHandler',
        message: 'Unhandled exception',
        stack: 'stack trace here',
      });
    });

    it('warn()/debug()/verbose() all route to console.log with their level', () => {
      logger.warn('warn msg', 'Ctx');
      logger.debug('debug msg', 'Ctx');
      logger.verbose('verbose msg', 'Ctx');

      expect(logSpy).toHaveBeenCalledTimes(3);
      const levels = logSpy.mock.calls.map(
        (call) => JSON.parse(call[0] as string).level,
      );
      expect(levels).toEqual(['warn', 'debug', 'verbose']);
    });

    it('log() stringifies a non-string message', () => {
      logger.log({ some: 'object' });

      const entry = parseLastLogLine(logSpy);
      expect(entry.message).toBe('{"some":"object"}');
    });

    it('log() falls back to String() when the message cannot be JSON-stringified', () => {
      const circular: Record<string, unknown> = {};
      circular.self = circular;

      logger.log(circular);

      const entry = parseLastLogLine(logSpy);
      expect(entry.message).toBe('[object Object]');
    });

    it('error() with only a message and no trace/context still logs', () => {
      logger.error('bare error message');

      const entry = parseLastLogLine(errorSpy);
      expect(entry).toMatchObject({
        level: 'error',
        message: 'bare error message',
      });
      expect(entry.context).toBeUndefined();
      expect(entry.stack).toBeUndefined();
    });

    it('error() with a single non-string param ignores it as trace', () => {
      logger.error('error message', { notAString: true });

      const entry = parseLastLogLine(errorSpy);
      expect(entry.stack).toBeUndefined();
    });
  });

  describe('setLogLevels()', () => {
    it('suppresses levels that are not enabled', () => {
      logger.setLogLevels(['error']);

      logger.forContext('Ctx').info('should be suppressed');
      logger.forContext('Ctx').error('should still log', new Error('x'));

      expect(logSpy).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });
  });
});
