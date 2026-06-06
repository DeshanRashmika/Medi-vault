import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PatientProfile, UpdatePatientProfileRequest } from '../models/patient-profile.model';

@Injectable({
  providedIn: 'root'
})
export class PatientProfileService {
  private readonly http = inject(HttpClient);

  getMyProfile(): Observable<PatientProfile> {
    return this.http.get<PatientProfile>(environment.patientProfileApiUrl);
  }

  updateMyProfile(payload: UpdatePatientProfileRequest): Observable<PatientProfile> {
    return this.http.put<PatientProfile>(environment.patientProfileApiUrl, payload);
  }

  uploadProfileImage(file: File): Observable<PatientProfile> {
    const formData = new FormData();

    formData.append('file', file);

    return this.http.post<PatientProfile>(environment.patientProfileImageApiUrl, formData);
  }
}
