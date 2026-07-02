import { Routes } from '@angular/router';
import { adminGuard } from './auth/admin.guard';
import { HomePage } from './pages/home/home.page';
import { AdminPage } from './pages/admin/admin.page';
import { AdminSightsPage } from './pages/admin-sights/admin-sights.page';
import { AdminCategoriesPage } from './pages/admin-categories/admin-categories.page';
import { AdminTagsPage } from './pages/admin-tags/admin-tags.page';

export const routes: Routes = [
    { path: '', component: HomePage },
    { path: 'admin/dashboard', component: AdminPage, canActivate: [adminGuard] },
    { path: 'admin/sights', component: AdminSightsPage, canActivate: [adminGuard] },
    { path: 'admin/categories', component: AdminCategoriesPage, canActivate: [adminGuard] },
    { path: 'admin/tags', component: AdminTagsPage, canActivate: [adminGuard] },
];
