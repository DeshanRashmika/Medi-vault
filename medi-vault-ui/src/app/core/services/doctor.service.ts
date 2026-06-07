import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface DoctorProfile {
  id: string;
  fullName: string;
  email: string;
  specialization: string;
  licenseNumber: string;
  bio: string;
  profileImageUrl?: string;
}

export interface DoctorAppointment {
  patientId: string;
  patientName: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  time: string;
  reason: string;
  note: string;
  labs: string;
  status: 'Scheduled' | 'In Review' | 'Completed';
}

export interface PatientSummary {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  lastVisit: string;
  condition: string;
}

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private readonly http = inject(HttpClient);

  getPatients(): Observable<PatientSummary[]> {
    return this.http.get<PatientSummary[]>(environment.doctorPatientsApiUrl).pipe(
      catchError(() => {
        console.warn('Using mock patient data as API failed');
        const mockPatients: PatientSummary[] = [
          { id: 'P-101', name: 'Amaya Perera', age: 34, gender: 'Female', lastVisit: '2024-04-10', condition: 'Hypertension' },
          { id: 'P-102', name: 'Roshan Silva', age: 52, gender: 'Male', lastVisit: '2024-03-22', condition: 'Post-op Recovery' },
          { id: 'P-103', name: 'Nimali Fernando', age: 61, gender: 'Female', lastVisit: '2024-04-15', condition: 'Type 2 Diabetes' },
          { id: 'P-104', name: 'Kasun Jayawardena', age: 45, gender: 'Male', lastVisit: '2024-04-18', condition: 'Cardiology' },
          { id: 'P-105', name: 'Dilini Wickramasinghe', age: 29, gender: 'Female', lastVisit: '2024-02-14', condition: 'Prenatal' },
          { id: 'P-106', name: 'Pradeep Gunasekara', age: 58, gender: 'Male', lastVisit: '2024-03-05', condition: 'Hypertension' },
        ];
        return of(mockPatients);
      })
    );
  }

  getAppointments(): Observable<DoctorAppointment[]> {
    return this.http.get<DoctorAppointment[]>(environment.doctorAppointmentsApiUrl).pipe(
      catchError(() => {
        console.warn('Using mock appointment data as API failed');
        const mockAppointments: DoctorAppointment[] = [
          {
            patientId: 'P-101',
            patientName: 'Amaya Perera',
            age: 34,
            gender: 'Female',
            time: '08:30 AM',
            reason: 'Annual review',
            note: 'BP slightly elevated last visit',
            labs: 'Pending CBC',
            status: 'Scheduled'
          },
          {
            patientId: 'P-102',
            patientName: 'Roshan Silva',
            age: 52,
            gender: 'Male',
            time: '09:00 AM',
            reason: 'Post-op follow-up',
            note: 'Knee replacement 6 weeks ago',
            labs: 'X-ray uploaded',
            status: 'In Review'
          },
          {
            patientId: 'P-103',
            patientName: 'Nimali Fernando',
            age: 61,
            gender: 'Female',
            time: '09:45 AM',
            reason: 'Diabetes check',
            note: 'HbA1c trending up',
            labs: 'HbA1c results in',
            status: 'Completed'
          },
          {
            patientId: 'P-104',
            patientName: 'Kasun Jayawardena',
            age: 45,
            gender: 'Male',
            time: '10:30 AM',
            reason: 'Chest pain consult',
            note: 'Referred from ER last week',
            labs: 'ECG ordered',
            status: 'Scheduled'
          }
        ];
        return of(mockAppointments);
      })
    );
  }

  getProfile(): Observable<DoctorProfile> {
    return this.http.get<DoctorProfile>(`${environment.apiBaseUrl}/doctor/profile`).pipe(
      catchError(() => {
        return of({
          id: 'D-99',
          fullName: 'Dr. John Doe',
          email: 'john.doe@medi-vault.local',
          specialization: 'Senior Cardiologist',
          licenseNumber: 'SLMC-88392',
          bio: 'Specializing in interventional cardiology and heart failure management with over 15 years of experience.',
          profileImageUrl: ''
        });
      })
    );
  }

  updateProfile(profile: Partial<DoctorProfile>): Observable<DoctorProfile> {
    return this.http.put<DoctorProfile>(`${environment.apiBaseUrl}/doctor/profile`, profile);
  }

  uploadProfileImage(file: File): Observable<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ imageUrl: string }>(`${environment.apiBaseUrl}/doctor/profile/image`, formData);
  }
}
