import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { parseJwt, isTokenExpired, getUserFromToken } from './jwt-util';

@Injectable({
  providedIn: 'root'
})
export class Authservice {
  private signupUrl = 'http://localhost:5095/api/Login/adduser';
  private validateOtpUrl = 'http://localhost:5095/api/Login/validate-otp';
  private checkUserUrl = 'http://localhost:5095/api/Login/check-user';
  private baseUrl = 'http://localhost:5095/api/Login';
  
  // ✅ ACCOUNT API URL
  private accountsUrl = 'http://localhost:5221/api/Account';
  
  // ✅ USER API URL
  private usersUrl = 'http://localhost:5221/api/User';

  // ✅ AUTH API URL (NEW)
  private authUrl = 'http://localhost:5221/api/Auth';

  // JWT Authentication Properties
  private tokenKey = 'authToken';
  private userKey = 'userData';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  // ============ JWT AUTHENTICATION METHODS ============

  // Login with JWT
// In your authservice.ts
login(loginData: { username: string; password: string }): Observable<any> {
  const httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  // Updated request payload with all required fields
  const loginRequest = {
    username: loginData.username,
    password: loginData.password,
    token: "", // Add empty string for required fields
    Issuer: "MyAccountAPI", // Add default value
    Secret: "YourSuperSecretKey", // Add default value
    message: "", // Add empty string
    Audience: "MyAccountApp", // Add default value
    success: false, // Add default
    user_id: 0, // Add default
    expires_at: null // Add default
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

  // Set session after successful login
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

  // Logout method
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  // Get token from localStorage
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Get user data
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

  // Check if user is logged in
  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    return !isTokenExpired(token);
  }

  // Check if token exists and is valid
  private hasToken(): boolean {
    return this.isLoggedIn();
  }

  // Get authorization headers for authenticated requests
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

  // Get user ID from token
  getUserId(): number | null {
    const user = this.getUser();
    return user ? user.user_id : null;
  }

  // Get username from token
  getUsername(): string | null {
    const user = this.getUser();
    return user ? user.username : null;
  }

  // ============ UPDATED ACCOUNT METHODS WITH AUTH HEADERS ============

  // Create only Get Money transaction (UPDATED)
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

  // Create only Give Money transaction (UPDATED)
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

  // Create complete transaction (both get and give) (UPDATED)
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

  // ============ UPDATED USER METHODS WITH AUTH HEADERS ============
  createUser(userData: any): Observable<any> {
    const httpOptions = {
      headers: this.getAuthHeaders()
    };
    
    const user = {
      username: userData.username,
      email: userData.email,
      mobile_no: userData.mobile_no,
      full_name: userData.full_name,
      password: null  // Always pass null
    };

    console.log('Creating user:', user);
    
    return this.http.post<any>(this.usersUrl, user, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getUsers(): Observable<any> {
    const httpOptions = {
      headers: this.getAuthHeaders()
    };
    return this.http.get<any>(this.usersUrl, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getUserById(user_id: number): Observable<any> {
    const httpOptions = {
      headers: this.getAuthHeaders()
    };
    return this.http.get<any>(`${this.usersUrl}/${user_id}`, httpOptions)
      .pipe(catchError(this.handleError));
  }

  updateUser(user_id: number, user: any): Observable<any> {
    const httpOptions = {
      headers: this.getAuthHeaders()
    };
    return this.http.put<any>(`${this.usersUrl}/${user_id}`, user, httpOptions)
      .pipe(catchError(this.handleError));
  }

  deleteUser(user_id: number): Observable<any> {
    const httpOptions = {
      headers: this.getAuthHeaders()
    };
    return this.http.delete<any>(`${this.usersUrl}/${user_id}`, httpOptions)
      .pipe(catchError(this.handleError));
  }

  // ============ UPDATED ACCOUNT METHODS WITH AUTH HEADERS ============
  getAccounts(): Observable<any> {
    const httpOptions = {
      headers: this.getAuthHeaders()
    };
    return this.http.get<any>(this.accountsUrl, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getAccountById(acid: number): Observable<any> {
    const httpOptions = {
      headers: this.getAuthHeaders()
    };
    return this.http.get<any>(`${this.accountsUrl}/${acid}`, httpOptions)
      .pipe(catchError(this.handleError));
  }

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

  updateAccount(acid: number, account: any): Observable<any> {
    const httpOptions = {
      headers: this.getAuthHeaders()
    };
    return this.http.put<any>(`${this.accountsUrl}/${acid}`, account, httpOptions)
      .pipe(catchError(this.handleError));
  }

  deleteAccount(acid: number): Observable<any> {
    const httpOptions = {
      headers: this.getAuthHeaders()
    };
    return this.http.delete<any>(`${this.accountsUrl}/${acid}`, httpOptions)
      .pipe(catchError(this.handleError));
  }

  // ============ EXISTING METHODS (NO CHANGES NEEDED) ============
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
    console.log(body);

    return this.http.post<any>(this.signupUrl, body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getUserCountsByDistrict(): Observable<any> {
    const url = `${this.baseUrl}/getUserCountsByDistrict`;
    return this.http.get<any>(url).pipe(
      catchError(this.handleError)
    );
  }

  getGujaratData(): Observable<any> {
    return this.http.get('assets/gujrat.json');
  }

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

  // Auto logout when token is expired
  startTokenExpirationCheck(): void {
    setInterval(() => {
      if (!this.isLoggedIn()) {
        this.logout();
      }
    }, 60000); // Check every minute
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else {
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`
      );
    }
    return throwError('Something bad happened; please try again later.');
  }
}