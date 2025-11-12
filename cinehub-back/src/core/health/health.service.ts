import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async checkHealth() {
    const startTime = Date.now();

    // Check database
    const dbStatus = await this.checkDatabase();

    // Check memory
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
    };

    // Check uptime
    const uptime = process.uptime();
    const uptimeFormatted = this.formatUptime(uptime);

    const responseTime = Date.now() - startTime;

    return {
      status: dbStatus.connected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: uptimeFormatted,
      uptimeSeconds: Math.round(uptime),
      responseTime: `${responseTime}ms`,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: {
          status: dbStatus.connected ? 'up' : 'down',
          responseTime: `${dbStatus.responseTime}ms`,
          version: dbStatus.version,
        },
        memory: {
          status: memoryUsageMB.heapUsed < 500 ? 'healthy' : 'warning',
          rss: `${memoryUsageMB.rss} MB`,
          heapTotal: `${memoryUsageMB.heapTotal} MB`,
          heapUsed: `${memoryUsageMB.heapUsed} MB`,
          external: `${memoryUsageMB.external} MB`,
        },
        process: {
          status: 'running',
          pid: process.pid,
          nodeVersion: process.version,
          platform: process.platform,
        },
      },
    };
  }

  async checkDatabase() {
    const startTime = Date.now();
    let connected = false;
    let version = 'Unknown';

    try {
      connected = await this.prisma.checkConnection();
      if (connected) {
        version = await this.prisma.getDatabaseInfo();
      }
    } catch (error) {
      connected = false;
    }

    const responseTime = Date.now() - startTime;

    return {
      connected,
      responseTime,
      version,
      status: connected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
  }
}
