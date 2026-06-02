import { Component, Input } from '@angular/core';
import { EventInfoCard } from '../../domain/models/wedding-info.model';

@Component({
  selector: 'app-event-info',
  templateUrl: './event-info.component.html',
  styleUrl: './event-info.component.scss'
})
export class EventInfoComponent {
  @Input({ required: true }) eventCards: EventInfoCard[] = [];
}
