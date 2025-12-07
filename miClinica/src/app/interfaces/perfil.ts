// src/app/interfaces/perfil.ts

export type TipoUsuario = 'paciente' | 'especialista' | 'administrador';

export interface Perfil {
  id: string;          // Supabase lo genera, por eso lo omitimos en el registro
  nombre: string;      // <--- Si esto falta, TypeScript da el error que tienes
  apellido: string;
  edad: number;
  dni: string;
  rol: TipoUsuario;
  email: string;
  imagenes?: string []; 
  foto_url?: string;

  
  obra_social: string;

  especialidad?: string;
  cuenta_habilitada?: boolean;

}