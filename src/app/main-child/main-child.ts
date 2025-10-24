import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SideNav } from '../side-nav/side-nav';

@Component({
  selector: 'app-main-child',
  imports: [RouterOutlet,SideNav],
  templateUrl: './main-child.html',
  styleUrl: './main-child.css'
})
export class MainChild {
   isSidebarOpen = false;

  onSidebarToggle(isOpen: boolean): void {
    this.isSidebarOpen = isOpen;
  }
}
