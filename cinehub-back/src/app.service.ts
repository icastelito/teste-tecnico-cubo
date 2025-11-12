import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  handshake() {
    return {
      message: 'olá',
      timestamp: new Date().toISOString(),
      status: 'success',
    };
  }
  love() {
    return {
      message: 'I love Malu!',
    };
  }
}
