interface User {
  id: string;
  username: string;
  stats: {
    totalGames: number;
    gamesWon: number;
    correctGuesses: number;
    successfulDeceptions: number;
    winRate: number;
    totalPoints: number;
    averagePoints: number;
  };
}

interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

class AuthService {
  private token: string | null = null;
  private user: User | null = null;

  async autoLogin(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:5001/auth/auto-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Auto-login failed');
      }

      const data: AuthResponse = await response.json();
      
      if (data.success && data.token) {
        this.setToken(data.token);
        this.setUser(data.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Auto-login error:', error);
      return false;
    }
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  setUser(user: User): void {
    this.user = user;
    localStorage.setItem('user', JSON.stringify(user));
  }

  getUser(): User | null {
    if (!this.user) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        this.user = JSON.parse(userStr);
      }
    }
    return this.user;
  }

  logout(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();
export const getToken = () => authService.getToken();
export const getUser = () => authService.getUser();
export const isAuthenticated = () => authService.isAuthenticated();
export const logout = () => authService.logout(); 