import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-registro-admin',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatInputModule, MatButtonModule,
    MatIconModule, MatSelectModule, MatRadioModule,
    MatProgressBarModule, MatSnackBarModule
  ],
  templateUrl: './registro-admin.html',
  styleUrl: './registro-admin.scss'
})
export class RegistroAdmin implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(SupabaseService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  form: FormGroup;
  loading = false;
  especialidades: any[] = [];
  imagen1: File | null = null;

  constructor() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.pattern('^[a-zA-Z ]*$')]],
      apellido: ['', [Validators.required, Validators.pattern('^[a-zA-Z ]*$')]],
      edad: ['', [Validators.required, Validators.min(18)]],
      dni: ['', [Validators.required, Validators.minLength(7)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rol: ['administrador', Validators.required], // Por defecto Admin
      
      // Opcionales
      obraSocial: [''],
      especialidad: ['']
    });
  }

  async ngOnInit() {
    // Cargamos especialidades por si quiere crear un médico
    const { data } = await this.auth.getEspecialidades();
    this.especialidades = data || [];
  }

  onFileSelected(event: any) {
    this.imagen1 = event.target.files[0];
  }

  async onSubmit() {
    if (this.form.invalid) return;
    if (!this.imagen1) {
      this.mostrarMensaje('La imagen de perfil es obligatoria', 'error');
      return;
    }

    this.loading = true;
    const valores = this.form.value;

    try {
      // 1. Subir Imagen
      const urlImagen = await this.auth.subirImagen(this.imagen1);
      if (!urlImagen) throw new Error('Error al subir la imagen');

      // 2. Crear Usuario
      // NOTA: Supabase Auth te loguea automáticamente al crear usuario. 
      // Como somos admin creando otro usuario, esto es un problema técnico.
      // TRUCO: Creamos el usuario y luego "restauramos" la sesión o avisamos.
      // Para este sprint escolar, asumiremos el flujo normal.
      
      await this.auth.registro(
        valores.email,
        valores.password,
        {
          email: valores.email,
          nombre: valores.nombre,
          apellido: valores.apellido,
          dni: valores.dni,
          edad: valores.edad,
          rol: valores.rol,
          obra_social: valores.rol === 'paciente' ? valores.obraSocial : null,
          especialidad: valores.rol === 'especialista' ? valores.especialidad : null,
          imagenes: [urlImagen],
          cuenta_habilitada: true // ¡Los admins nacen habilitados!
        }
      );

      this.mostrarMensaje('Usuario creado con éxito');
      this.router.navigate(['/usuarios']); // Volver a la lista

    } catch (err: any) {
      this.mostrarMensaje(err.message || 'Error al crear usuario', 'error');
    } finally {
      this.loading = false;
    }
  }

  mostrarMensaje(msg: string, tipo: 'success' | 'error' = 'success') {
    this.snackBar.open(msg, 'Cerrar', {
      duration: 4000,
      panelClass: tipo === 'error' ? ['error-snackbar'] : ['success-snackbar']
    });
  }
}
