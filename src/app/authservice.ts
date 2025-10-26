import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { parseJwt, isTokenExpired, getUserFromToken } from './jwt-util';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Authservice {
  // Use environment variables for all URLs
  private signupUrl = `${environment.loginUrl}/adduser`;
  private validateOtpUrl = `${environment.loginUrl}/validate-otp`;
  private checkUserUrl = `${environment.loginUrl}/check-user`;
  private baseUrl = environment.loginUrl;
  
  // API URLs from environment
  private accountsUrl = environment.accountUrl;
  private usersUrl = environment.userUrl;
  private authUrl = environment.authUrl;
  private accountRecordUrl = environment.accountRecordUrl;

  // JWT Authentication Properties
  private tokenKey = 'authToken';
  private userKey = 'userData';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) { 
    // Start token expiration check when service is initialized
    this.startTokenExpirationCheck();
  }

  // ============ LASER REPORT METHOD ADDED ============

  /**
   * Generate laser report with one-time API call
   */
  generateLaserReport(request: any): Observable<any> {
    const httpOptions = {
      headers: this.getAuthHeaders()
    };
    
    console.log('Generating laser report with request:', request);
    
    return this.http.post<any>(`${this.accountRecordUrl}/generate-report`, request, httpOptions)
      .pipe(
        tap(response => {
          if (response.success) {
            console.log('Laser report generated successfully');
          }
        }),
        catchError(this.handleError)
      );
  }

  // ============ JWT AUTHENTICATION METHODS ============

  /**
   * Login with JWT authentication
   */
  login(loginData: { username: string; password: string }): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };

    const loginRequest = {
      username: loginData.username,
      password: loginData.password,
      token: "",
      Issuer: "MyAccountAPI",
      Secret: "YourSuperSecretKey",
      message: "",
      Audience: "MyAccountApp",
      success: false,
      user_id: 0,
      expires_at: null
    };

    console.log('Sending login request to JWT API:', loginRequest);

    return this.http.post<any>(`${this.authUrl}/login`, loginRequest, httpOptions)
      .pipe(
        tap(response => {
          if (response.success && response.token) {
            this.setSession(response);
            this.isAuthenticatedSubject.next(true);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Set session after successful login
   */
  private setSession(authResult: any): void {
    localStorage.setItem(this.tokenKey, authResult.token);
    
    const userData = {
      user_id: authResult.user_id,
      username: authResult.username,
      expires_at: authResult.expires_at,
      token: authResult.token
    };
    localStorage.setItem(this.userKey, JSON.stringify(userData));
  }

  /**
   * Logout user and clear session
   */
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  /**
   * Get token from localStorage
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Get user data from token or localStorage
   */
  getUser(): any {
    const token = this.getToken();
    if (token) {
      const userFromToken = getUserFromToken(token);
      if (userFromToken) {
        return userFromToken;
      }
    }
    
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Check if user is logged in and token is valid
   */
  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    return !isTokenExpired(token);
  }

  /**
   * Check if token exists and is valid
   */
  private hasToken(): boolean {
    return this.isLoggedIn();
  }

  /**
   * Get authorization headers for authenticated requests
   */
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    if (token && this.isLoggedIn()) {
      return new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });
    }
    
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  /**
   * Get user ID from token
   */
  getUserId(): number | null {
    const user = this.getUser();
    return user ? user.user_id : null;
  }

  /**
   * Get username from token
   */
  getUsername(): string | null {
    const user = this.getUser();
    return user ? user.username : null;
  }

  // ============ ACCOUNT RECORD METHODS ============

  /**
   * Get account records with filtering and pagination
   */
  getAccountRecords(request: any): Observable<any> {
    const httpOptions = {
      headers: this.getAuthHeaders()
    };
    
    return this.http.post<any>(`${this.accountRecordUrl}/records`, request, httpOptions)
      .pipe(catchError(this.handleError));
  }

  // ============ ACCOUNT TRANSACTION METHODS ============

  /**
   * Create only Get Money transaction
   */
  createGetMoneyTransaction(account: any): Observable<any> {
    const httpOptions = {
      headers: this.getAuthHeaders()
    };
    
    const getMoneyData = {
      name: account.name,
      getmoney: account.getmoney,
      intrest: account.intrest,
      date: account.date,
      agent: account.agent,
      remark: account.remark,
      utino: account.utino
    };

    console.log('Sending Get Money data:', getMoneyData);
    
    return this.http.post<any>(`${this.accountsUrl}/CreateGetMoney`, getMoneyData, httpOptions)
      .pipe(catchError(this.handleError));
  }

  /**
   * Create only Give Money transaction
   */
  createGiveMoneyTransaction(account: any): Observable<any> {
    const httpOptions = {
      headers: this.getAuthHeaders()
    };
    
    const giveMoneyData = {
      givename: account.givename,
      givemoney: account.givemoney,
      givedate: account.givedate,
      giveagent: account.giveagent,
      giveremark: account.giveremark,
      giveutino: account.giveutino
    };

    console.log('Sending Give Money data:', giveMoneyData);
    
    return this.http.post<any>(`${this.accountsUrl}/CreateGiveMoney`, giveMoneyData, httpOptions)
      .pipe(catchError(this.handleError));
  }

  /**
   * Create complete transaction (both get and give)
   */
  createCompleteTransaction(account: any): Observable<any> {
    const httpOptions = {
      headers: this.getAuthHeaders()
    };
    
    const completeData = {
      name: account.name,
      getmoney: account.getmoney,
      intrest: account.intrest,
      givemoney: account.givemoney,
      date: account.date,
      agent: account.agent,
      remark: account.remark,
      utino: account.utino,
      givename: account.givename,
      giveremark: account.giveremark,
      giveutino: account.giveutino,
      givedate: account.givedate,
      giveagent: account.giveagent
    };

    console.log('Sending complete transaction data:', completeData);
    
    return this.http.post<any>(`${this.accountsUrl}/CompleteTransaction`, completeData, httpOptions)
      .pipe(catchError(this.handleError));
  }

  // ============ USER MANAGEMENT METHODS ============

  /**
   * Create new user
   */
  createUser(userData: any): Observable<any> {
    const httpOptions = {
      headers: this.getAuthHeaders()
    };
    
    const user = {
      username: userData.username,
      email: userData.email,
      mobile_no: userData.mobile_no,
      full_name: userData.full_name,
      password: null
    };

    console.log('Creating user:', user);
    
    return this.http.post<any>(this.usersUrl, user, httpOptions)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get all users
   */
  getUsers(): Observable<any> {
    const httpOptions = {
      headers: this.getAuthHeaders()
    };
    return this.http.get<any>(this.usersUrl, httpOptions)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get user by ID
   */
  getUserById(user_id: number): Observable<any> {
    const httpOptions = {
      headers: this.getAuthHeaders()
    };
    return this.http.get<any>(`${this.usersUrl}/${user_id}`, httpOptions)
      .pipe(catchError(this.handleError));
  }

  /**
   * Update user
   */
  updateUser(user_id: number, user: any): Observable<any> {
    const httpOptions = {
      headers: this.getAuthHeaders()
    };
    return this.http.put<any>(`${this.usersUrl}/${user_id}`, user, httpOptions)
      .pipe(catchError(this.handleError));
  }

  /**
   * Delete user
   */
  deleteUser(user_id: number): Observable<any> {
    const httpOptions = {
      headers: this.getAuthHeaders()
    };
    return this.http.delete<any>(`${this.usersUrl}/${user_id}`, httpOptions)
      .pipe(catchError(this.handleError));
  }

  // ============ ACCOUNT MANAGEMENT METHODS ============

  /**
   * Get all accounts
   */
  getAccounts(): Observable<any> {
    const httpOptions = {
      headers: this.getAuthHeaders()
    };
    return this.http.get<any>(this.accountsUrl, httpOptions)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get account by ID
   */
  getAccountById(acid: number): Observable<any> {
    const httpOptions = {
      headers: this.getAuthHeaders()
    };
    return this.http.get<any>(`${this.accountsUrl}/${acid}`, httpOptions)
      .pipe(catchError(this.handleError));
  }

  /**
   * Create new account
   */
  createAccount(account: any): Observable<any> {
    const httpOptions = {
      headers: this.getAuthHeaders()
    };
    
    const accountData = {
      name: account.name,
      getmoney: account.getmoney,
      intrest: account.intrest,
      givemoney: account.givemoney,
      date: account.date,
      agent: account.agent,
      remark: account.remark,
      utino: account.utino,
      givename: account.givename,
      giveremark: account.giveremark,
      giveutino: account.giveutino,
      givedate: account.givedate,
      giveagent: account.giveagent
    };

    console.log('Sending account data:', accountData);
    
    return this.http.post<any>(this.accountsUrl, accountData, httpOptions)
      .pipe(catchError(this.handleError));
  }

  /**
   * Update account
   */
  updateAccount(acid: number, account: any): Observable<any> {
    const httpOptions = {
      headers: this.getAuthHeaders()
    };
    return this.http.put<any>(`${this.accountsUrl}/${acid}`, account, httpOptions)
      .pipe(catchError(this.handleError));
  }

  /**
   * Delete account
   */
  deleteAccount(acid: number): Observable<any> {
    const httpOptions = {
      headers: this.getAuthHeaders()
    };
    return this.http.delete<any>(`${this.accountsUrl}/${acid}`, httpOptions)
      .pipe(catchError(this.handleError));
  }

  // ============ LEGACY AUTH METHODS ============

  /**
   * Signup user (legacy method)
   */
  signupUser(userData: any): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
    const body = {
      username: userData.username,
      name: userData.name,
      password: userData.password,
      emailid: userData.emailid
    };
    console.log('Signup body:', body);

    return this.http.post<any>(this.signupUrl, body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get user counts by district
   */
  getUserCountsByDistrict(): Observable<any> {
    const url = `${this.baseUrl}/getUserCountsByDistrict`;
    return this.http.get<any>(url).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get Gujarat data from assets
   */
  getGujaratData(): Observable<any> {
    return this.http.get('assets/gujrat.json');
  }

  /**
   * Check user credentials (legacy method)
   */
  checkUser(emailid: string, password: string): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
    const body = { emailid, password };
    return this.http.post<any>(this.checkUserUrl, JSON.stringify(body), httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  // ============ UTILITY METHODS ============

  /**
   * Auto logout when token is expired
   */
  startTokenExpirationCheck(): void {
    setInterval(() => {
      if (!this.isLoggedIn()) {
        this.logout();
      }
    }, 60000); // Check every minute
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Something bad happened; please try again later.';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `An error occurred: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Backend returned code ${error.status}, body was: ${JSON.stringify(error.error)}`;
    }
    
    console.error('AuthService Error:', errorMessage);
    return throwError(errorMessage);
  }

  /**
   * Validate OTP (if needed)
   */
  validateOtp(otpData: any): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
    return this.http.post<any>(this.validateOtpUrl, otpData, httpOptions)
      .pipe(catchError(this.handleError));
  }

  /**
   * Refresh token (if implemented in backend)
   */
  refreshToken(): Observable<any> {
    const httpOptions = {
      headers: this.getAuthHeaders()
    };
    const refreshData = {
      token: this.getToken(),
      user_id: this.getUserId()
    };
    
    return this.http.post<any>(`${this.authUrl}/refresh`, refreshData, httpOptions)
      .pipe(
        tap(response => {
          if (response.success && response.token) {
            this.setSession(response);
          }
        }),
        catchError(this.handleError)
      );
  }
}