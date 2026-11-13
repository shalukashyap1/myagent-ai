
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';

import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { interval } from 'rxjs';
import { SwUpdate } from '@angular/service-worker';

import { ApiService } from './services/api.service';
import { AgentChatComponent } from './pages/agent-chat/agent-chat.component';

// 에이전트 정보 구조
// हिंदी: Agent की information का structure
interface Agent {
  id: number;
  name: string;
  role: string;
  instructions: string;
}

// 코드 문법 강조 기능을 설정합니다.
// हिंदी: Code की syntax highlighting configure करता है।
marked.use(
  markedHighlight({
    langPrefix: 'hljs language-',

    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, {
          language: lang
        }).value;
      }

      return hljs.highlight(code, {
        language: 'plaintext'
      }).value;
    }
  })
);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AgentChatComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

  selectedAgent: Agent | null = null;

  backendConnected = false;
  backendMessage = 'Checking connection...';

  agents: Agent[] = [];

  showCreateForm = false;

  isMobileMenuOpen = false;

  agentForm: FormGroup;

  // 업데이트 알림 중복 표시를 방지합니다.
  // हिंदी: Update notification बार-बार दिखने से रोकता है।
  private updatePromptShown = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private swUpdate: SwUpdate
  ) {

    this.agentForm = this.fb.group({
      name: ['', [
        Validators.required,
        Validators.maxLength(30)
      ]],

      role: ['Coding Assistant', Validators.required],

      instructions: ['', [
        Validators.required,
        Validators.minLength(10)
      ]]
    });

  }

  // 컴포넌트가 시작될 때 실행됩니다.
  // हिंदी: Component शुरू होने पर ये methods execute होते हैं।
  ngOnInit(): void {
    this.loadAgents();
    this.checkBackendConnection();
    this.initializeAppUpdates();
  }

  // 앱의 새 버전을 확인합니다.
  // हिंदी: App के नए version को check करता है।
  initializeAppUpdates(): void {

    // 개발 환경에서는 Service Worker를 실행하지 않습니다.
    // हिंदी: Development mode में Service Worker enabled नहीं होता।
    if (!this.swUpdate.isEnabled) {
      return;
    }

    // 새 버전이 준비되면 사용자에게 알립니다.
    // हिंदी: नया version तैयार होने पर user को notification देता है।
    this.swUpdate.versionUpdates.subscribe({

      next: (event) => {

        if (event.type === 'VERSION_READY') {
          this.showUpdateNotification();
        }

        if (event.type === 'VERSION_INSTALLATION_FAILED') {
          console.error('App update installation failed:', event);
        }

      },

      error: (error) => {
        console.error('App update check failed:', error);
      }

    });

    // 앱 실행 시 업데이트를 확인합니다.
    // हिंदी: App start होते ही update check करता है।
    this.checkForAppUpdate();

    // 5분마다 새 버전을 확인합니다.
    // हिंदी: हर 5 मिनट में नया version check करता है।
    interval(5 * 60 * 1000).subscribe(() => {
      this.checkForAppUpdate();
    });

  }

  // 새 앱 버전이 있는지 확인합니다.
  // हिंदी: Check करता है कि नया app version उपलब्ध है या नहीं।
  checkForAppUpdate(): void {

    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.swUpdate.checkForUpdate().catch((error) => {
      console.error('Unable to check for app updates:', error);
    });

  }

  // 업데이트 알림을 표시합니다.
  // हिंदी: User को update confirmation दिखाता है।
  showUpdateNotification(): void {

    if (this.updatePromptShown) {
      return;
    }

    this.updatePromptShown = true;

    const updateConfirmed = window.confirm(
      'A new version of MyAgent AI is available. Would you like to update now?'
    );

    if (updateConfirmed) {

      // 새 버전을 활성화하고 앱을 다시 불러옵니다.
      // हिंदी: नया version activate करके app reload करता है।
      this.swUpdate.activateUpdate()
        .then(() => {
          window.location.reload();
        })
        .catch((error) => {
          console.error('Unable to activate app update:', error);
          this.updatePromptShown = false;
        });

    } else {
      // 사용자가 나중에 업데이트할 수 있도록 합니다.
      // हिंदी: User बाद में update कर सकता है।
      this.updatePromptShown = false;
    }

  }

  // 모바일 메뉴를 열거나 닫습니다.
  // हिंदी: Mobile menu को open या close करता है।
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  // 모바일 메뉴를 닫습니다.
  // हिंदी: Mobile menu को बंद करता है।
  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  // 백엔드 연결을 확인합니다.
  // हिंदी: Backend connection check करता है।
  checkBackendConnection(): void {

    this.apiService.checkHealth().subscribe({

      next: (response) => {
        this.backendConnected = response.success;
        this.backendMessage = response.message;
      },

      error: () => {
        this.backendConnected = false;
        this.backendMessage = 'Backend connection failed';
      }

    });

  }

  // 에이전트 생성 폼을 엽니다.
  // हिंदी: Agent creation popup खोलता है।
  openCreateAgent(): void {
    this.closeMobileMenu();
    this.showCreateForm = true;
  }

  // 에이전트 생성 폼을 닫습니다.
  // हिंदी: Agent creation popup बंद करता है।
  closeCreateAgent(): void {

    this.showCreateForm = false;

    this.agentForm.reset({
      name: '',
      role: 'Coding Assistant',
      instructions: ''
    });

  }

  // 새로운 에이전트를 생성합니다.
  // हिंदी: नया Agent create करता है।
  createAgent(): void {

    if (this.agentForm.invalid) {
      this.agentForm.markAllAsTouched();
      return;
    }

    const formValue = this.agentForm.getRawValue();

    const newAgent: Agent = {
      id: Date.now(),
      name: formValue.name.trim(),
      role: formValue.role,
      instructions: formValue.instructions.trim()
    };

    this.agents = [...this.agents, newAgent];

    this.saveAgents();

    this.closeCreateAgent();

  }

  // 에이전트 목록을 LocalStorage에 저장합니다.
  // हिंदी: Agent list को browser LocalStorage में save करता है।
  saveAgents(): void {

    localStorage.setItem(
      'my-agents',
      JSON.stringify(this.agents)
    );

  }

  // 저장된 에이전트를 불러옵니다.
  // हिंदी: पहले से saved Agents को load करता है।
  loadAgents(): void {

    const savedAgents = localStorage.getItem('my-agents');

    if (savedAgents) {

      try {
        this.agents = JSON.parse(savedAgents);
      } catch {
        this.agents = [];
      }

    }

  }

  // 에이전트를 삭제합니다.
  // हिंदी: Agent को delete करता है।
  deleteAgent(id: number): void {

    this.agents = this.agents.filter(
      agent => agent.id !== id
    );

    this.saveAgents();

    if (this.selectedAgent?.id === id) {
      this.closeChat();
    }

  }

  // 선택한 에이전트의 채팅을 엽니다.
  // हिंदी: Selected Agent का chat खोलता है।
  openChat(agent: Agent): void {
    this.closeMobileMenu();
    this.selectedAgent = agent;
  }

  // 대시보드로 돌아갑니다.
  // हिंदी: Chat से वापस Dashboard पर जाता है।
  closeChat(): void {
    this.selectedAgent = null;
  }

}
