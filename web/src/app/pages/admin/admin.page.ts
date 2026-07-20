import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Card } from '../../ncss/cards/card/card.component';



@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrl: './admin.page.css',
  imports: [Card],
})



export class AdminPage {
  private router = inject(Router);

  cards = [
    {
      title: 'Categories',
      subtitle: 'Create, rename and delete the top-level categories used to group Sights (e.g. Nature, Architecture). Changes are reflected immediately across the app.',
      route: '/admin/categories',
    },
    {
      title: 'Tags',
      subtitle: 'Manage the free-form tags that can be attached to any Sight for fine-grained filtering. Add new tags or remove ones that are no longer in use.',
      route: '/admin/tags',
    },
    {
      title: 'Users',
      subtitle: 'View all registered users, invite new ones via Entra ID, change their roles between User and Admin, or remove accounts entirely.',
      route: '/admin/users',
    },
    {
      title: 'Sights',
      subtitle: 'Browse, add, edit and delete Sights — the core content of the app. Assign categories and tags, upload images and manage location data.',
      route: '/admin/sights',
    },
    {
      title: 'Create Sight',
      subtitle: 'Manually add a single new Sight — title, location, category, tags and both 350px/1024px images.',
      route: '/admin/sight-create',
    },
  ];

  navigate = (route: string) => () => this.router.navigate([route]);
}
