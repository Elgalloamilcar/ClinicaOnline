import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase';
import { Router } from '@angular/router';
import { SpinnerService } from '../../services/spinner';

// Interfaces
import { Perfil } from '../../interfaces/perfil';
import { Disponibilidad } from '../../interfaces/turno';

// Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatListModule } from '@angular/material/list';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-solicitar-turno',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatStepperModule, MatListModule, MatRadioModule, MatSnackBarModule
  ],
  templateUrl: './solicitar-turno.html',
  styleUrl: './solicitar-turno.scss'
})
export class SolicitarTurno implements OnInit {
  private auth = inject(SupabaseService);
  private router = inject(Router);
  private spinner = inject(SpinnerService);
  private snackBar = inject(MatSnackBar);

  perfilActual: Perfil | null = null;
  esAdmin = false;
  pasoActual = 0; 
  
  especialidades: string[] = [];
  especialistasFiltrados: Perfil[] = [];
  pacientes: Perfil[] = []; 
  
  especialidadSeleccionada: string = '';
  especialistaSeleccionado: Perfil | null = null;
  pacienteSeleccionado: Perfil | null = null;
  turnoSeleccionado: Date | null = null;

  diasDisponibles: any[] = []; 

  async ngOnInit() {
    this.spinner.show();
    this.perfilActual = this.auth.perfil();
    this.esAdmin = this.perfilActual?.rol === 'administrador';

    const { data: espData } = await this.auth.getEspecialidades();
    if (espData) {
      this.especialidades = espData.map((e: any) => e.nombre);
    }

    if (this.esAdmin) {
      const { data: pacData } = await this.auth.getPacientes();
      this.pacientes = pacData || [];
    } else {
      this.pacienteSeleccionado = this.perfilActual;
    }
    
    this.spinner.hide();
  }

  async seleccionarEspecialidad(esp: string) {
    this.especialidadSeleccionada = esp;
    this.spinner.show();
    const { data } = await this.auth.getEspecialistas(esp);
    this.especialistasFiltrados = data || [];
    this.pasoActual = 1; 
    this.spinner.hide();
  }

  async seleccionarEspecialista(medico: Perfil) {
    this.especialistaSeleccionado = medico;
    this.spinner.show();

    // Traemos horarios y ocupados
    const horarios = await this.auth.getHorariosEspecialista(medico.id);
    const ocupados = await this.auth.getTurnosOcupados(medico.id);

    console.log('Horarios RAW:', horarios.data); // DEBUG

    this.generarTurnosDisponibles(horarios.data || [], ocupados.data || []);

    this.pasoActual = 2; 
    this.spinner.hide();
  }

  // --- HELPER PARA IGNORAR ACENTOS Y MAYUSCULAS ---
  normalizarTexto(texto: string): string {
    if (!texto) return '';
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  }

  // --- LÓGICA CORREGIDA PARA COMPARACIÓN DE TEXTO ---
  generarTurnosDisponibles(horariosBase: Disponibilidad[], turnosOcupados: any[]) {
    this.diasDisponibles = [];
    const hoy = new Date();
    
    // Normalizamos la especialidad seleccionada (sin tildes)
    const espBuscada = this.normalizarTexto(this.especialidadSeleccionada);

    console.log('Buscando horarios para especialidad:', espBuscada);

    // Recorrer próximos 15 días
    for (let i = 0; i < 15; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      
      const nombreDia = this.traducirDia(fecha.getDay()); // Obtiene 'Lunes', 'Martes'...
      const nombreDiaNorm = this.normalizarTexto(nombreDia);
      
      // Buscamos si existe horario para este día y especialidad
      // AHORA COMPARAMOS TEXTOS NORMALIZADOS (SIN TILDES)
      const horarioDelDia = horariosBase.find(h => 
        this.normalizarTexto(h.dia) === nombreDiaNorm && 
        this.normalizarTexto(h.especialidad) === espBuscada
      );

      if (horarioDelDia) {
        console.log(`¡Horario encontrado para ${nombreDia}!`, horarioDelDia);
        const turnosDelDia: Date[] = [];
        
        // Convertimos a número por si viene como string de la BD
        const inicio = Number(horarioDelDia.hora_inicio);
        const fin = Number(horarioDelDia.hora_fin);

        for (let hora = inicio; hora < fin; hora++) {
           // Turno en punto (:00)
           const turnoA = new Date(fecha);
           turnoA.setHours(hora, 0, 0, 0);
           
           // Turno y media (:30)
           const turnoB = new Date(fecha);
           turnoB.setHours(hora, 30, 0, 0);

           if (turnoA > new Date() && !this.estaOcupado(turnoA, turnosOcupados)) {
             turnosDelDia.push(turnoA);
           }
           if (turnoB > new Date() && !this.estaOcupado(turnoB, turnosOcupados)) {
             turnosDelDia.push(turnoB);
           }
        }

        if (turnosDelDia.length > 0) {
          this.diasDisponibles.push({
            fecha: fecha,
            turnos: turnosDelDia
          });
        }
      }
    }
  }

  estaOcupado(fecha: Date, ocupados: any[]): boolean {
    return ocupados.some(o => new Date(o.fecha_hora).getTime() === fecha.getTime());
  }

  traducirDia(numDia: number): string {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[numDia];
  }

  seleccionarTurno(fecha: Date) {
    this.turnoSeleccionado = fecha;
    if (this.esAdmin) {
      this.pasoActual = 3;
    } else {
      this.confirmarTurno();
    }
  }

  seleccionarPaciente(paciente: Perfil) {
    this.pacienteSeleccionado = paciente;
    this.confirmarTurno();
  }

  async confirmarTurno() {
    if (!this.pacienteSeleccionado || !this.especialistaSeleccionado || !this.turnoSeleccionado) return;

    this.spinner.show();
    
    const nuevoTurno = {
      paciente_id: this.pacienteSeleccionado.id,
      especialista_id: this.especialistaSeleccionado.id,
      especialidad: this.especialidadSeleccionada,
      fecha_hora: this.turnoSeleccionado.toISOString(),
      estado: 'pendiente'
    };

    const { error } = await this.auth.crearTurno(nuevoTurno);

    this.spinner.hide();

    if (error) {
      this.snackBar.open('Error al solicitar turno', 'Cerrar');
    } else {
      this.snackBar.open('¡Turno reservado con éxito!', 'OK', { duration: 4000 });
      this.router.navigate(['/dashboard']); 
    }
  }

  reset() {
    this.pasoActual = 0;
    this.especialidadSeleccionada = '';
    this.especialistaSeleccionado = null;
    this.turnoSeleccionado = null;
  }
}