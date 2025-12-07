import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Perfil } from '../interfaces/perfil';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;
  
  user = signal<User | null>(null);
  perfil = signal<Perfil | null>(null);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    
    // Inicializar sesión
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      this.handleAuthChange(session);
    });

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.handleAuthChange(session);
    });
  }

  private async handleAuthChange(session: Session | null) {
    const user = session?.user ?? null;
    this.user.set(user);
    if (user) {
      const { data } = await this.supabase
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      this.perfil.set(data as Perfil);
    } else {
      this.perfil.set(null);
    }
  }

  // --- MÉTODOS DE AUTH & REGISTRO ---

  async login(email: string, pass: string) {
    // 1. Intentamos loguear con Supabase Auth
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password: pass });
    
    if (error) throw error;
    if (!data.user) throw new Error('No se pudo obtener el usuario');

    // 2. Buscamos el perfil en la base de datos para ver si está habilitado
    const { data: perfil, error: perfilError } = await this.supabase
      .from('perfiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (perfilError) throw perfilError;

    // 1. SEGURIDAD ANTI-ERROR (Esto es lo que te falta)
    // Si perfil es null (no existe), cortamos aquí para que no explote abajo
    if (!perfil) {
      await this.logout();
      throw new Error('El usuario existe pero no tiene perfil. Regístrate nuevamente.');
    }

    // 2. VALIDACIÓN CRÍTICA DEL SPRINT
    // Ahora sí es seguro leer perfil['rol'] porque ya sabemos que no es null
    if (perfil['rol'] === 'especialista' && !perfil['cuenta_habilitada']) {
      await this.logout(); 
      throw new Error('Tu cuenta aún no ha sido aprobada por un administrador.');
    }

    // Opcional: Validación de email verificado para pacientes (si activaste confirmación de email en Supabase)
    /*
    if (perfil['rol'] === 'paciente' && !data.user.email_confirmed_at) {
       await this.logout();
       throw new Error('Debes verificar tu correo electrónico para ingresar.');
    }
    */

    return { data, error: null };
  }

  async logout() {
    await this.supabase.auth.signOut();
    this.user.set(null);
    this.perfil.set(null);
  }

  // src/app/services/supabase.service.ts

  async registro(email: string, pass: string, datos: Omit<Perfil, 'id'>) {
    // 1. Crear usuario en Auth
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
      email,
      password: pass,
      options: { data: { nombre: datos.nombre, rol: datos.rol } } 
    });

    if (authError || !authData.user) throw authError;

    // 2. Insertar en la tabla Perfiles
    const { error: dbError } = await this.supabase.from('perfiles').insert({
      id: authData.user.id,
      email: email,
      nombre: datos.nombre,
      apellido: datos.apellido,
      dni: datos.dni,
      edad: datos.edad,
      rol: datos.rol,
      obra_social: datos.obra_social || null,
      especialidad: datos.especialidad || null,
      imagenes: datos.imagenes || [],
      foto_url: datos.imagenes?.[0] || '',
      // IMPORTANTE: Forzamos esto para evitar problemas con el trigger por ahora
      cuenta_habilitada: datos.rol === 'paciente' ? true : false 
    });

    // --- CORRECCIÓN AQUÍ ---
    // Si hubo error al guardar los datos, BORRAMOS el usuario de Auth para no dejar "zombies"
    // y lanzamos el error para que lo veas en pantalla.
    if (dbError) {
      console.error('Error Base de Datos:', dbError); // Míralo en F12 si quieres más detalles
      await this.supabase.auth.signOut(); // Cerramos sesión por si acaso
      throw new Error('Error guardando perfil: ' + dbError.message);
    }

    return { authData, dbError: null };
  }
  

  // --- MÉTODOS DE STORAGE (IMÁGENES) ---

  async subirImagen(archivo: File): Promise<string | null> {
    try {
      const filePath = `perfiles/${Date.now()}_${archivo.name}`;
      const { data, error } = await this.supabase.storage
        .from('usuarios') // Asegúrate de haber creado este bucket en Supabase
        .upload(filePath, archivo);

      if (error) throw error;

      // Obtener URL pública
      const { data: urlData } = this.supabase.storage
        .from('usuarios')
        .getPublicUrl(filePath);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      return null;
    }
  }

  // --- MÉTODOS DE ESPECIALIDADES ---

  async getEspecialidades() {
    return this.supabase.from('especialidades').select('*').order('nombre');
  }

  async agregarEspecialidad(nombre: string) {
    return this.supabase.from('especialidades').insert({ nombre }).select();
  }
  // --- MÉTODOS PARA TURNOS (SPRINT 2) ---

  // Obtener usuarios que sean especialistas (y opcionalmente de una especialidad)
  async getEspecialistas(especialidad?: string) {
    let query = this.supabase
      .from('perfiles')
      .select('*')
      .eq('rol', 'especialista')
      .eq('cuenta_habilitada', true); // Solo los aprobados

    if (especialidad) {
      // Nota: Si 'especialidad' en BD es un string único, usamos eq. 
      // Si cambiaste a array, usarías .contains. Asumo string simple por ahora.
      query = query.eq('especialidad', especialidad);
    }

    return query;
  }

  // Traer los horarios de trabajo de un médico
  async getHorariosEspecialista(uid: string) {
    return this.supabase
      .from('horarios_especialistas')
      .select('*')
      .eq('especialista_id', uid);
  }

  // Traer los turnos YA ocupados de un médico en una fecha futura
  async getTurnosOcupados(uid: string) {
    const hoy = new Date().toISOString();
    return this.supabase
      .from('turnos')
      .select('fecha_hora')
      .eq('especialista_id', uid)
      .gt('fecha_hora', hoy); // Solo futuros
  }

  // Traer todos los pacientes (Solo para uso del Admin)
  async getPacientes() {
    return this.supabase
      .from('perfiles')
      .select('*')
      .eq('rol', 'paciente');
  }

  // Guardar el nuevo turno
  async crearTurno(turno: any) {
    return this.supabase.from('turnos').insert(turno);
  }
}
