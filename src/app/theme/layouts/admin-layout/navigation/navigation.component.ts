// Angular import
import { Component, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// project import
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NavContentComponent } from './nav-content/nav-content.component';

import { NavigationItems } from './navigation';

@Component({
  selector: 'app-navigation',
  imports: [SharedModule, NavContentComponent, CommonModule],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit {
  // media 1025 After Use Menu Open
  NavCollapsedMob = output();
  SubmenuCollapse = output();

  navCollapsedMob;
  windowWidth: number;

  navItems: any[] = [];

  userLogin: any = null;

  // Constructor
  constructor() {
    this.windowWidth = window.innerWidth;
    this.navCollapsedMob = false;
  }

  ngOnInit(): void {
    const userData = localStorage.getItem('user');

    if (userData) {
      this.userLogin = JSON.parse(userData);

      const role = this.userLogin.role;

      this.navItems = NavigationItems.map((group) => {
        const children = group.children?.filter((item) => {
          // jika roles tidak ada → tampil semua
          if (!item.roles) {
            return true;
          }

          // cek role
          return item.roles.includes(role);
        });

        return {
          ...group,
          children
        };
      }).filter((group) => group.children && group.children.length > 0);
    }
  }

  // public method
  navCollapseMob() {
    if (this.windowWidth < 1025) {
      this.NavCollapsedMob.emit();
    }
  }

  navSubmenuCollapse() {
    document.querySelector('app-navigation.pc-sidebar')?.classList.add('coded-trigger');
  }
}
