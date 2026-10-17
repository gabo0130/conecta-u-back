import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { RebuildEmbeddingsDto } from '../../application/dto/rebuild-embeddings.dto';
import { RebuildEmbeddingsUseCase } from '../../application/use-cases/rebuild-embeddings.use-case';
import { Authorize } from '../guards/authorization.decorator';
import { AuthorizationGuard } from '../guards/authorization.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard, AuthorizationGuard)
@Authorize({ anyOfRoles: ['ADMIN'] })
@Controller('admin/embeddings')
export class AdminEmbeddingsController {
  constructor(private readonly rebuildUseCase: RebuildEmbeddingsUseCase) {}

  /** Recalcula los embeddings de las personas que faltan o quedaron desactualizados. */
  @Post('rebuild')
  @HttpCode(200)
  rebuild(@Body() dto: RebuildEmbeddingsDto) {
    return this.rebuildUseCase.execute(dto);
  }
}
