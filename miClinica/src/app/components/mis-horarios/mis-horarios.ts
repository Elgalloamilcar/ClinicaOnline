import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SupabaseService } from '../../services/supabase';
import { Disponibilidad } from '../../interfaces/turno'; // Asegúrate de crear este archivo

// Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-mis-horarios',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    MatCardModule, MatFormFieldModule, MatSelectModule, MatInputModule,
    MatButtonModule, MatIconModule, MatChipsModule, MatSnackBarModule
  ],
  templateUrl: './mis-horarios.html',
  styleUrl: './mis-horarios.scss'
})
export class MisHorarios implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(SupabaseService);
  private snackBar = inject(MatSnackBar);

  form: FormGroup;
  diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  especialidadesUsuario: string[] = []; // Las especialidades que tiene ESTE médico
  horariosGuardados: Disponibilidad[] = [];
  
  constructor() {
    this.form = this.fb.group({
      especialidad: ['', Validators.required],
      dia: ['', Validators.required],
      horaInicio: [8, [Validators.required, Validators.min(8), Validators.max(18)]],
      horaFin: [12, [Validators.required, Validators.min(9), Validators.max(19)]]
    });
  }

  async ngOnInit() {
    const perfil = this.auth.perfil();
    
    if (perfil) {
      // Si el médico tiene una sola especialidad guardada como string, la convertimos a array
      // Si en tu BD 'especialidad' es un solo string, úsalo directo.
      // Si tienes un array de especialidades, adáptalo aquí.
      this.especialidadesUsuario = perfil.especialidad ? [perfil.especialidad] : [];
      
      this.cargarHorarios();
    }
  }

  async cargarHorarios() {
    const uid = this.auth.user()?.id;
    if (!uid) return;

    const { data } = await this.auth['supabase']
      .from('horarios_especialistas')
      .select('*')
      .eq('especialista_id', uid);
      
    this.horariosGuardados = data || [];
  }

  async guardarHorario() {
    if (this.form.invalid) return;
    
    const val = this.form.value;
    if (val.horaInicio >= val.horaFin) {
      this.snackBar.open('La hora de fin debe ser mayor a la de inicio', 'Cerrar');
      return;
    }

    const nuevoHorario = {
      especialista_id: this.auth.user()?.id,
      especialidad: val.especialidad,
      dia: val.dia,
      hora_inicio: val.horaInicio,
      hora_fin: val.horaFin
    };

    const { error } = await this.auth['supabase']
      .from('horarios_especialistas')
      .insert(nuevoHorario);

    if (error) {
      this.snackBar.open('Error al guardar horario: ' + error.message, 'Cerrar');
    } else {
      this.snackBar.open('Horario agregado correctamente', 'OK', { duration: 3000 });
      this.cargarHorarios();
    }
  }

  async borrarHorario(id: number) {
    const { error } = await this.auth['supabase']
      .from('horarios_especialistas')
      .delete()
      .eq('id', id);

    if (!error) this.cargarHorarios();
  }
}

