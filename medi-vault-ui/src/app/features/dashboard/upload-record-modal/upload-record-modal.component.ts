import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MedicalRecordUpload } from '../../../core/models/medical-record.model';

@Component({
  selector: 'app-upload-record-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './upload-record-modal.component.html',
  styleUrl: './upload-record-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadRecordModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly allowedMimeTypes = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]);
  private readonly allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'gif'];

  readonly open = input(false);
  readonly uploadProgress = input<number | null>(null);
  readonly closed = output<void>();
  readonly submitted = output<MedicalRecordUpload>();

  protected readonly selectedFile = signal<File | null>(null);
  protected readonly fileName = signal('No file selected');
  protected readonly fileErrorMessage = signal<string | null>(null);

  protected readonly uploadForm = this.fb.nonNullable.group({
    notes: ['', [Validators.required, Validators.minLength(8)]]
  });

  constructor() {
    effect(() => {
      if (!this.open()) {
        this.uploadForm.reset({ notes: '' });
        this.selectedFile.set(null);
        this.fileName.set('No file selected');
        this.fileErrorMessage.set(null);
      }
    });
  }

  protected onFileSelected(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.[0] ?? null;

    this.fileErrorMessage.set(null);
    this.selectedFile.set(file);
    this.fileName.set(file?.name ?? 'No file selected');

    if (!file) {
      return;
    }

    if (!this.isAllowedFile(file)) {
      this.selectedFile.set(null);
      this.fileName.set('No file selected');
      this.fileErrorMessage.set('Unsupported file type. Use PDF, JPG, PNG, WEBP, or GIF.');

      inputElement.value = '';
    }
  }

  protected close(): void {
    this.closed.emit();
  }

  protected submit(): void {
    this.uploadForm.markAllAsTouched();

    const selectedFile = this.selectedFile();

    if (this.uploadForm.invalid || !selectedFile) {
      return;
    }

    this.submitted.emit({
      file: selectedFile,
      notes: this.uploadForm.controls.notes.value
    });
  }

  protected clearFileError(): void {
    this.fileErrorMessage.set(null);
  }

  protected get notesInvalid(): boolean {
    const control = this.uploadForm.controls.notes;

    return control.touched && control.invalid;
  }

  private isAllowedFile(file: File): boolean {
    if (this.allowedMimeTypes.has(file.type)) {
      return true;
    }

    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';

    return this.allowedExtensions.includes(extension);
  }
}
