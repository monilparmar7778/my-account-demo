import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Accountuser } from './accountuser/accountuser';
import { MainChild } from './main-child/main-child';
import { InsertAccount } from './insert-account/insert-account';
import { Createuser } from './createuser/createuser';
import { Accountlaser } from './accountlaser/accountlaser';
import { Laseraccount } from './laseraccount/laseraccount';
import { Givemoney } from './givemoney/givemoney';
import { authGuard } from './auth-guard'; // ✅ Correct import path

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  
  // Protected routes - require authentication
  { 
    path: 'mainchild',    
    component: MainChild,
    canActivate: [authGuard], // Use functional guard
    children: [
      { path: 'account', component: Accountuser, canActivate: [authGuard] },
      { path: 'insertaccount', component: InsertAccount, canActivate: [authGuard] },
      { path: 'create-user', component: Createuser, canActivate: [authGuard] },
      { path: 'laseraccount', component: Laseraccount, canActivate: [authGuard] },
      { path: 'accountlasert', component: Accountlaser, canActivate: [authGuard] },
      { path: 'givemoney', component: Givemoney, canActivate: [authGuard] }
    ]
  },
  
  // Fallback to login
  { path: '**', redirectTo: '/login' }
];