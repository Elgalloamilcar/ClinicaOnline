import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase';
import { MatDividerModule } from '@angular/material/divider';
import {SpinnerService} from '../../services/spinner';
import {Captcha} from '../../components/captcha/captcha';


// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';


@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatInputModule, MatButtonModule,
    MatIconModule, MatRadioModule, MatSelectModule,
    MatProgressBarModule, MatSnackBarModule, MatDividerModule,
    Captcha,
  ],
  templateUrl: './registro.html',
  styleUrl: './registro.scss'
})
export class Registro implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(SupabaseService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private spinner = inject(SpinnerService);



  form: FormGroup;
  hidePassword = true;
  loading = false;

  especialidades: any[] = [];
  
  // Archivos seleccionados
  imagen1: File | null = null;
  imagen2: File | null = null; // Solo para pacientes
  captchaValido: boolean= false;

  constructor() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.pattern('^[a-zA-Z ]*$')]],
      apellido: ['', [Validators.required, Validators.pattern('^[a-zA-Z ]*$')]],
      edad: ['', [Validators.required, Validators.min(18), Validators.max(99)]],
      dni: ['', [Validators.required, Validators.pattern('^[0-9]*$'), Validators.minLength(7)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rol: ['paciente', Validators.required],
      
      // Campos dinámicos (inicialmente vacíos)
      obraSocial: [''],
      especialidad: [''],
      otraEspecialidad: [''] // Input extra si eligen "Otra"
    });
  }

  async ngOnInit() {
    // Cargar especialidades al iniciar
    const { data } = await this.auth.getEspecialidades();
    this.especialidades = data || [];

    // Escuchar cambios en el rol para validar campos
    this.form.get('rol')?.valueChanges.subscribe(rol => {
      this.actualizarValidaciones(rol);
    });
    
    // Iniciar validaciones por defecto
    this.actualizarValidaciones('paciente');
  }
    // <--- 3. FUNCIÓN PARA ESCUCHAR AL CAPTCHA
  resolverCaptcha(esValido: boolean) {
    this.captchaValido = esValido;
  }

  actualizarValidaciones(rol: string) {
    const obraSocialCtrl = this.form.get('obraSocial');
    const especialidadCtrl = this.form.get('especialidad');

    if (rol === 'paciente') {
      obraSocialCtrl?.setValidators([Validators.required]);
      especialidadCtrl?.clearValidators();
    } else {
      obraSocialCtrl?.clearValidators();
      especialidadCtrl?.setValidators([Validators.required]);
    }
    
    obraSocialCtrl?.updateValueAndValidity();
    especialidadCtrl?.updateValueAndValidity();
  }

  // Manejo de Archivos
  onFileSelected(event: any, numero: number) {
    const file = event.target.files[0];
    if (file) {
      if (numero === 1) this.imagen1 = file;
      if (numero === 2) this.imagen2 = file;
    }
  }

  esPaciente() { return this.form.get('rol')?.value === 'paciente'; }
  esEspecialista() { return this.form.get('rol')?.value === 'especialista'; }

  async onSubmit() {
    if (this.form.invalid) return;
     // <--- 4. VALIDACIÓN DE CAPTCHA ANTES DE ENVIAR
    if (!this.captchaValido) {
      this.mostrarError('Debes completar el Captcha correctamente.');
      return;
    }
    
    // Validar imágenes requeridas manualmente
    if (!this.imagen1) {
      this.mostrarError('Debes subir al menos una foto de perfil');
      return;
    }
    if (this.esPaciente() && !this.imagen2) {
      this.mostrarError('Los pacientes deben subir 2 fotos');
      return;
    }

    this.loading = true;
    this.spinner.show();
    const valores = this.form.value;

    try {
      // 1. Manejo de Especialidad (Si agregó una nueva)
      let especialidadFinal = valores.especialidad;
      
      if (this.esEspecialista() && valores.especialidad === 'otra') {
        if (!valores.otraEspecialidad) throw new Error('Debes especificar la especialidad');
        
        // Guardar la nueva especialidad en la BD
        const { data: nuevaEsp } = await this.auth.agregarEspecialidad(valores.otraEspecialidad);
        // Usar el nombre guardado (o el que escribió)
        especialidadFinal = valores.otraEspecialidad; 
      }

      // 2. Subir Imágenes
      const urlsImagenes: string[] = [];
      const url1 = await this.auth.subirImagen(this.imagen1!);
      if (url1) urlsImagenes.push(url1);

      if (this.esPaciente() && this.imagen2) {
        const url2 = await this.auth.subirImagen(this.imagen2!);
        if (url2) urlsImagenes.push(url2);
      }

      // 3. Registrar Usuario
      await this.auth.registro(
        valores.email,
        valores.password,
        {
          nombre: valores.nombre,
          apellido: valores.apellido,
          dni: valores.dni,
          edad: valores.edad,
          rol: valores.rol,
          email: valores.email,
          // Campos opcionales según rol
          obra_social: this.esPaciente() ? valores.obraSocial : undefined,
          especialidad: this.esEspecialista() ? especialidadFinal : undefined,
          imagenes: urlsImagenes
        }
      );

   const mensaje = this.esEspecialista() 
        ? '¡Registro exitoso! Espera aprobación del admin.' 
        : '¡Registro exitoso! Ya puedes ingresar.';

      this.snackBar.open(mensaje, 'OK', { duration: 5000 });
      this.router.navigate(['/login']);

    } catch (err: any) {
      this.mostrarError(err.message || 'Error en el registro');
    } finally {
      this.loading = false;
      this.spinner.hide();

    }
  }

  mostrarError(msg: string) {
    this.snackBar.open(msg, 'Cerrar', { duration: 4000, panelClass: ['error-snackbar'] });
  }
}