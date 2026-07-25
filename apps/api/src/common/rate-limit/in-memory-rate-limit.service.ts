import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class InMemoryRateLimitService {
  private readonly limits = new Map<string, RateLimitEntry>();

  assertWithinLimit(
    key: string,
    maxAttempts: number,
    windowMs: number,
    message = 'Demasiados intentos. Intenta de nuevo en unos minutos.',
  ): void {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetAt) {
      this.limits.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }

    if (entry.count >= maxAttempts) {
      throw new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
    }

    entry.count += 1;
  }
}
