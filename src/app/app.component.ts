import { Component, inject, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { environment } from '../environments/environment';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  filtro = { "conselho": "CRM", tipo: 'RET', documento: '67666', uf: 'SP', cnpj: '11111111000191' };
  resultado: any = null;
  statusResultado: 'sucesso' | 'erro' | null = null;
  carregando = false;
  autenticado = false; // NOVO: indica se o usuário está autenticado

  async ngOnInit() {
    console.log('AppComponent inicializado');
    console.log('URL atual:', window.location.href);
    console.log('API URL:', environment.apiUrl);
    
    // Verifica se já está autenticado
    this.autenticado = this.authService.isAuthenticated();
    
    if (this.autenticado) {
      console.log('Usuário já autenticado');
    } else {
      console.log('Usuário não autenticado');
    }
    
    // ⭐ Processa o callback (se houver session_id na URL)
    const callbackProcessado = await this.authService.processarCallback();
    
    if (callbackProcessado) {
      console.log('Login realizado com sucesso!');
      this.autenticado = true;
      
      // Opcional: recarregar dados ou mostrar mensagem de boas-vindas
      // this.carregarDadosUsuario();
    }
  }

  async enviar() {
    this.resultado = null;
    this.statusResultado = null;
    this.carregando = true;

    // ⭐ Verifica autenticação ANTES de tentar a requisição
    if (!this.authService.isAuthenticated()) {
      console.log('Usuário não autenticado. Redirecionando para o login...');
      this.carregando = false;
      this.irParaLogin();
      return;
    }

    const tokenReal = this.authService.getToken();
    console.log('Token presente, fazendo requisição para API...');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${tokenReal}`,
      'Content-Type': 'application/json'
    });

    this.http.post(`/api/v1/numeracoes/receita-especial-retencao`, this.filtro, { headers })
      .subscribe({
        next: (response) => {
          this.carregando = false;
          this.statusResultado = 'sucesso';
          this.resultado = response;
          console.log('Requisição bem-sucedida:', response);
        },
        error: async (err) => {
          this.carregando = false;
          this.statusResultado = 'erro';
          this.resultado = err.error;
          console.error('Erro na requisição:', err);

          // ⭐ Se a API retornar 401 (token expirado ou inválido)
          if (err.status === 401) {
            console.log('Token inválido ou expirado, limpando sessão...');
            this.authService.limparSessao();
            this.autenticado = false;
            
            // Verifica se tem session_id na URL (caso tenha vindo de callback)
            const urlParams = new URLSearchParams(window.location.search);
            const sessionId = urlParams.get('session_id');
            
            if (sessionId) {
              // Tenta renovar o token com o session_id atual
              console.log('Tentando renovar token com session_id existente...');
              const renovado = await this.authService.processarCallback();
              
              if (renovado) {
                console.log('Token renovado, tentando novamente a requisição...');
                this.autenticado = true;
                this.enviar(); // Tenta novamente
                return;
              }
            }
            
            // Se não tem session_id ou falhou, vai para login
            console.log('Redirecionando para login...');
            this.irParaLogin();
          }
        }
      });
  }

  // ⭐ Método para fazer login manual
  fazerLogin(): void {
    if (this.authService.isAuthenticated()) {
      console.log('Já autenticado, não é necessário fazer login');
      return;
    }
    this.irParaLogin();
  }

  // ⭐ Método para fazer logout
  fazerLogout(): void {
    console.log('Fazendo logout...');
    this.authService.limparSessao();
    this.autenticado = false;
    this.resultado = null;
    this.statusResultado = null;
    console.log('Logout realizado com sucesso');
    
    // Opcional: redirecionar para página inicial
    // window.location.href = '/';
  }

  // ⭐ Método privado para redirecionar ao login
  private irParaLogin(): void {
    const loginUrl = this.authService.getLoginUrl();
    console.log('Redirecionando para login:', loginUrl);
    window.location.href = loginUrl;
  }
}