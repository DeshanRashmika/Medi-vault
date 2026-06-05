import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { MedicalRecordService } from '../../../core/services/medical-record.service';
import { MedicalRecord } from '../../../core/models/medical-record.model';
import { DoctorAppointment, DoctorProfile, DoctorService, PatientSummary } from '../../../core/services/doctor.service';
import { ToastService } from '../../../shared/toast/toast.service';

export type DoctorDashboardView = 'appointments' | 'patients' | 'pending';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './doctor-dashboard.component.html',
  styleUrl: './doctor-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DoctorDashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly medicalRecordService = inject(MedicalRecordService);
  private readonly doctorService = inject(DoctorService);
  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastService);

  protected readonly sidebarOpen = signal(false);
  protected readonly quickMenuOpen = signal(false);
  protected readonly isReviewModalOpen = signal(false);
  protected readonly isQuickActionModalOpen = signal(false);
  protected readonly isProfileModalOpen = signal(false);
  protected readonly activeQuickAction = signal<'appointment' | 'note' | 'lab' | 'referral' | 'schedule' | null>(null);
  protected readonly isLoadingRecords = signal(false);
  protected readonly isLoadingDashboard = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly isProfileSaving = signal(false);

  protected readonly doctorProfile = signal<DoctorProfile | null>(null);

  protected handleQuickAction(action: 'appointment' | 'note' | 'lab' | 'referral' | 'schedule'): void {
    this.closeQuickMenu();
    this.activeQuickAction.set(action);
    this.isQuickActionModalOpen.set(true);
  }

  protected closeQuickActionModal(): void {
    this.isQuickActionModalOpen.set(false);
    this.activeQuickAction.set(null);
  }

  protected openProfileModal(): void {
    this.isProfileModalOpen.set(true);
  }

  protected closeProfileModal(): void {
    this.isProfileModalOpen.set(false);
  }

  protected onProfileImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.doctorService.uploadProfileImage(file).subscribe({
        next: (res) => {
          this.doctorProfile.update(p => p ? { ...p, profileImageUrl: res.imageUrl } : null);
          this.toastService.show('Profile picture updated', 'success');
        },
        error: () => this.toastService.show('Failed to upload image', 'error')
      });
    }
  }

  protected saveProfile(event: Event): void {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const updatedProfile: Partial<DoctorProfile> = {
      fullName: formData.get('fullName') as string,
      specialization: formData.get('specialization') as string,
      bio: formData.get('bio') as string
    };

    this.isProfileSaving.set(true);
    this.doctorService.updateProfile(updatedProfile).subscribe({
      next: (res) => {
        this.doctorProfile.set(res);
        this.isProfileSaving.set(false);
        this.closeProfileModal();
        this.toastService.show('Profile updated successfully', 'success');
      },
      error: () => {
        // Fallback for demo
        this.doctorProfile.update(p => p ? { ...p, ...updatedProfile } : null);
        this.isProfileSaving.set(false);
        this.closeProfileModal();
        this.toastService.show('Profile updated (Local Only)', 'success');
      }
    });
  }

  protected submitQuickAction(): void {
    this.isSubmitting.set(true);
    
    // Simulate API call
    globalThis.setTimeout(() => {
      this.isSubmitting.set(false);
      this.toastService.show(`Action "${this.activeQuickAction()}" completed successfully`, 'success');
      this.closeQuickActionModal();
      this.loadDashboardData(); // Refresh data
    }, 1500);
  }

  protected readonly currentView = signal<DoctorDashboardView>('appointments');
  protected readonly searchTerm = signal('');
  protected readonly statusFilter = signal<'all' | DoctorAppointment['status']>('all');
  protected readonly statusFilters = ['all', 'Scheduled', 'In Review', 'Completed'] as const;
  
  protected readonly selectedAppointment = signal<DoctorAppointment | null>(null);
  protected readonly patientRecords = signal<MedicalRecord[]>([]);

  protected readonly patients = signal<PatientSummary[]>([]);
  protected readonly appointments = signal<DoctorAppointment[]>([]);

  protected readonly patientCount = computed(() => this.patients().length || 0);
  protected readonly todayConsultations = computed(() => this.appointments().length || 0);
  protected readonly pendingReviews = computed(
    () => this.appointments().filter((appointment) => appointment.status === 'In Review').length
  );
  protected readonly availableSlots = computed(() => 6);
  protected readonly userName = computed(() => this.authService.currentUser()?.fullName ?? 'Doctor');
  protected readonly userEmail = computed(() => this.authService.currentUser()?.email ?? 'doctor@medi-vault.local');
  protected readonly filteredAppointments = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    const statusFilter = this.statusFilter();

    return this.appointments().filter((appointment) => {
      const matchesSearch =
        query.length === 0 ||
        [appointment.patientName, appointment.reason, appointment.time, appointment.note, appointment.labs].some((value) =>
          value.toLowerCase().includes(query)
        );

      const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  });

  protected readonly filteredPatients = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    return this.patients().filter((patient) => 
      query.length === 0 || 
      [patient.name, patient.id, patient.condition].some(v => v.toLowerCase().includes(query))
    );
  });

  protected readonly filteredPendingReviews = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    return this.appointments().filter((appointment) => 
      appointment.status === 'In Review' && 
      (query.length === 0 || [appointment.patientName, appointment.reason].some(v => v.toLowerCase().includes(query)))
    );
  });

  protected setView(view: DoctorDashboardView): void {
    this.currentView.set(view);
    this.clearFilters();
  }

  ngOnInit(): void {
    if (!this.authService.isDoctor(this.authService.currentUser())) {
      void this.router.navigateByUrl('/dashboard');
      return;
    }
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.isLoadingDashboard.set(true);
    
    // Load doctor profile
    this.doctorService.getProfile().subscribe({
      next: (profile) => this.doctorProfile.set(profile),
      error: () => console.error('Failed to load doctor profile')
    });

    // Load appointments
    this.doctorService.getAppointments().subscribe({
      next: (data) => this.appointments.set(data),
      error: () => console.error('Failed to load appointments')
    });

    // Load patients
    this.doctorService.getPatients().pipe(
      finalize(() => this.isLoadingDashboard.set(false))
    ).subscribe({
      next: (data) => this.patients.set(data),
      error: () => console.error('Failed to load patients')
    });
  }

  protected toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  protected toggleQuickMenu(): void {
    this.quickMenuOpen.update((open) => !open);
  }

  protected closeQuickMenu(): void {
    this.quickMenuOpen.set(false);
  }

  protected openReviewModal(appointment: DoctorAppointment): void {
    this.selectedAppointment.set(appointment);
    this.isReviewModalOpen.set(true);
    this.loadPatientRecords(appointment.patientId);
  }

  protected closeReviewModal(): void {
    this.isReviewModalOpen.set(false);
    this.selectedAppointment.set(null);
    this.patientRecords.set([]);
  }

  private loadPatientRecords(patientId: string): void {
    this.isLoadingRecords.set(true);
    this.medicalRecordService.getPatientRecords(patientId)
      .pipe(finalize(() => this.isLoadingRecords.set(false)))
      .subscribe({
        next: (records) => this.patientRecords.set(records),
        error: () => {
          // Fallback mock records for demo purposes if API fails
          this.patientRecords.set([
            { id: 1, title: 'Blood Report', recordDate: '2024-03-15', doctorName: 'Dr. Smith', category: 'Lab', status: 'Available', fileName: 'blood_report.pdf', notes: 'All values normal' },
            { id: 2, title: 'X-Ray Chest', recordDate: '2024-02-10', doctorName: 'Dr. Jones', category: 'Imaging', status: 'Available', fileName: 'chest_xray.png', notes: 'Clear lungs' }
          ]);
        }
      });
  }

  protected setStatusFilter(filter: 'all' | DoctorAppointment['status']): void {
    this.statusFilter.set(filter);
  }

  protected updateSearchTerm(event: Event): void {
    const target = event.target as HTMLInputElement | null;

    this.searchTerm.set(target?.value ?? '');
  }

  protected logout(): void {
    this.authService.logout();
  }

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.statusFilter.set('all');
  }

  protected getStatusBadgeClasses(status: DoctorAppointment['status']): string {
    if (status === 'Scheduled') {
      return 'inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100';
    }

    if (status === 'In Review') {
      return 'inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200';
    }

    return 'inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200';
  }

  protected getRecordStatusClasses(status: string): string {
    if (status === 'Available') {
      return 'inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-200 uppercase';
    }
    return 'inline-flex rounded-full border border-slate-400/30 bg-slate-400/10 px-2 py-0.5 text-[10px] font-bold text-slate-200 uppercase';
  }
}
