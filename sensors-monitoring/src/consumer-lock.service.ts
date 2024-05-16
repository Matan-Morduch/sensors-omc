import { Injectable } from '@nestjs/common';

@Injectable()
export class LockService {
  private isLocked = false;

  acquireLock(): boolean {
    if (!this.isLocked) {
      this.isLocked = true;
      return true;
    }
    return false;
  }

  releaseLock(): void {
    this.isLocked = false;
  }
}
