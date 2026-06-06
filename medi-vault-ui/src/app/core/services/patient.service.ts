import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PatientProfile, PatientProfileRequest } from '../models/patient-profile.model';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private readonly http = inject(HttpClient);
  private readonly profileReadEndpoints = [environment.legacyPatientProfileApiUrl, environment.patientProfileApiUrl];
  private readonly profileWriteEndpoints = [environment.legacyPatientProfileApiUrl, environment.patientProfileUpdateApiUrl];
  private readonly profileImageEndpoints = [environment.legacyPatientProfileImageApiUrl, environment.patientProfileImageApiUrl];

  getProfile(): Observable<PatientProfile> {
    return this.requestSequentially(this.profileReadEndpoints, (url) => this.http.get<ApiResponse<PatientProfile> | PatientProfile>(url)).pipe(
      map((response) => this.normalizeProfile(this.unwrapApiResponse(response)))
    );
  }

  updateProfile(payload: PatientProfileRequest): Observable<PatientProfile> {
    return this.requestSequentially(this.profileWriteEndpoints, (url) => this.http.put<ApiResponse<PatientProfile> | PatientProfile>(url, payload)).pipe(
      map((response) => this.normalizeProfile(this.unwrapApiResponse(response)))
    );
  }

  uploadProfileImage(file: File): Observable<PatientProfile> {
    const formData = new FormData();

    formData.append('file', file, file.name);

    return this.requestSequentially(this.profileImageEndpoints, (url) => this.http.post<ApiResponse<PatientProfile> | PatientProfile>(url, formData)).pipe(
      map((response) => this.normalizeProfile(this.unwrapApiResponse(response)))
    );
  }

  loadProtectedImage(imageUrl: string): Observable<string> {
    return this.http.get(imageUrl, { responseType: 'blob' }).pipe(
      map((blob) => URL.createObjectURL(blob))
    );
  }

  private unwrapApiResponse<T>(response: ApiResponse<T> | T): T {
    if (this.isApiResponse(response)) {
      return response.data;
    }

    return response;
  }

  private isApiResponse<T>(response: ApiResponse<T> | T): response is ApiResponse<T> {
    return response !== null && typeof response === 'object' && 'data' in response;
  }

  private requestSequentially<T>(endpoints: string[], requestFactory: (url: string) => Observable<T>): Observable<T> {
    const [currentEndpoint, ...remainingEndpoints] = endpoints;

    return requestFactory(currentEndpoint).pipe(
      catchError((error: { status?: number }) => {
        if (remainingEndpoints.length > 0 && this.shouldRetryRequest(error?.status)) {
          return this.requestSequentially(remainingEndpoints, requestFactory);
        }

        return throwError(() => error);
      })
    );
  }

  private normalizeProfile(profile: PatientProfile): PatientProfile {
    const source = profile as unknown as Record<string, unknown> & {
      name?: string;
      full_name?: string;
      blood_group?: string;
      imageUrl?: string;
      avatarUrl?: string;
      picture?: string;
      profile_image_url?: string;
      bodyHeight?: number | string;
      bodyWeight?: number | string;
    };

    return {
      fullName: this.readString(source, ['fullName', 'name', 'full_name']) ?? '',
      email: this.readString(source, ['email']),
      bloodGroup: this.readString(source, ['bloodGroup', 'blood_group']),
      height: this.readNumberFromKeys(source, ['height', 'bodyHeight']),
      weight: this.readNumberFromKeys(source, ['weight', 'bodyWeight']),
      profileImageUrl: this.readString(source, ['profileImageUrl', 'imageUrl', 'avatarUrl', 'picture', 'profile_image_url'])
    };
  }

  private readString(source: Record<string, unknown>, keys: string[]): string | undefined {
    for (const key of keys) {
      const value = source[key];

      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }

    return undefined;
  }

  private readNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return undefined;
  }

  private readNumberFromKeys(source: Record<string, unknown>, keys: string[]): number | undefined {
    for (const key of keys) {
      const value = source[key];
      const parsed = this.readNumber(value);

      if (parsed !== undefined) {
        return parsed;
      }
    }

    return undefined;
  }

  private shouldRetryRequest(status: number | undefined): boolean {
    return status === 400 || status === 404 || status === 405 || status === 422 || status === 500;
  }
}
