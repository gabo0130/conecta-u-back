import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { NeedRepository } from '../../domain/repositories/need.repository.interface';
import { buildNeed, createMock } from '../../testing/test-doubles.testing';
import { CreateNeedUseCase } from './create-need.use-case';
import { DiscardNeedUseCase } from './discard-need.use-case';
import { GetNeedUseCase } from './get-need.use-case';
import { ListNeedsUseCase } from './list-needs.use-case';
import { UpdateNeedUseCase } from './update-need.use-case';

describe('needs (tesis D1)', () => {
  const needRepository = createMock<NeedRepository>();
  const leader = { userId: 'leader-1', role: 'LIDER' as const };
  const admin = { userId: 'admin-1', role: 'ADMIN' as const };

  beforeEach(() => jest.clearAllMocks());

  describe('CreateNeedUseCase', () => {
    it('registra la necesidad a nombre del formulador, sin caracterizar', async () => {
      needRepository.create.mockResolvedValue(buildNeed());
      const result = await new CreateNeedUseCase(needRepository).execute(
        'leader-1',
        {
          title: 'Plataforma de citas',
          description: 'Texto largo de la necesidad institucional de prueba.',
          kind: 'ADMINISTRATIVA',
          urgency: 4,
          impact: 5,
        },
      );
      expect(needRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createdById: 'leader-1',
          deadline: null,
          dependency: null,
        }),
      );
      expect(result).toMatchObject({
        id: 'need-1',
        status: 'REGISTRADA',
        characterization: null,
      });
    });
  });

  describe('ListNeedsUseCase', () => {
    const query = { page: 1, pageSize: 20, sort: 'recent' as const };

    it('el LIDER solo ve las suyas', async () => {
      needRepository.findPage.mockResolvedValue({
        items: [buildNeed()],
        total: 1,
      });
      const result = await new ListNeedsUseCase(needRepository).execute(
        leader,
        query,
      );
      expect(needRepository.findPage).toHaveBeenCalledWith(
        expect.objectContaining({ createdById: 'leader-1' }),
        { page: 1, pageSize: 20 },
      );
      expect(result.needs[0]).not.toHaveProperty('description');
      expect(result.meta).toEqual({
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it('el ADMIN ve todas, con filtros', async () => {
      needRepository.findPage.mockResolvedValue({ items: [], total: 0 });
      await new ListNeedsUseCase(needRepository).execute(admin, {
        ...query,
        status: 'REGISTRADA',
        kind: 'BIENESTAR',
      });
      expect(needRepository.findPage).toHaveBeenCalledWith(
        {
          createdById: undefined,
          status: 'REGISTRADA',
          kind: 'BIENESTAR',
          sort: 'recent',
        },
        { page: 1, pageSize: 20 },
      );
    });
  });

  describe('GetNeedUseCase', () => {
    const get = new GetNeedUseCase(needRepository);

    it('el formulador y el ADMIN ven el detalle', async () => {
      needRepository.findById.mockResolvedValue(buildNeed());
      await expect(get.execute(leader, 'need-1')).resolves.toMatchObject({
        description: expect.any(String),
      });
      await expect(get.execute(admin, 'need-1')).resolves.toBeDefined();
    });

    it('otro líder recibe 403 y una inexistente 404', async () => {
      needRepository.findById.mockResolvedValue(buildNeed());
      await expect(
        get.execute({ userId: 'other', role: 'LIDER' }, 'need-1'),
      ).rejects.toThrow(ForbiddenException);
      needRepository.findById.mockResolvedValue(null);
      await expect(get.execute(leader, 'x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('UpdateNeedUseCase', () => {
    const update = new UpdateNeedUseCase(needRepository);

    it('aplica solo los campos enviados', async () => {
      needRepository.findById.mockResolvedValue(buildNeed());
      needRepository.update.mockResolvedValue(buildNeed({ urgency: 2 }));
      const result = await update.execute('leader-1', 'need-1', {
        urgency: 2,
        title: undefined,
        dependency: null,
      });
      expect(needRepository.update).toHaveBeenCalledWith('need-1', {
        urgency: 2,
        dependency: null,
      });
      expect(result.urgency).toBe(2);
    });

    it('una necesidad convertida o descartada no se edita (409)', async () => {
      needRepository.findById.mockResolvedValue(
        buildNeed({ status: 'CONVERTIDA' }),
      );
      await expect(
        update.execute('leader-1', 'need-1', { urgency: 2 }),
      ).rejects.toThrow(ConflictException);
    });

    it('solo el formulador la edita (403, ni siquiera el ADMIN)', async () => {
      needRepository.findById.mockResolvedValue(buildNeed());
      await expect(
        update.execute('admin-1', 'need-1', { urgency: 2 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('DiscardNeedUseCase', () => {
    it('la marca DESCARTADA con su motivo', async () => {
      needRepository.findById.mockResolvedValue(buildNeed());
      needRepository.update.mockResolvedValue(
        buildNeed({ status: 'DESCARTADA', discardReason: 'Duplicada' }),
      );
      const result = await new DiscardNeedUseCase(needRepository).execute(
        'leader-1',
        'need-1',
        { reason: 'Duplicada' },
      );
      expect(needRepository.update).toHaveBeenCalledWith('need-1', {
        status: 'DESCARTADA',
        discardReason: 'Duplicada',
      });
      expect(result.status).toBe('DESCARTADA');
    });

    it('404 si desaparece entre la lectura y la escritura', async () => {
      needRepository.findById.mockResolvedValue(buildNeed());
      needRepository.update.mockResolvedValue(null);
      await expect(
        new DiscardNeedUseCase(needRepository).execute(
          'leader-1',
          'need-1',
          {},
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
