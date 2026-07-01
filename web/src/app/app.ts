import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { InteractionStatus } from '@azure/msal-browser';
import { filter, take } from 'rxjs';
import { TopNav, NavLink } from './ncss/navs/topnav/topnav.component';
import { Container } from './ncss/layout/container/container.component';
import { Button } from './ncss/buttons/button/button.component';
import { Logo } from './components/logo/logo.component';
import { AuthService } from './auth/auth.service';




@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TopNav, Logo, RouterLink, Container, Button],
  templateUrl: './app.html',
  styleUrl: './app.css'
})



export class App implements OnInit {
  private msal = inject(MsalService);
  private broadcast = inject(MsalBroadcastService);
  auth = inject(AuthService);

  private publicNavLinks: NavLink[] = [
    { label: 'Sights', link: '/sights' },
    { label: 'Trip Planner', link: '/trip-planner' },
  ];

  navLinks = computed<NavLink[]>(() => {
    const user = this.auth.currentUser();
    if (!user) return this.publicNavLinks;
    const links: NavLink[] = [
      ...this.publicNavLinks,
      { label: 'My Account', link: '/myaccount' },
    ];
    if (this.auth.isAdmin()) {
      links.push({
        label: 'Admin',
        hasOptions: true,
        options: [
          { label: 'Admin Dashboard', value: '/admin/dashboard' },
          { label: 'Admin Categories', value: '/admin/categories' },
          { label: 'Admin Tags', value: '/admin/tags' },
          { label: 'Admin Sights Upload', value: '/admin/sights' },
          { label: 'Admin Users', value: '/admin/users' },
        ],
      });
    }
    return links;
  });

  ngOnInit(): void {
    // Wait for MSAL to finish processing any redirect/popup before reading account state
    this.broadcast.inProgress$
      .pipe(filter((status) => status === InteractionStatus.None), take(1))
      .subscribe(() => {
        const accounts = this.msal.instance.getAllAccounts();
        if (accounts.length && !this.msal.instance.getActiveAccount()) {
          this.msal.instance.setActiveAccount(accounts[0]);
        }
        this.auth.loadCurrentUser().subscribe();
      });
  }

  login(): void {
    this.auth.login();
  }

  logout(): void {
    this.auth.logout();
  }
}
