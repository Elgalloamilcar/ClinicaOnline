import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Login } from './components/login/login';
import { Registro } from './components/registro/registro';
import { Dashboard } from './components/dashboard/dashboard';
import {Usuarios} from './components/usuarios/usuarios';
import {RegistroAdmin} from './components/registro-admin/registro-admin';



export const routes: Routes = [
  { path: '',
    redirectTo: 'home',
    pathMatch: 'full'},
  { path: 'home', component: Home },
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: 'dashboard', component: Dashboard },
  {path: 'usuarios', component: Usuarios},
  {path: 'usuarios/nuevo', component: RegistroAdmin},
  { path: '**', redirectTo: '' }
];