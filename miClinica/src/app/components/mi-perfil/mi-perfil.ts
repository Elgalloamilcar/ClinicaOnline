import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase';
import { Perfil } from '../../interfaces/perfil';
import { Router, RouterLink } from '@angular/router';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule, 
    MatDividerModule, MatChipsModule
  ],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.scss'
})
export class MiPerfil implements OnInit {
  private auth = inject(SupabaseService);
  private router = inject(Router);

  perfil: Perfil | null = null;
  horarios: any[] = []; // Para mostrar resumen si es médico

  async ngOnInit() {
    this.perfil = this.auth.perfil();
    
    // Si es especialista, cargamos un resumen de sus horarios
    if (this.perfil?.rol === 'especialista') {
      const { data } = await this.auth.getHorariosEspecialista(this.perfil.id);
      this.horarios = data || [];
    }
  }

  esEspecialista() {
    return this.perfil?.rol === 'especialista';
  }

  esPaciente() {
    return this.perfil?.rol === 'paciente';
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
