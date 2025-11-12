import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Interface para resultado de upload
 */
export interface UploadResult {
  url: string;
  key: string;
  bucket: string;
}

/**
 * Storage Service - Serviço de armazenamento de arquivos
 * Integração com Cloudflare R2 (compatível com S3 API)
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly accountId: string;
  private readonly publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    this.bucket = this.configService.get<string>('R2_BUCKET_NAME') || 'cubes-movies';
    this.publicUrl = this.configService.get<string>('R2_PUBLIC_URL');

    // Configurar S3Client para Cloudflare R2
    this.s3Client = new S3Client({
      region: 'auto', // R2 usa 'auto' como região
      endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.configService.get<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('R2_SECRET_ACCESS_KEY'),
      },
    });

    this.logger.log(`Storage Service initialized with R2 bucket: ${this.bucket}`);
  }

  /**
   * Faz upload de uma imagem e retorna a URL
   *
   * @param file - Buffer do arquivo
   * @param key - Chave/caminho do arquivo no bucket
   * @param contentType - Tipo MIME do arquivo
   */
  async uploadImage(
    file: Buffer,
    key: string,
    contentType: string = 'image/jpeg',
  ): Promise<UploadResult> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: contentType,
      });

      await this.s3Client.send(command);

      this.logger.log(`Upload successful: ${key} to R2 bucket ${this.bucket}`);

      // URL pública (se bucket tiver domínio público configurado)
      const url = this.publicUrl
        ? `${this.publicUrl}/${key}`
        : `https://${this.accountId}.r2.cloudflarestorage.com/${this.bucket}/${key}`;

      return {
        url,
        key,
        bucket: this.bucket,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${key}`, error.stack);
      throw new Error('Falha ao fazer upload do arquivo');
    }
  }

  /**
   * Deleta uma imagem do storage
   *
   * @param key - Chave/caminho do arquivo no bucket
   */
  async deleteImage(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);

      this.logger.log(`Delete successful: ${key} from R2 bucket ${this.bucket}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${key}`, error.stack);
      throw new Error('Falha ao deletar arquivo');
    }
  }

  /**
   * Gera uma URL assinada temporária para acesso ao arquivo
   *
   * @param key - Chave/caminho do arquivo no bucket
   * @param expiresIn - Tempo de expiração em segundos (padrão: 1 hora)
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });

      this.logger.log(`Signed URL generated for: ${key} (expires in ${expiresIn}s)`);

      return url;
    } catch (error) {
      this.logger.error(`Failed to generate signed URL: ${key}`, error.stack);
      throw new Error('Falha ao gerar URL assinada');
    }
  }
}
