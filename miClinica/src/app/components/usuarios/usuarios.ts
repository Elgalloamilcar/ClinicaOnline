import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase';
import { Perfil } from '../../interfaces/perfil';

// Angular Material Imports
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss'
})
export class Usuarios implements OnInit {
  private auth = inject(SupabaseService);
  private snackBar = inject(MatSnackBar);

  usuarios: Perfil[] = [];
  displayedColumns: string[] = ['nombre', 'rol', 'edad', 'habilitado', 'acciones'];

  async ngOnInit() {
    this.cargarUsuarios();
  }

  async cargarUsuarios() {
    // Traemos todos los perfiles de la base de datos
    const { data, error } = await this.auth['supabase']
      .from('perfiles')
      .select('*')
      .order('rol', { ascending: true }); // Ordenamos para ver especialistas juntos

    if (data) {
      this.usuarios = data;
    }
  }

  // Función para habilitar/inhabilitar especialistas
  async toggleHabilitar(usuario: Perfil) {
    const estadoOriginal = usuario.cuenta_habilitada; // Guardamos el estado anterior
    const nuevoEstado = !estadoOriginal;
    usuario.cuenta_habilitada = nuevoEstado;

    const { error } = await this.auth['supabase']
      .from('perfiles')
      .update({ cuenta_habilitada: nuevoEstado })
      .eq('id', usuario.id);

    if (error) {
      // 3. SI FALLA: Revertimos el cambio visual y mostramos error
      console.error('Error al actualizar permisos:', error.message); // <--- MIRA ESTO EN CONSOLA
      
      usuario.cuenta_habilitada = estadoOriginal; // Vuelve atrás el switch
      this.snackBar.open('Error: No tienes permiso para editar este usuario.', 'Cerrar', {
        panelClass: ['error-snackbar']
      });
    } else {
      this.snackBar.open(
        `Usuario ${nuevoEstado ? 'HABILITADO' : 'BLOQUEADO'} correctamente`, 
        'OK', { duration: 2000 }
      );
    }
  }
}
