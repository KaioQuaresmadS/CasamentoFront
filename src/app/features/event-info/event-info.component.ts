import { Component, Input } from '@angular/core';
import { EventInfoCard } from '../../domain/models/wedding-info.model';

@Component({
  selector: 'app-event-info',
  templateUrl: './event-info.component.html',
  styleUrl: './event-info.component.scss'
})
export class EventInfoComponent {
  @Input({ required: true }) eventCards: EventInfoCard[] = [];

  protected eventSummary(): string {
    const valueByLabel = (label: string) =>
      this.eventCards.find((card) => card.label.toLowerCase() === label.toLowerCase());

    const date = valueByLabel('Data');
    const place = valueByLabel('Local');
    const time = valueByLabel('Horário');
    const dressCode = valueByLabel('Traje');

    return [
      date ? `Nosso casamento sera no dia ${date.title}` : '',
      time ? `as ${time.title}` : '',
      place ? `no ${place.title}, ${place.description}` : '',
      dressCode ? `O traje sugerido e ${dressCode.title.toLowerCase()}. ${dressCode.description}` : ''
    ]
      .filter(Boolean)
      .join(' ');
  }
}
