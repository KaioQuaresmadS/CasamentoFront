import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { RsvpApiService } from '../../application/api/rsvp-api.service';
import { AttendanceForm } from '../../domain/models/attendance-form.model';

@Component({
  selector: 'app-rsvp-form',
  imports: [FormsModule],
  templateUrl: './rsvp-form.component.html',
  styleUrl: './rsvp-form.component.scss'
})
export class RsvpFormComponent {
  protected readonly rsvpSent = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly submitError = signal('');

  constructor(private readonly rsvpApiService: RsvpApiService) {}

  protected readonly attendanceForm: AttendanceForm = {
    fullName: '',
    companions: 0,
    phone: '',
    attendance: '',
    notes: ''
  };

  protected submitRsvp(): void {
    this.isSubmitting.set(true);
    this.submitError.set('');

    this.rsvpApiService
      .confirmPresence(this.attendanceForm)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => this.rsvpSent.set(true),
        error: () => this.submitError.set('Nao foi possivel salvar sua confirmacao agora. Tente novamente em alguns instantes.')
      });
  }

  protected updateAttendance(attendance: AttendanceForm['attendance']): void {
    this.attendanceForm.attendance = attendance;

    if (attendance === 'nao') {
      this.attendanceForm.companions = 0;
    }
  }
}
