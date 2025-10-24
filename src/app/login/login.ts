import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Authservice } from '../authservice';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login implements OnInit {
  signUpForm: FormGroup;
  signInForm: FormGroup;
  submitted = false; 
  errorMessage: string = '';
  loading = false;
  returnUrl: string = '/mainchild/account';

  constructor(
    private fb: FormBuilder, 
    private authService: Authservice, 
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Initialize forms
    this.signUpForm = this.fb.group({
      name: ['', Validators.required],
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      emailid: ['', [Validators.required, Validators.email]]
    });

    this.signInForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Get return url from route parameters or default to account page
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/mainchild/account';
    console.log('Return URL:', this.returnUrl);
  }

  togglePanel(showSignUp: boolean) {
    const container = document.getElementById('container');
    if (container) {
      if (showSignUp) {
        container.classList.add('right-panel-active');
      } else {
        container.classList.remove('right-panel-active');
      }
    } else {
      console.error("Element with id 'container' not found.");
    }
  }

  onSignUp() {
    this.submitted = true;
    this.errorMessage = '';

    if (this.signUpForm.invalid) {
      console.log('Invalid sign up form submission');
      this.markFormGroupTouched(this.signUpForm);
      return;
    }

    console.log('Sign Up Form Data:', this.signUpForm.value);
    this.loading = true;

    this.authService.signupUser(this.signUpForm.value)
      .subscribe(
        (response: any) => {
          this.loading = false;
          console.log('Sign Up API Response:', response);
          
          if (response.success) {
            // Store session data after successful signup
            sessionStorage.setItem('name', response.Name);
            sessionStorage.setItem('emailId', response.EmailId);
            sessionStorage.setItem('username', response.Username);

            // Navigate to OTP validation page or account page
            this.router.navigate(['/otp-validation'], { 
              state: { email: this.signUpForm.value.emailid } 
            });
          } else {
            this.errorMessage = response.message || 'Sign up failed. Please try again.';
          }
          this.submitted = false;
        },
        (error: any) => {
          this.loading = false;
          this.errorMessage = error?.error?.message || 'An unexpected error occurred during sign up. Please try again later.';
          console.error('Sign Up API Error:', error);
          this.submitted = false;
        }
      );
  }

  onSignIn() {
    this.submitted = true;
    this.errorMessage = '';
    this.loading = true;

    if (this.signInForm.invalid) {
      console.log('Invalid sign in form submission');
      this.markFormGroupTouched(this.signInForm);
      this.loading = false;
      return;
    }

    console.log('Sign In Form Data:', this.signInForm.value);

    // Use the new JWT login method
    const loginData = {
      username: this.signInForm.value.username,
      password: this.signInForm.value.password
    };

    this.authService.login(loginData).subscribe(
      (response: any) => {
        this.loading = false;
        console.log('JWT Login Response:', response);
        
        if (response.success && response.token) {
          console.log('✅ Login successful!');
          console.log('🔄 Navigating to:', this.returnUrl);
          console.log('👤 User ID:', response.user_id);
          console.log('🔐 Token received:', response.token ? 'Yes' : 'No');
          
          // Navigate to the return URL or default account page
          this.router.navigateByUrl(this.returnUrl).then(navigationSuccess => {
            if (navigationSuccess) {
              console.log('🎯 Navigation to account page successful');
            } else {
              console.error('❌ Navigation failed, redirecting to default account page');
              this.router.navigate(['/mainchild/account']);
            }
          });
        } else {
          this.errorMessage = response.message || 'Login failed. Please check your credentials.';
          console.error('❌ Login failed:', response.message);
        }
      },
      (error: any) => {
        this.loading = false;
        this.errorMessage = error || 'An unexpected error occurred. Please try again later.';
        console.error('❌ JWT Login Error:', error);
      }
    );
  }

  // Helper method to mark all form fields as touched
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  // Helper methods for template access
  get signUpControls() {
    return this.signUpForm.controls;
  }

  get signInControls() {
    return this.signInForm.controls;
  }

  // Check if form field has error
  hasError(form: FormGroup, field: string, errorType: string): boolean {
    const control = form.get(field);
    return !!control && control.touched && control.hasError(errorType);
  }
}