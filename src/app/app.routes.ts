import { Routes } from '@angular/router';
import { adminGuard } from './application/guards/auth.guard';
import { AdminPageComponent } from './pages/admin-page/admin-page.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { PaymentReturnPageComponent } from './pages/payment-return-page/payment-return-page.component';
import { WeddingPageComponent } from './pages/wedding-page/wedding-page.component';

export const routes: Routes = [
  { path: '', component: WeddingPageComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'admin', component: AdminPageComponent, canActivate: [adminGuard] },
  { path: 'pagamento/sucesso', component: PaymentReturnPageComponent, data: { result: 'success' } },
  { path: 'pagamento/pendente', component: PaymentReturnPageComponent, data: { result: 'pending' } },
  { path: 'pagamento/falha', component: PaymentReturnPageComponent, data: { result: 'failure' } },
  { path: '**', redirectTo: '' }
];
