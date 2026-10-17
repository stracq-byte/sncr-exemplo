import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  limparSessao(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  getLoginUrl(): string {
    const clientUrl = window.location.origin + window.location.pathname;
    // ⭐ Usa URL completa do backend
    return `/api/v1/auth/login?client_url=${encodeURIComponent(clientUrl)}`;
  }

  async buscarToken(sessionId: string): Promise<string | null> {
    try {
      // ⭐ NÃO usa credentials: 'include' - sem cookie!
      const url = `/api/v1/auth/token?session_id=${sessionId}`;
      console.log('Buscando token em:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Resposta status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro ao buscar token:', response.status, errorText);
        return null;
      }

      const data = await response.json();
      console.log('Token obtido com sucesso!');
      return data.access_token;
    } catch (error) {
      console.error('Falha na requisição do token:', error);
      return null;
    }
  }

  async processarCallback(): Promise<boolean> {
    const urlParams = new URLSearchParams(window.location.search);
    
    const sessionId = urlParams.get('session_id');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    console.log('Processando callback - session_id:', sessionId);
    console.log('URL atual:', window.location.href);

    if (error) {
      console.error('Erro no callback:', error);
      return false;
    }

    if (sessionId) {
      console.log('Session ID recebido, buscando token...');
      const token = await this.buscarToken(sessionId);
      
      if (token) {
        this.setToken(token);
        console.log('Token armazenado com sucesso!');
        
        // ⭐ Limpa a URL (remove session_id e state)
        window.history.replaceState({}, document.title, window.location.pathname);
        return true;
      } else {
        console.error('Falha ao obter token');
      }
    } else {
      console.log('Nenhum session_id encontrado na URL');
    }

    return false;
  }

  // ⭐ Método para verificar se o usuário está autenticado
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    // Opcional: verificar se o token não está expirado
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirado = payload.exp * 1000 < Date.now();
      if (expirado) {
        this.limparSessao();
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }
}