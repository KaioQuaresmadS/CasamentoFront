import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthApiService } from '../../application/api/auth-api.service';
import { GiftApiService } from '../../application/api/gift-api.service';
import { RsvpApiService } from '../../application/api/rsvp-api.service';
import { Gift, GiftUpsertRequest } from '../../domain/models/gift.model';

type AdminGiftForm = GiftUpsertRequest;
type FeedbackType = 'error' | 'success';

interface FeedbackModal {
  type: FeedbackType;
  title: string;
  message: string;
}

interface ProblemDetails {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const GIFT_IMAGE_SIZE = 300;

const EMPTY_FORM: AdminGiftForm = {
  name: '',
  description: '',
  imageUrl: '',
  price: 0,
  reservedPercent: 0
};

@Component({
  selector: 'app-admin-page',
  imports: [CurrencyPipe, FormsModule, RouterLink],
  templateUrl: './admin-page.component.html',
  styleUrl: './admin-page.component.scss'
})
export class AdminPageComponent implements OnInit {
  private readonly authService = inject(AuthApiService);
  private readonly giftService = inject(GiftApiService);
  private readonly rsvpService = inject(RsvpApiService);
  private readonly router = inject(Router);

  protected readonly user = this.authService.user;
  protected readonly gifts = signal<Gift[]>([]);
  protected readonly selectedGiftId = signal<string | null>(null);
  protected readonly form = signal<AdminGiftForm>({ ...EMPTY_FORM });
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly isExporting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly today = new Date();
  protected readonly isEditing = computed(() => this.selectedGiftId() !== null);
  protected readonly feedbackModal = computed<FeedbackModal | null>(() => {
    const error = this.errorMessage();
    const success = this.successMessage();

    if (error) {
      return {
        type: 'error',
        title: 'Algo precisa de ajuste',
        message: error
      };
    }

    if (success) {
      return {
        type: 'success',
        title: 'Tudo certo',
        message: success
      };
    }

    return null;
  });

  ngOnInit(): void {
    this.loadGifts();
  }

  protected loadGifts(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.giftService.listActive().subscribe({
      next: (gifts) => {
        this.gifts.set(gifts);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(this.readErrorMessage(error));
        this.isLoading.set(false);
      }
    });
  }

  protected editGift(gift: Gift): void {
    this.selectedGiftId.set(gift.id);
    this.form.set(this.giftService.toRequest(gift));
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  protected updateForm<K extends keyof AdminGiftForm>(field: K, value: AdminGiftForm[K]): void {
    this.form.update((current) => ({
      ...current,
      [field]: value
    }));
  }

  protected async updateGiftImage(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const validationMessage = this.validateImageFile(file);

    if (validationMessage) {
      input.value = '';
      this.errorMessage.set(validationMessage);
      return;
    }

    try {
      const imageUrl = await this.resizeImage(file);
      this.updateForm('imageUrl', imageUrl);
      this.errorMessage.set('');
    } catch {
      input.value = '';
      this.errorMessage.set('Nao foi possivel processar a imagem enviada.');
    }
  }

  protected newGift(): void {
    this.selectedGiftId.set(null);
    this.form.set({ ...EMPTY_FORM });
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  protected saveGift(): void {
    const request = this.normalizeForm(this.form());
    const validationMessage = this.validate(request);

    if (validationMessage) {
      this.errorMessage.set(validationMessage);
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const selectedId = this.selectedGiftId();
    const operation = selectedId
      ? this.giftService.update(selectedId, request)
      : this.giftService.create(request);

    operation.subscribe({
      next: () => {
        this.newGift();
        this.successMessage.set(selectedId ? 'Presente atualizado.' : 'Presente criado.');
        this.loadGifts();
        this.isSaving.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(this.readErrorMessage(error));
        this.isSaving.set(false);
      }
    });
  }

  protected removeGift(gift: Gift): void {
    const confirmed = window.confirm(`Remover o presente "${gift.name}"?`);

    if (!confirmed) {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');

    this.giftService.delete(gift.id).subscribe({
      next: () => {
        if (this.selectedGiftId() === gift.id) {
          this.selectedGiftId.set(null);
          this.form.set({ ...EMPTY_FORM });
        }
        this.successMessage.set('Presente removido.');
        this.loadGifts();
      },
      error: (error: unknown) => this.errorMessage.set(this.readErrorMessage(error))
    });
  }

  protected exportGuests(): void {
    this.isExporting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.rsvpService.exportGuests().subscribe({
      next: (blob) => {
        const fileName = `convidados_${this.formatExportDate(new Date())}.xlsx`;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);

        this.successMessage.set('Exportacao iniciada.');
        this.isExporting.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(this.readErrorMessage(error));
        this.isExporting.set(false);
      }
    });
  }

  protected logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/');
  }

  protected closeFeedback(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  private normalizeForm(form: AdminGiftForm): AdminGiftForm {
    return {
      name: form.name.trim(),
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
      price: Number(form.price),
      reservedPercent: Number(form.reservedPercent)
    };
  }

  private validate(form: AdminGiftForm): string {
    if (!form.name || !form.description || !form.imageUrl) {
      return 'Preencha nome, descricao e imagem.';
    }

    if (!this.isHttpUrl(form.imageUrl) && !this.isDataImageUrl(form.imageUrl)) {
      return 'Use um link de imagem valido ou envie uma imagem pelo cadastro.';
    }

    if (!Number.isFinite(form.price) || form.price <= 0) {
      return 'O preco precisa ser maior que zero.';
    }

    if (!Number.isFinite(form.reservedPercent) || form.reservedPercent < 0 || form.reservedPercent > 100) {
      return 'O percentual reservado precisa ficar entre 0 e 100.';
    }

    return '';
  }

  private isHttpUrl(value: string): boolean {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private isDataImageUrl(value: string): boolean {
    return /^data:image\/(jpeg|png|webp);base64,/i.test(value);
  }

  private validateImageFile(file: File): string {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension || !ACCEPTED_IMAGE_EXTENSIONS.includes(extension) || !ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return 'Envie uma imagem nos formatos jpg, jpeg, png ou webp.';
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return 'A imagem deve ter no maximo 5MB.';
    }

    return '';
  }

  private async resizeImage(file: File): Promise<string> {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      bitmap.close();
      throw new Error('Canvas indisponivel.');
    }

    canvas.width = GIFT_IMAGE_SIZE;
    canvas.height = GIFT_IMAGE_SIZE;
    context.clearRect(0, 0, GIFT_IMAGE_SIZE, GIFT_IMAGE_SIZE);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    const scale = Math.min(1, GIFT_IMAGE_SIZE / bitmap.width, GIFT_IMAGE_SIZE / bitmap.height);
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const x = Math.round((GIFT_IMAGE_SIZE - width) / 2);
    const y = Math.round((GIFT_IMAGE_SIZE - height) / 2);

    context.drawImage(bitmap, x, y, width, height);
    bitmap.close();

    return canvas.toDataURL('image/webp', 0.9);
  }

  private readErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const problem = error.error as ProblemDetails | null;
      const validationErrors = problem?.errors ? Object.values(problem.errors).flat() : [];
      return validationErrors[0] ?? problem?.detail ?? problem?.title ?? 'Nao foi possivel concluir a operacao.';
    }

    return 'Nao foi possivel concluir a operacao.';
  }

  private formatExportDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}${month}${day}`;
  }
}
