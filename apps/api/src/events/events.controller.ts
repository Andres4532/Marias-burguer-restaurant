import { Controller, Sse, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { MessageEvent } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events')
@UseGuards(AuthGuard('jwt'))
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Sse('entrantes/stream')
  entrantesStream(): Observable<MessageEvent> {
    return this.eventsService.getEntrantesStream();
  }
}
