import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MoviesService } from './movies.service';
import { CreateMovieDto, UpdateMovieDto, FilterMoviesDto } from './dto';
import { CurrentUser } from '@/common/decorators';

/**
 * Movies Controller - Rotas de filmes
 * Todas as rotas requerem autenticação (JwtAuthGuard global)
 */
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  /**
   * POST /movies
   * Cria um novo filme para o usuário autenticado
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: any, @Body() createMovieDto: CreateMovieDto) {
    return this.moviesService.create(user.id, createMovieDto);
  }

  /**
   * GET /movies
   * Lista TODOS os filmes cadastrados (de todos os usuários) com filtros
   */
  @Get()
  findAll(@CurrentUser() user: any, @Query() filters: FilterMoviesDto) {
    // user.id mantido para possível uso futuro, mas a listagem mostra todos os filmes
    return this.moviesService.findAll(user.id, filters);
  }

  /**
   * GET /movies/:id
   * Busca um filme específico do usuário autenticado
   */
  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.moviesService.findOne(id, user.id);
  }

  /**
   * PATCH /movies/:id
   * Atualiza um filme do usuário autenticado
   */
  @Patch(':id')
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateMovieDto: UpdateMovieDto,
  ) {
    return this.moviesService.update(id, user.id, updateMovieDto);
  }

  /**
   * DELETE /movies/:id
   * Remove um filme do usuário autenticado
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.moviesService.remove(id, user.id);
  }

  /**
   * POST /movies/:id/poster
   * Upload de poster (imagem de capa) do filme
   */
  @Post(':id/poster')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  uploadPoster(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo de imagem é obrigatório');
    }

    // Validar tipo de arquivo manualmente
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de arquivo não suportado. Tipos aceitos: JPEG, JPG, PNG, WEBP`,
      );
    }

    return this.moviesService.uploadPoster(id, user.id, file);
  }

  /**
   * POST /movies/:id/backdrop
   * Upload de backdrop (imagem de fundo) do filme
   */
  @Post(':id/backdrop')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  uploadBackdrop(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo de imagem é obrigatório');
    }

    // Validar tipo de arquivo manualmente
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de arquivo não suportado. Tipos aceitos: JPEG, JPG, PNG, WEBP`,
      );
    }

    return this.moviesService.uploadBackdrop(id, user.id, file);
  }
}
