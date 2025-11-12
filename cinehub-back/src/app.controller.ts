import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('handshake')
  handshake() {
    return this.appService.handshake();
  }

  @Public()
  @Get('love')
  love() {
    return this.appService.love();
  }
}
