import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateMyCollaboratorProfileUseCase } from './create-my-collaborator-profile.use-case';
import { CollaboratorEntity } from '../../domain/entities/collaborator.entity';
import { UserEntity } from '../../domain/entities/user.entity';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';

describe('CreateMyCollaboratorProfileUseCase', () => {
  const userRepository: jest.Mocked<Pick<UserRepository, 'findById'>> = {
    findById: jest.fn(),
  };

  const collaboratorRepository: jest.Mocked<
    Pick<
      CollaboratorRepository,
      'findByUserId' | 'findByEmail' | 'create' | 'update'
    >
  > = {
    findByUserId: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const useCase = new CreateMyCollaboratorProfileUseCase(
    userRepository,
    collaboratorRepository,
  );

  const dto = {
    firstName: 'Laura',
    lastName: 'Méndez',
    personType: 'DOCENTE' as const,
    programId: 'prog-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a new collaborator profile for a LIDER without one', async () => {
    userRepository.findById.mockResolvedValue(
      new UserEntity('u1', 'Laura', 'laura@example.com', 'hashed', 'LIDER'),
    );
    collaboratorRepository.findByUserId.mockResolvedValue(null);
    collaboratorRepository.findByEmail.mockResolvedValue(null);

    await useCase.execute('u1', dto);

    expect(collaboratorRepository.create).toHaveBeenCalledWith({
      email: 'laura@example.com',
      userId: 'u1',
      firstName: 'Laura',
      lastName: 'Méndez',
      personType: 'DOCENTE',
      programId: 'prog-1',
      semester: undefined,
      researchGroup: undefined,
      summary: undefined,
      profileUrl: undefined,
      dataConsent: false,
      source: 'REGISTRO',
    });
  });

  it('links to an existing unlinked collaborator with the same email', async () => {
    userRepository.findById.mockResolvedValue(
      new UserEntity('u1', 'Laura', 'laura@example.com', 'hashed', 'LIDER'),
    );
    collaboratorRepository.findByUserId.mockResolvedValue(null);
    collaboratorRepository.findByEmail.mockResolvedValue(
      new CollaboratorEntity(
        'c1',
        'laura@example.com',
        null,
        'Laura',
        'Méndez',
        'DOCENTE',
        'prog-1',
      ),
    );

    await useCase.execute('u1', dto);

    expect(collaboratorRepository.create).not.toHaveBeenCalled();
    expect(collaboratorRepository.update).toHaveBeenCalledWith('c1', {
      userId: 'u1',
    });
  });

  it('throws ConflictException when the user already has a profile', async () => {
    userRepository.findById.mockResolvedValue(
      new UserEntity('u1', 'Laura', 'laura@example.com', 'hashed', 'LIDER'),
    );
    collaboratorRepository.findByUserId.mockResolvedValue(
      new CollaboratorEntity(
        'c1',
        'laura@example.com',
        'u1',
        'Laura',
        'Méndez',
        'DOCENTE',
        'prog-1',
      ),
    );

    await expect(useCase.execute('u1', dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('throws ConflictException when the email is already linked to another account', async () => {
    userRepository.findById.mockResolvedValue(
      new UserEntity('u1', 'Laura', 'laura@example.com', 'hashed', 'LIDER'),
    );
    collaboratorRepository.findByUserId.mockResolvedValue(null);
    collaboratorRepository.findByEmail.mockResolvedValue(
      new CollaboratorEntity(
        'c1',
        'laura@example.com',
        'other-user',
        'Laura',
        'Méndez',
        'DOCENTE',
        'prog-1',
      ),
    );

    await expect(useCase.execute('u1', dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('throws NotFoundException when the user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('u1', dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
