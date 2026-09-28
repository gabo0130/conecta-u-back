import { ConflictException, NotFoundException } from '@nestjs/common';
import { DeleteUserUseCase } from './delete-user.use-case';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import { createMock } from '../../testing/test-doubles.testing';

describe('DeleteUserUseCase', () => {
  const userRepository = createMock<UserRepository>();
  const projectRepository = createMock<ProjectRepository>();
  const useCase = new DeleteUserUseCase(userRepository, projectRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    projectRepository.countByLeaderId.mockResolvedValue(0);
    userRepository.delete.mockResolvedValue(true);
  });

  it('deletes a user without projects', async () => {
    await expect(useCase.execute('admin', 'user-8')).resolves.toBeUndefined();
    expect(userRepository.delete).toHaveBeenCalledWith('user-8');
  });

  it('refuses to delete a leader with projects', async () => {
    projectRepository.countByLeaderId.mockResolvedValue(2);

    await expect(useCase.execute('admin', 'leader-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(userRepository.delete).not.toHaveBeenCalled();
  });

  it('refuses to let an admin delete their own account', async () => {
    await expect(useCase.execute('admin', 'admin')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('returns 404 when the user does not exist', async () => {
    userRepository.delete.mockResolvedValue(false);

    await expect(useCase.execute('admin', 'ghost')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
