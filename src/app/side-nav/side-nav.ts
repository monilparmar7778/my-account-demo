import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Authservice } from '../authservice';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-side-nav',
  imports: [CommonModule],
  templateUrl: './side-nav.html',
  styleUrl: './side-nav.css'
})
export class SideNav {
  isOpen = false;
  showAccountSubmenu = false;

  @Output() toggleEvent = new EventEmitter<boolean>();

  constructor(private router: Router, private authService: Authservice) {}

  toggleSidebar() {
    this.isOpen = !this.isOpen;
    this.toggleEvent.emit(this.isOpen);
    console.log('Sidebar toggled:', this.isOpen);
  }

  toggleAccountSubmenu() {
    // Only allow submenu to open when sidebar is open
    if (this.isOpen) {
      this.showAccountSubmenu = !this.showAccountSubmenu;
    }
  }

  // Navigation methods for all menu options
  navigateToAccount() {
    console.log('Navigating to Account');
    this.router.navigate(['/mainchild/account']);
  }

  navigateToInsertAccount() {
    console.log('Navigating to Insert Account');
    this.router.navigate(['/mainchild/insertaccount']);
  }

  navigateToCreateUser() {
    console.log('Navigating to Create User');
    this.router.navigate(['/mainchild/create-user']);
  }

  navigateToLaserAccount() {
    console.log('Navigating to Laser Account');
    this.router.navigate(['/mainchild/laseraccount']);
  }

  navigateToAccountLaser() {
    console.log('Navigating to Account Laser');
    this.router.navigate(['/mainchild/accountlasert']);
  }

  // ADDED: Navigation method for Give Money
  navigateToGiveMoney() {
    console.log('Navigating to Give Money');
    this.router.navigate(['/mainchild/givemoney']);
  }

  onLogout() {
    console.log('Logging out');
    // this.authService.logout();
    this.router.navigate(['/login']);
  }
}