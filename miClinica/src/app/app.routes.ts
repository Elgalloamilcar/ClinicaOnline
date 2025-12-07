import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Login } from './components/login/login';
import { Registro } from './components/registro/registro';
import { Dashboard } from './components/dashboard/dashboard';
import {Usuarios} from './components/usuarios/usuarios';
import {RegistroAdmin} from './components/registro-admin/registro-admin';
import { MisHorarios } from './components/mis-horarios/mis-horarios';
import { SolicitarTurno } from './components/solicitar-turno/solicitar-turno';
import {MiPerfil} from './components/mi-perfil/mi-perfil';



export const routes: Routes = [
  { path: '',
    redirectTo: 'home',
    pathMatch: 'full'},
  { path: 'home', component: Home },
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: 'dashboard', component: Dashboard },
  {path: 'mis-horarios', component: MisHorarios},
  {path: 'mi-perfil', component: MiPerfil},
  {path: 'solicitar-turno', component: SolicitarTurno},
  {path: 'usuarios', component: Usuarios},
  {path: 'usuarios/nuevo', component: RegistroAdmin},
  { path: '**', redirectTo: '' }
];