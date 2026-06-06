import { HttpClient, HttpEvent, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, filter, map, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { MedicalRecord, MedicalRecordUpload } from '../models/medical-record.model';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class MedicalRecordService {
  private readonly http = inject(HttpClient);
  private readonly uploadEndpoints = [environment.uploadApiUrl, environment.uploadApiFallbackUrl, environment.uploadApiV1FallbackUrl];

  getMyRecords(): Observable<MedicalRecord[]> {
    return this.http.get<ApiResponse<MedicalRecord[]> | MedicalRecord[]>(environment.patientRecordsApiUrl).pipe(
      map(response => this.unwrapApiResponse(response))
    );
  }

  getPatientRecords(patientId: number | string): Observable<MedicalRecord[]> {
    return this.http.get<ApiResponse<MedicalRecord[]> | MedicalRecord[]>(`${environment.apiBaseUrl}/v1/records/patient/${patientId}`).pipe(
      map(response => this.unwrapApiResponse(response))
    );
  }

  uploadRecord(payload: MedicalRecordUpload): Observable<MedicalRecord> {
    return this.uploadRecordWithProgress(payload).pipe(
      filter((event): event is HttpResponse<MedicalRecord> => event instanceof HttpResponse),
      map((response) => {
        if (!response.body) {
          throw new Error('Upload response did not include a record body.');
        }

        return this.unwrapApiResponse(response.body);
      })
    );
  }

  uploadRecordWithProgress(payload: MedicalRecordUpload): Observable<HttpEvent<MedicalRecord>> {
    const secureUploadFormData = this.buildSecureUploadFormData(payload);
    const v1UploadFormData = this.buildV1UploadFormData(payload);

    return this.requestSequentially(this.uploadEndpoints, (url) =>
      this.http.post<MedicalRecord>(url, url === environment.uploadApiV1FallbackUrl ? v1UploadFormData : secureUploadFormData, {
        reportProgress: true,
        observe: 'events'
      })
    );
  }

  private unwrapApiResponse<T>(response: ApiResponse<T> | T): T {
    if (this.isApiResponse(response)) {
      return response.data;
    }

    return response;
  }

  private isApiResponse<T>(response: ApiResponse<T> | T): response is ApiResponse<T> {
    return response !== null && typeof response === 'object' && 'success' in response && 'data' in response;
  }

  private shouldFallbackOnUploadError(status: number | undefined): boolean {
    return status === 400 || status === 404 || status === 405 || status === 415 || status === 422 || status === 500;
  }

  private requestSequentially<T>(endpoints: string[], requestFactory: (url: string) => Observable<T>): Observable<T> {
    const [currentEndpoint, ...remainingEndpoints] = endpoints;

    return requestFactory(currentEndpoint).pipe(
      catchError((error: { status?: number }) => {
        if (remainingEndpoints.length > 0 && this.shouldFallbackOnUploadError(error?.status)) {
          return this.requestSequentially(remainingEndpoints, requestFactory);
        }

        return throwError(() => error);
      })
    );
  }

  private buildSecureUploadFormData(payload: MedicalRecordUpload): FormData {
    const formData = new FormData();

    formData.append('description', payload.notes);
    formData.append('document', payload.file, payload.file.name);

    return formData;
  }

  private buildV1UploadFormData(payload: MedicalRecordUpload): FormData {
    const formData = new FormData();
    const derivedTitle = payload.file.name.replace(/\.[^/.]+$/, '') || 'Medical record';
    const recordDate = new Date().toISOString().slice(0, 10);

    formData.append('notes', payload.notes);
    formData.append('title', derivedTitle);
    formData.append('category', 'General');
    formData.append('recordDate', recordDate);
    formData.append('file', payload.file, payload.file.name);

    return formData;
  }
}
