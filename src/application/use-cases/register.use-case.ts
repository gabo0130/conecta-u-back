import { ConflictException, Inject, Injectable } from '@nestjs/common';
import type { PasswordHasher } from '../../domain/repositories/password-hasher.interface';
import type { UnitOfWork } from '../../domain/repositories/unit-of-work.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import {
  PASSWORD_HASHER,
  UNIT_OF_WORK,
  USER_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { RegisterDto } from '../dto/register.dto';
import { toUserResponse } from '../mappers/user-response.mapper';
import { PersonAccountService } from '../support/person-account.service';
import { SendWelcomeEmailUseCase } from './send-welcome-email.use-case';

/** RF1: registro público de LIDER o COLABORADOR, siempre vinculado a una persona identificada. */
@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(UNIT_OF_WORK) private readonly unitOfWork: UnitOfWork,
    private readonly personAccount: PersonAccountService,
    private readonly sendWelcomeEmail: SendWelcomeEmailUseCase,
  ) {}

  async execute(data: RegisterDto) {
    const email = data.email.trim().toLowerCase();

    if (await this.userRepository.findByEmail(email)) {
      throw new ConflictException({ message: 'Correo ya registrado' });
    }

    // Se decide antes de escribir: vincular a una persona existente (p. ej. importada) o crearla.
    const pending = await this.personAccount.prepare(email, data.collaborator);
    const passwordHash = await this.passwordHasher.hash(data.password);

    // Usuario y persona se escriben juntos: si falla la persona no queda una cuenta huérfana.
    const user = await this.unitOfWork.run(async (repositories) => {
      const created = await repositories.users.create({
        fullName: data.fullName,
        email,
        passwordHash,
        role: data.role,
      });
      await this.personAccount.link(repositories, created.id, pending);
      return created;
    });

    // Sin await: el correo no debe retrasar la respuesta ni hacerla fallar (el caso de uso no lanza).
    void this.sendWelcomeEmail.execute({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    });

    return toUserResponse(user);
  }
}
