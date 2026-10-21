import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import {
  COLLABORATOR_REPOSITORY,
  USER_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { CreateMyCollaboratorDto } from '../dto/create-my-collaborator.dto';
import { toCollaboratorProfileResponse } from '../mappers/collaborator-response.mapper';
import { PersonAccountService } from '../support/person-account.service';

/**
 * RF3: una cuenta sin persona (anterior a v2.1) crea su perfil. Si un administrador ya la
 * importó (mismo documento o correo), se vincula en lugar de duplicarla.
 */
@Injectable()
export class CreateMyCollaboratorProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
    private readonly personAccount: PersonAccountService,
  ) {}

  async execute(userId: string, data: CreateMyCollaboratorDto) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException({ message: 'Usuario no encontrado' });
    }

    if (await this.collaboratorRepository.findByUserId(userId)) {
      throw new ConflictException({
        message: 'Ya tienes un perfil de colaborador',
      });
    }

    const pending = await this.personAccount.prepare(user.email, {
      // Sin `dataConsent` no se toca el de una persona importada; una nueva queda sin autorizar.
      ...data,
      profile: {
        semester: data.semester,
        researchGroup: data.researchGroup,
        summary: data.summary,
        profileUrl: data.profileUrl,
      },
    });
    const collaborator = await this.personAccount.link(
      { collaborators: this.collaboratorRepository },
      userId,
      pending,
    );

    return toCollaboratorProfileResponse(collaborator);
  }
}
