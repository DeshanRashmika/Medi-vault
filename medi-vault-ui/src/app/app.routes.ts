import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
	{
		path: 'login',
		loadComponent: () => import('./features/auth/login/login.component').then((module) => module.LoginComponent)
	},
	{
		path: 'dashboard',
		canActivate: [authGuard],
		loadComponent: () =>
			import('./features/dashboard/patient-dashboard/patient-dashboard.component').then(
				(module) => module.PatientDashboardComponent
			)
	},
	{
		path: 'doctor-dashboard',
		canActivate: [authGuard],
		loadComponent: () =>
			import('./features/dashboard/doctor-dashboard/doctor-dashboard.component').then(
				(module) => module.DoctorDashboardComponent
			)
	},
	{
		path: 'admin-dashboard',
		canActivate: [authGuard],
		loadComponent: () =>
			import('./features/dashboard/admin-dashboard/admin-dashboard.component').then(
				(module) => module.AdminDashboardComponent
			)
	},
	{
		path: 'pharmacist-dashboard',
		canActivate: [authGuard],
		loadComponent: () =>
			import('./features/dashboard/pharmacist-dashboard/pharmacist-dashboard.component').then(
				(module) => module.PharmacistDashboardComponent
			)
	},
	{
		path: 'nurse-dashboard',
		canActivate: [authGuard],
		loadComponent: () =>
			import('./features/dashboard/nurse-dashboard/nurse-dashboard.component').then(
				(module) => module.NurseDashboardComponent
			)
	},
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'login'
	},
	{
		path: '**',
		redirectTo: 'login'
	}
];
