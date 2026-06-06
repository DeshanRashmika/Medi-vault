export interface MedicalRecord {
  id: number;
  recordDate: string;
  title: string;
  doctorName: string;
  category: string;
  status: MedicalRecordStatus;
  fileName?: string;
  notes?: string;
}

export type MedicalRecordStatus = 'Available' | 'Pending' | 'Archived' | (string & {});

export interface MedicalRecordUpload {
  file: File;
  notes: string;
}
