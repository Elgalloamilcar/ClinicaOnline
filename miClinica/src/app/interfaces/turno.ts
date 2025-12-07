export type EstadoTurno = 'pendiente' | 'aceptado' | 'rechazado' | 'realizado' | 'cancelado';

export interface Turno {
  id?: number; // Opcional al crear (la base de datos lo genera)
  paciente_id: string;
  especialista_id: string;
  especialidad: string;
  fecha_hora: Date | string; // Puede ser objeto Date o string ISO de la BD
  estado: EstadoTurno;
  
  // Datos opcionales (se llenan a medida que avanza el turno)
  comentario_cancelacion?: string;
  comentario_rechazo?: string;
  resena_especialista?: string;
  resena_paciente?: string;
  calificacion_atencion?: number;
  encuesta?: any; // JSON con datos de la encuesta
  
  // Campos extra para cuando hacemos "joins" (traer nombres en vez de IDs)
  paciente?: any;     
  especialista?: any; 
}

export interface Disponibilidad {
  id?: number;
  especialista_id: string;
  especialidad: string;
  dia: string;       // Ej: 'Lunes', 'Martes'
  hora_inicio: number; // Ej: 8
  hora_fin: number;    // Ej: 14
}