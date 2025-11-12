import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';

/**
 * Storage Module - Módulo de armazenamento de arquivos
 * Fornece serviço abstrato para upload de imagens (S3, Cloudflare R2, etc)
 */
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
