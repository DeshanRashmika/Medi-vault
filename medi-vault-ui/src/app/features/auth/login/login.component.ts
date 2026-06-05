import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly isSubmitting = signal(false);
  protected readonly loginError = signal<string | null>(null);
  protected readonly registerError = signal<string | null>(null);
  protected readonly registerSuccess = signal<string | null>(null);
  protected readonly isRegisterMode = signal(false);
  protected readonly passwordVisible = signal(false);
  protected readonly registerPasswordVisible = signal(false);
  protected readonly registerConfirmVisible = signal(false);
  protected readonly hasExistingSession = computed(() => this.authService.isAuthenticated());

  protected readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  protected readonly registerForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(8)]]
  });

  ngOnInit(): void {
    if (this.hasExistingSession()) {
      void this.router.navigateByUrl(this.authService.resolveDashboardRoute(this.authService.currentUser()));
    }
  }

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  protected toggleRegisterPasswordVisibility(): void {
    this.registerPasswordVisible.update((visible) => !visible);
  }

  protected toggleRegisterConfirmVisibility(): void {
    this.registerConfirmVisible.update((visible) => !visible);
  }

  protected setAuthMode(registerMode: boolean): void {
    this.isRegisterMode.set(registerMode);
    this.loginError.set(null);
    this.registerError.set(null);
    this.registerSuccess.set(null);
  }

  protected submit(): void {
    this.loginError.set(null);
    this.registerError.set(null);
    this.registerSuccess.set(null);
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);

    this.authService
      .login(this.loginForm.getRawValue())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (user) => {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
          const targetRoute = returnUrl && returnUrl !== '/dashboard' && returnUrl !== '/doctor-dashboard'
            ? returnUrl
            : this.authService.resolveDashboardRoute(user);

          void this.router.navigateByUrl(targetRoute);
        },
        error: () => {
          this.loginError.set('We could not sign you in. Check your credentials and try again.');
        }
      });
  }

  protected submitRegister(): void {
    this.loginError.set(null);
    this.registerError.set(null);
    this.registerSuccess.set(null);
    this.registerForm.markAllAsTouched();

    if (this.registerForm.invalid || this.isSubmitting()) {
      return;
    }

    const formValue = this.registerForm.getRawValue();

    if (formValue.password !== formValue.confirmPassword) {
      this.registerError.set('Password and confirm password must match.');

      return;
    }

    this.isSubmitting.set(true);

    this.authService
      .register({
        fullName: formValue.fullName,
        email: formValue.email,
        password: formValue.password,
        role: 'PATIENT'
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.registerSuccess.set('Account created successfully. Redirecting to your dashboard...');
          void this.router.navigateByUrl('/dashboard');
        },
        error: () => {
          this.registerError.set('We could not create your account right now. Please try again.');
        }
      });
  }

  protected get emailInvalid(): boolean {
    const control = this.loginForm.controls.email;

    return control.touched && control.invalid;
  }

  protected get passwordInvalid(): boolean {
    const control = this.loginForm.controls.password;

    return control.touched && control.invalid;
  }

  protected get registerNameInvalid(): boolean {
    const control = this.registerForm.controls.fullName;

    return control.touched && control.invalid;
  }

  protected get registerEmailInvalid(): boolean {
    const control = this.registerForm.controls.email;

    return control.touched && control.invalid;
  }

  protected get registerPasswordInvalid(): boolean {
    const control = this.registerForm.controls.password;

    return control.touched && control.invalid;
  }

  protected get registerConfirmInvalid(): boolean {
    const control = this.registerForm.controls.confirmPassword;

    return control.touched && control.invalid;
  }

}
