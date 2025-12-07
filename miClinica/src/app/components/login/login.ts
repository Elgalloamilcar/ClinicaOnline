import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import {SpinnerService} from '../../services/spinner'

// --- IMPORTS DE ANGULAR MATERIAL ---
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  standalone: true,
  // Aquí declaramos que vamos a usar estos bloques de construcción visuales
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.html', // Enlace al archivo HTML
  styleUrl: './login.scss'      // Enlace al archivo de Estilos
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(SupabaseService);
  private router = inject(Router);
  private spinner = inject(SpinnerService);
  
  // Ocultar/Mostrar contraseña
  hidePassword = true;
  loading = false;
  
  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  async onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.spinner.show();
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { error } = await this.auth.login(
        this.form.value.email, 
        this.form.value.password
      );
      if (error) throw error;
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      // Aquí podrías usar un MatSnackBar (notificación) en lugar de alert
      alert('Error: ' + err.message);
    } finally {
      this.loading = false;
      this.spinner.hide();
    }
  }
}
