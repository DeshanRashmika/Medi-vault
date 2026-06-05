import { HttpErrorResponse, HttpEventType, HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, finalize, of, switchMap } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { MedicalRecordService } from '../../../core/services/medical-record.service';
import { MedicalRecord, MedicalRecordUpload } from '../../../core/models/medical-record.model';
import { PatientService } from '../../../core/services/patient.service';
import { PatientProfile, PatientProfileRequest } from '../../../core/models/patient-profile.model';
import { UploadRecordModalComponent } from '../upload-record-modal/upload-record-modal.component';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [UploadRecordModalComponent, ReactiveFormsModule],
  templateUrl: './patient-dashboard.component.html',
  styleUrl: './patient-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientDashboardComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly medicalRecordService = inject(MedicalRecordService);
  private readonly profileService = inject(PatientService);
  private readonly toastService = inject(ToastService);
  private profilePreviewObjectUrl: string | null = null;
  private protectedProfileImageObjectUrl: string | null = null;
  private profileImageRequestVersion = 0;

  protected readonly sidebarOpen = signal(true);
  protected readonly uploadModalOpen = signal(false);
  protected readonly profileEditorOpen = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly isProfileLoading = signal(false);
  protected readonly isProfileSaving = signal(false);
  protected readonly uploadProgress = signal<number | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly profileErrorMessage = signal<string | null>(null);
  protected readonly searchTerm = signal('');
  protected readonly statusFilter = signal<'all' | 'Available' | 'Pending' | 'Archived'>('all');
  protected readonly statusFilters = ['all', 'Available', 'Pending', 'Archived'] as const;
  protected readonly records = signal<MedicalRecord[]>([]);
  protected readonly patientProfile = signal<PatientProfile | null>(null);
  protected readonly selectedProfileImage = signal<File | null>(null);
  protected readonly selectedProfileImageName = signal('No image selected');
  protected readonly selectedProfileImagePreviewUrl = signal<string | null>(null);
  protected readonly protectedProfileImageUrl = signal<string | null>(null);
  protected readonly bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

  protected readonly profileForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    bloodGroup: ['', [Validators.pattern(/^(A|B|AB|O)[+-]?$/)]],
    height: [null as number | null, [Validators.min(0.5), Validators.max(300)]],
    weight: [null as number | null, [Validators.min(1), Validators.max(500)]]
  });

  protected readonly userName = computed(
    () => this.resolveDisplayName(this.patientProfile()?.fullName ?? this.authService.currentUser()?.fullName)
  );
  protected readonly userEmail = computed(
    () => this.patientProfile()?.email ?? this.authService.currentUser()?.email ?? 'patient@medi-vault.local'
  );
  protected readonly profileImageUrl = computed(
    () => this.patientProfile()?.profileImageUrl ?? this.authService.currentUser()?.profileImageUrl ?? null
  );
  protected readonly mergedProfile = computed(() => {
    const profile = this.patientProfile();
    const currentUser = this.authService.currentUser();

    return {
      bloodGroup: profile?.bloodGroup ?? currentUser?.bloodGroup ?? null,
      height: profile?.height ?? currentUser?.height ?? null,
      weight: profile?.weight ?? currentUser?.weight ?? null
    };
  });
  protected readonly avatarUrl = computed(
    () => this.selectedProfileImagePreviewUrl() ?? this.protectedProfileImageUrl() ?? this.profileImageUrl() ?? null
  );
  protected readonly profileIsComplete = computed(() => {
    const profile = this.mergedProfile();

    return Boolean(this.userName().trim()) && Boolean(profile.bloodGroup) && Boolean(profile.height) && Boolean(profile.weight);
  });
  protected readonly profileBadgeText = computed(() => (this.profileIsComplete() ? 'Profile ready' : 'Needs update'));
  protected readonly dashboardBloodGroup = computed(() => this.mergedProfile().bloodGroup ?? '—');
  protected readonly dashboardHeightDisplay = computed(() => this.formatMetricDisplay(this.mergedProfile().height, 'm'));
  protected readonly dashboardWeightDisplay = computed(() => this.formatMetricDisplay(this.mergedProfile().weight, 'kg'));
  protected readonly userInitials = computed(() => {
    const name = this.userName().trim();

    if (name.length === 0) {
      return 'P';
    }

    const words = name.split(/\s+/).slice(0, 2);

    return words.map((word) => word[0]?.toUpperCase() ?? '').join('');
  });
  protected readonly totalRecords = computed(() => this.records().length);
  protected readonly latestRecord = computed(() => this.records()[0] ?? null);
  protected readonly latestRecordTitle = computed(() => this.latestRecord()?.title ?? 'No records loaded');
  protected readonly latestRecordDate = computed(() =>
    this.latestRecord()?.recordDate ?? 'Waiting for records from the server.'
  );
  protected readonly filteredRecords = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    const statusFilter = this.statusFilter();

    return this.records().filter((record) => {
      const matchesSearch =
        query.length === 0 ||
        [record.title, record.doctorName, record.category, record.fileName, record.notes]
          .filter((value): value is string => typeof value === 'string')
          .some((value) => value.toLowerCase().includes(query));

      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  });

  ngOnInit(): void {
    if (this.authService.isDoctor(this.authService.currentUser())) {
      void this.router.navigateByUrl('/doctor-dashboard');

      return;
    }

    this.loadProfile();
    this.loadRecords();
  }

  ngOnDestroy(): void {
    this.revokeProfilePreviewUrl();
    this.revokeProtectedProfileImageUrl();
  }

  protected toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  protected openUploadModal(): void {
    this.uploadProgress.set(null);
    this.uploadModalOpen.set(true);
  }

  protected closeUploadModal(): void {
    this.uploadProgress.set(null);
    this.uploadModalOpen.set(false);
  }

  protected openProfileEditor(): void {
    this.profileErrorMessage.set(null);
    const profile = this.patientProfile();

    this.profileForm.patchValue({
      fullName: this.userName(),
      bloodGroup: profile?.bloodGroup ?? '',
      height: profile?.height ?? null,
      weight: profile?.weight ?? null
    });
    this.selectedProfileImageName.set('No image selected');
    this.revokeProfilePreviewUrl();
    this.profileEditorOpen.set(true);
  }

  protected closeProfileEditor(): void {
    this.profileEditorOpen.set(false);
    this.selectedProfileImage.set(null);
    this.selectedProfileImageName.set('No image selected');
    this.selectedProfileImagePreviewUrl.set(null);
    this.revokeProfilePreviewUrl();
  }

  protected setStatusFilter(filter: 'all' | 'Available' | 'Pending' | 'Archived'): void {
    this.statusFilter.set(filter);
  }

  protected updateSearchTerm(event: Event): void {
    const target = event.target as HTMLInputElement | null;

    this.searchTerm.set(target?.value ?? '');
  }

  protected logout(): void {
    this.authService.logout();
  }

  protected onProfileImageSelected(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const file = target?.files?.[0] ?? null;

    this.selectedProfileImage.set(file);
    this.selectedProfileImageName.set(file?.name ?? 'No image selected');

    this.revokeProfilePreviewUrl();

    if (file) {
      const objectUrl = URL.createObjectURL(file);
      this.profilePreviewObjectUrl = objectUrl;
      this.selectedProfileImagePreviewUrl.set(objectUrl);
    } else {
      this.selectedProfileImagePreviewUrl.set(null);
    }
  }

  protected saveProfile(): void {
    this.profileForm.markAllAsTouched();

    this.profileErrorMessage.set(null);
    this.isProfileSaving.set(true);

    const selectedImage = this.selectedProfileImage();
    const fullName = (this.profileForm.controls.fullName.value ?? '').trim();
    const bloodGroup = (this.profileForm.controls.bloodGroup.value ?? '').trim();
    const height = this.profileForm.controls.height.value;
    const weight = this.profileForm.controls.weight.value;
    const normalizedHeight = this.normalizeHeightToMeters(height ?? null);
    const payload: PatientProfileRequest = {
      fullName,
      ...(bloodGroup ? { bloodGroup } : {}),
      ...(normalizedHeight === null ? {} : { height: normalizedHeight }),
      ...(weight === null ? {} : { weight })
    };

    if (this.profileForm.invalid) {
      const validationMessage = this.getProfileValidationMessage();
      this.isProfileSaving.set(false);
      this.profileErrorMessage.set(validationMessage);
      this.toastService.show(validationMessage, 'error');
      return;
    }

    this.profileService
      .updateProfile(payload)
      .pipe(
        switchMap((updatedProfile) => {
          if (!selectedImage) {
            return of(updatedProfile);
          }

          return this.profileService.uploadProfileImage(selectedImage).pipe(
            catchError(() => of(updatedProfile))
          );
        }),
        switchMap((profileAfterSave) =>
          this.profileService.getProfile().pipe(
            catchError(() => of(profileAfterSave))
          )
        ),
        finalize(() => this.isProfileSaving.set(false))
      )
      .subscribe({
        next: (profile) => {
          this.patientProfile.set(profile);
          this.syncProtectedProfileImage(profile.profileImageUrl);
          this.authService.updateCurrentUser({
            fullName: profile.fullName || fullName,
            bloodGroup: profile.bloodGroup,
            height: profile.height,
            weight: profile.weight,
            profileImageUrl: profile.profileImageUrl
          });
          this.toastService.show('Profile saved successfully.', 'success');

          // Close the editor to go "back" to the dashboard
          this.closeProfileEditor();
        },
        error: (error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 403) {
            this.profileErrorMessage.set('Profile update denied for this account.');
            this.toastService.show('Profile update blocked (403).', 'error');

            return;
          }

          const backendMessage = error instanceof HttpErrorResponse ? this.extractHttpErrorMessage(error) : null;
          this.profileErrorMessage.set(backendMessage ?? 'Could not save your profile right now.');
          this.toastService.show(backendMessage ?? 'Profile update failed. Try again.', 'error');
        }
      });
  }

  protected get profileNameInvalid(): boolean {
    const control = this.profileForm.controls.fullName;

    return control.touched && control.invalid;
  }

  protected handleUpload(payload: MedicalRecordUpload): void {
    this.errorMessage.set(null);
    this.isLoading.set(true);
    this.uploadProgress.set(0);

    this.medicalRecordService
      .uploadRecordWithProgress(payload)
      .pipe(finalize(() => {
        this.isLoading.set(false);
        this.uploadProgress.set(null);
      }))
      .subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress) {
            const progress = event.total ? Math.round((event.loaded / event.total) * 100) : null;

            this.uploadProgress.set(progress);

            return;
          }

          if (event instanceof HttpResponse) {
            this.uploadProgress.set(100);
            this.closeUploadModal();
            this.loadRecords();
            this.toastService.show('Record uploaded successfully.', 'success');
          }
        },
        error: (error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 403) {
            this.errorMessage.set('Upload denied. Your account does not have permission for this action.');
            this.toastService.show('Upload blocked (403): insufficient permissions for this account.', 'error');

            return;
          }

          if (error instanceof HttpErrorResponse && error.status === 413) {
            this.errorMessage.set('The selected file is too large. Please upload a smaller file.');
            this.toastService.show('Upload failed: file size exceeds server limit.', 'error');

            return;
          }

          if (error instanceof HttpErrorResponse && error.status === 415) {
            this.errorMessage.set('Unsupported file type. Please upload a supported document or image.');
            this.toastService.show('Upload failed: unsupported file type.', 'error');

            return;
          }

          if (error instanceof HttpErrorResponse && error.status === 400) {
            const backendMessage = this.extractHttpErrorMessage(error);
            this.errorMessage.set(backendMessage ?? 'Upload request is invalid. Check file and notes, then try again.');
            this.toastService.show(backendMessage ?? 'Upload failed: invalid request data.', 'error');

            return;
          }

          this.errorMessage.set('The upload could not be completed right now. Please try again.');
          this.toastService.show('Upload failed. Please try again.', 'error');
        }
      });
  }

  protected loadRecords(): void {
    this.errorMessage.set(null);
    this.isLoading.set(true);

    this.medicalRecordService
      .getMyRecords()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (records) => this.records.set(records),
        error: (error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 403) {
            this.errorMessage.set('Access denied to medical records. Please sign in with a patient account.');
            this.toastService.show('Access denied (403): this account cannot view patient records.', 'error');

            if (this.authService.isDoctor(this.authService.currentUser())) {
              void this.router.navigateByUrl('/doctor-dashboard');
            }
          } else {
            this.errorMessage.set('We could not load your medical records right now.');
            this.toastService.show('Record loading failed. Please try again shortly.', 'error');
          }

          this.records.set([]);
        }
      });
  }

  protected loadProfile(): void {
    this.isProfileLoading.set(true);

    this.profileService
      .getProfile()
      .pipe(finalize(() => this.isProfileLoading.set(false)))
      .subscribe({
        next: (profile) => {
          this.patientProfile.set(profile);
          this.syncProtectedProfileImage(profile.profileImageUrl);
          this.profileForm.patchValue({
            fullName: profile.fullName ?? this.userName(),
            bloodGroup: profile.bloodGroup ?? '',
            height: profile.height ?? null,
            weight: profile.weight ?? null
          });
          this.authService.updateCurrentUser({
            fullName: profile.fullName,
            bloodGroup: profile.bloodGroup,
            height: profile.height,
            weight: profile.weight,
            profileImageUrl: profile.profileImageUrl
          });
        },
        error: (error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 403) {
            this.toastService.show('Profile access denied (403).', 'error');

            return;
          }

          this.toastService.show('Could not load your profile details.', 'info');
        }
      });
  }

  protected calculateBmi(height: number | null | undefined, weight: number | null | undefined): number | null {
    const normalizedHeight = this.normalizeHeightToMeters(height ?? null);

    if (!normalizedHeight || !weight || normalizedHeight <= 0 || weight <= 0) {
      return null;
    }

    return weight / (normalizedHeight * normalizedHeight);
  }

  private getProfileValidationMessage(): string {
    if (this.profileForm.controls.fullName.invalid) {
      return 'Please enter a valid full name (minimum 2 characters).';
    }

    if (this.profileForm.controls.bloodGroup.invalid) {
      return 'Please select a valid blood group.';
    }

    if (this.profileForm.controls.height.invalid) {
      return 'Height is invalid. Use meters (1.72), feet (5.2), or centimeters (172).';
    }

    if (this.profileForm.controls.weight.invalid) {
      return 'Weight is invalid. Use a value between 1 and 500 kg.';
    }

    return 'Please correct invalid profile fields before saving.';
  }

  private normalizeHeightToMeters(height: number | null): number | null {
    if (height === null || Number.isNaN(height) || height <= 0) {
      return null;
    }

    if (height <= 3) {
      return Number(height.toFixed(2));
    }

    if (height <= 10) {
      return Number((height * 0.3048).toFixed(2));
    }

    if (height <= 300) {
      return Number((height / 100).toFixed(2));
    }

    return null;
  }

  private formatMetricDisplay(value: number | null | undefined, unit: string): string {
    return value === null || value === undefined ? '—' : `${value} ${unit}`;
  }

  private extractHttpErrorMessage(error: HttpErrorResponse): string | null {
    const payload = error.error;

    if (typeof payload === 'string' && payload.trim().length > 0) {
      return payload;
    }

    if (payload && typeof payload === 'object') {
      const message = (payload as { message?: unknown }).message;
      const errorField = (payload as { error?: unknown }).error;
      const details = (payload as { details?: unknown }).details;

      if (typeof message === 'string' && message.trim().length > 0) {
        return message;
      }

      if (typeof errorField === 'string' && errorField.trim().length > 0) {
        return errorField;
      }

      if (typeof details === 'string' && details.trim().length > 0) {
        return details;
      }
    }

    return null;
  }

  protected get profileNameControl() {
    return this.profileForm.controls.fullName;
  }

  protected get profileBloodGroupControl() {
    return this.profileForm.controls.bloodGroup;
  }

  protected get profileHeightControl() {
    return this.profileForm.controls.height;
  }

  protected get profileWeightControl() {
    return this.profileForm.controls.weight;
  }

  protected readonly dashboardBmiValue = computed(() => {
    const profile = this.patientProfile();

    return this.calculateBmi(profile?.height, profile?.weight);
  });

  protected readonly dashboardBmiDisplay = computed(() => {
    const bmi = this.dashboardBmiValue();

    return bmi === null ? '—' : bmi.toFixed(1);
  });

  protected readonly dashboardBmiCategory = computed(() => {
    const bmi = this.dashboardBmiValue();

    if (bmi === null) return 'Update your profile';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Healthy range';
    if (bmi < 30) return 'Overweight';

    return 'Obesity range';
  });

  protected bmiValue(): number | null {
    return this.calculateBmi(this.profileForm.controls.height.value, this.profileForm.controls.weight.value);
  }

  protected bmiDisplay(): string {
    const bmi = this.bmiValue();

    return bmi === null ? '—' : bmi.toFixed(1);
  }

  protected bmiCategory(): string {
    const bmi = this.bmiValue();

    if (bmi === null) {
      return 'Add height and weight';
    }

    if (bmi < 18.5) {
      return 'Underweight';
    }

    if (bmi < 25) {
      return 'Healthy range';
    }

    if (bmi < 30) {
      return 'Overweight';
    }

    return 'Obesity range';
  }

  private revokeProfilePreviewUrl(): void {
    if (!this.profilePreviewObjectUrl) {
      return;
    }

    URL.revokeObjectURL(this.profilePreviewObjectUrl);
    this.profilePreviewObjectUrl = null;
  }

  private syncProtectedProfileImage(imageUrl: string | null | undefined): void {
    const normalizedImageUrl = imageUrl?.trim() ?? '';
    this.profileImageRequestVersion += 1;
    const requestVersion = this.profileImageRequestVersion;

    if (!normalizedImageUrl || !this.isProtectedImageUrl(normalizedImageUrl)) {
      this.revokeProtectedProfileImageUrl();
      return;
    }

    this.profileService.loadProtectedImage(normalizedImageUrl).subscribe({
      next: (objectUrl) => {
        if (requestVersion !== this.profileImageRequestVersion) {
          URL.revokeObjectURL(objectUrl);
          return;
        }

        this.revokeProtectedProfileImageUrl();
        this.protectedProfileImageObjectUrl = objectUrl;
        this.protectedProfileImageUrl.set(objectUrl);
      },
      error: () => {
        if (requestVersion !== this.profileImageRequestVersion) {
          return;
        }

        this.revokeProtectedProfileImageUrl();
      }
    });
  }

  private revokeProtectedProfileImageUrl(): void {
    if (!this.protectedProfileImageObjectUrl) {
      this.protectedProfileImageUrl.set(null);
      return;
    }

    URL.revokeObjectURL(this.protectedProfileImageObjectUrl);
    this.protectedProfileImageObjectUrl = null;
    this.protectedProfileImageUrl.set(null);
  }

  private isProtectedImageUrl(url: string): boolean {
    return url.startsWith('/api/') || url.includes('/api/');
  }

  protected getStatusBadgeClasses(status: string): string {
    if (status === 'Available') {
      return 'inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200';
    }

    if (status === 'Pending') {
      return 'inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200';
    }

    return 'inline-flex rounded-full border border-slate-400/20 bg-slate-400/10 px-3 py-1 text-xs font-semibold text-slate-200';
  }

  protected clearSearch(): void {
    this.searchTerm.set('');
    this.statusFilter.set('all');
  }

  private resolveDisplayName(name: string | undefined | null): string {
    const trimmedName = name?.trim();

    if (trimmedName && trimmedName.toLowerCase() !== 'patient') {
      return trimmedName;
    }

    const emailName = this.authService.currentUser()?.email?.split('@')[0]?.replaceAll(/[._-]+/g, ' ').trim();

    if (emailName && emailName.length > 0) {
      return emailName
        .split(/\s+/)
        .map((word) => `${word[0]?.toUpperCase() ?? ''}${word.slice(1)}`)
        .join(' ');
    }

    return 'Your profile';
  }
}
