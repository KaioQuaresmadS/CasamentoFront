import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthApiService } from '../../application/api/auth-api.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthApiService);
  private readonly router = inject(Router);

  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  protected submit(): void {
    if (this.form.invalid || this.isLoading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isLoading.set(true);

    this.authService
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => void this.router.navigateByUrl('/admin'),
        error: () => this.errorMessage.set('Login ou senha invalidos.')
      });
  }
}
