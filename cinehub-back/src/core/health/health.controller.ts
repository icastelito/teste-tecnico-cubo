import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { Public } from '@/common/decorators';

/**
 * Health Controller - Rotas de verificação de saúde
 * Todas as rotas são públicas para monitoramento
 */
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  async check() {
    return this.healthService.checkHealth();
  }

  @Public()
  @Get('database')
  async checkDatabase() {
    return this.healthService.checkDatabase();
  }
}
