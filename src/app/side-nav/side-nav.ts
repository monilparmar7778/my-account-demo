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
  showEmployeeSubmenu = false;

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

  toggleEmployeeSubmenu() {
    // Only allow submenu to open when sidebar is open
    if (this.isOpen) {
      this.showEmployeeSubmenu = !this.showEmployeeSubmenu;
    }
  }

  // Navigation methods for Account Ledger submenu
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

  navigateToGiveMoney() {
    console.log('Navigating to Give Money');
    this.router.navigate(['/mainchild/givemoney']);
  }

  // Navigation methods for Employee Salary submenu
  navigateToInsertEmployee() {
    console.log('Navigating to Insert Employee');
    this.router.navigate(['/mainchild/insertemployee']);
  }

  navigateToGetEmployee() {
    console.log('Navigating to Get Employee');
    this.router.navigate(['/mainchild/getemployee']);
  }

  navigateToBankDetails() {
    console.log('Navigating to Bank Details');
    this.router.navigate(['/mainchild/bankdetailspage']);
  }

  onLogout() {
    if (confirm('Are you sure you want to logout?')) {
      console.log('Logging out');
      try {
        this.authService.logout();
        console.log('Logout successful');
      } catch (error) {
        console.error('Logout error:', error);
        // Fallback: clear local storage and navigate manually
        localStorage.clear();
        this.router.navigate(['/login']);
      }
    }
  }
}