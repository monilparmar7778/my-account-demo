import { Component,OnInit } from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {
  constructor(private router: Router) {}
 
  ngOnInit(): void {
    
  }
  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}
