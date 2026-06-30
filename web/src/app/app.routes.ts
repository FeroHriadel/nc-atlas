import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home.page';
import { AdminPage } from './pages/admin/admin.page';
import { AdminSightsPage } from './pages/admin-sights/admin-sights.page';
import { adminGuard } from './auth/admin.guard';

export const routes: Routes = [
    { path: '', component: HomePage },
    { path: 'admin/dashboard', component: AdminPage, canActivate: [adminGuard] },
    { path: 'admin/sights', component: AdminSightsPage, canActivate: [adminGuard] },
];
