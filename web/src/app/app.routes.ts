import { Routes } from '@angular/router';
import { adminGuard } from './auth/admin.guard';
import { HomePage } from './pages/home/home.page';
import { AdminPage } from './pages/admin/admin.page';
import { AdminSightsPage } from './pages/admin-sights/admin-sights.page';
import { AdminCategoriesPage } from './pages/admin-categories/admin-categories.page';
import { AdminTagsPage } from './pages/admin-tags/admin-tags.page';
import { AdminUsersPage } from './pages/admin-users/admin-users.page';
import { MyAccountPage } from './pages/my-account/my-account.page';
import { SightsPage } from './pages/sights/sights.page';
import { SightDetailPage } from './pages/sight-detail/sight-detail.page';

export const routes: Routes = [
    { path: '', component: HomePage },
    { path: 'admin/dashboard', component: AdminPage, canActivate: [adminGuard] },
    { path: 'admin/sights', component: AdminSightsPage, canActivate: [adminGuard] },
    { path: 'admin/categories', component: AdminCategoriesPage, canActivate: [adminGuard] },
    { path: 'admin/tags', component: AdminTagsPage, canActivate: [adminGuard] },
    { path: 'admin/users', component: AdminUsersPage, canActivate: [adminGuard] },
    { path: 'myaccount', component: MyAccountPage },
    { path: 'sights', component: SightsPage },
    { path: 'sights/:sightId', component: SightDetailPage },
];
