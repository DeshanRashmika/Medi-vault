export interface PatientProfile {
  fullName: string;
  email?: string;
  bloodGroup?: string;
  height?: number;
  weight?: number;
  profileImageUrl?: string;
}

export interface UpdatePatientProfileRequest {
  fullName: string;
  bloodGroup?: string;
  height?: number;
  weight?: number;
  profileImageUrl?: string;
}

export type PatientProfileRequest = UpdatePatientProfileRequest;

export interface PatientProfileImageResponse {
  fullName: string;
  bloodGroup?: string;
  height?: number;
  weight?: number;
  profileImageUrl?: string;
  email?: string;
}
