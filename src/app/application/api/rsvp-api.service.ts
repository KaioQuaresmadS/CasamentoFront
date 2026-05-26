import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AttendanceForm } from '../../domain/models/attendance-form.model';
import { API_BASE_URL } from './api.config';

interface CreateGuestConfirmationRequest {
  fullName: string;
  phone: string;
  guestsCount: number;
  willAttend: boolean;
  notes: string | null;
}

@Injectable({ providedIn: 'root' })
export class RsvpApiService {
  constructor(private readonly http: HttpClient) {}

  confirmPresence(form: AttendanceForm): Observable<unknown> {
    const companionsCount = form.attendance === 'sim' ? Number(form.companions) || 0 : 0;
    const request: CreateGuestConfirmationRequest = {
      fullName: form.fullName,
      phone: form.phone,
      guestsCount: companionsCount,
      willAttend: form.attendance === 'sim',
      notes: form.notes || null
    };

    return this.http.post(`${API_BASE_URL}/guest-confirmations`, request);
  }

  exportGuests(): Observable<Blob> {
    return this.http.get(`${API_BASE_URL}/guests/export`, {
      responseType: 'blob'
    });
  }
}
