import { Component, OnInit, inject } from '@angular/core';
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

  private allNavLinks: NavLink[] = [
    {
      label: 'Admin',
      hasOptions: true,
      options: [
        {label: 'Dahsboard', value: '/admin/dashboard'},
        {label: 'Categories', value: '/admin/categories'},
        {label: 'Tags', value: '/admin/tags'},
        {label: 'Sights', value: '/admin/sights'},
        {label: 'Users', value: '/admin/users'},
      ]
    },
  ];

  private publicNavLinks: NavLink[] = [
    {
      label: 'Sights',
      link: '/sights'
    },
  ];

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

  getNavLinks(): NavLink[] {
    return this.auth.isAdmin() ? this.allNavLinks : this.publicNavLinks;
  }

  login(): void {
    this.auth.login();
  }

  logout(): void {
    this.auth.logout();
  }
}
