import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase';

// --- ANGULAR MATERIAL IMPORTS ---
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    //RouterOutlet, // Por si quieres rutas hijas a futuro
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatCardModule,
    MatMenuModule,
    MatBadgeModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  private auth = inject(SupabaseService);
  private router = inject(Router);

  // Signal computada para obtener el perfil actual
  perfil = computed(() => this.auth.perfil());
  
  // Estado del sidebar en móvil
  isMobile = false; // Podrías usar BreakpointObserver para esto

  esAdmin() {
    return this.perfil()?.rol === 'administrador';
  }

  esEspecialista() {
    return this.perfil()?.rol === 'especialista';
  }

  async logout() {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}