import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import {
  PROJECT_REPOSITORY,
  USER_REPOSITORY,
} from '../../shared/interfaces/tokens';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
  ) {}

  async execute(actorId: string, userId: string): Promise<void> {
    if (actorId === userId) {
      throw new ConflictException({
        message: 'No puedes eliminar tu propia cuenta',
      });
    }

    // Borrar a un líder arrastraría sus proyectos: se exige reasignarlos o desactivar la cuenta.
    if ((await this.projectRepository.countByLeaderId(userId)) > 0) {
      throw new ConflictException({
        message:
          'El usuario lidera proyectos; desactívalo en lugar de eliminarlo',
      });
    }

    if (!(await this.userRepository.delete(userId))) {
      throw new NotFoundException({ message: 'Recurso no encontrado' });
    }
  }
}
