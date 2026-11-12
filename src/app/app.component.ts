import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

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
      // 지원하는 언어인지 확인합니다.
      // हिंदी: Check करता है कि language supported है या नहीं।
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, {
          language: lang
        }).value;
      }

      // 언어를 모르면 일반 텍스트로 표시합니다.
      // हिंदी: Unknown language को plain text दिखाता है।
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

  // 선택한 에이전트
  // हिंदी: Selected Agent को store करता है
  selectedAgent: Agent | null = null;

  // 백엔드 연결 상태
  // हिंदी: Backend connection status
  backendConnected = false;
  backendMessage = 'Checking connection...';

  // 저장된 에이전트 목록
  // हिंदी: सभी saved agents की list
  agents: Agent[] = [];

  // 에이전트 생성 팝업 상태
  // हिंदी: Agent creation popup की visibility
  showCreateForm = false;

  // 에이전트 생성 폼
  // हिंदी: Agent बनाने का form
  agentForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {

    // 에이전트 생성 폼을 초기화합니다.
    // हिंदी: Agent creation form initialize करता है।
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

    // 에이전트 목록을 저장합니다.
    // हिंदी: नई Agent list को save करता है।
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

    // 변경된 목록을 다시 저장합니다.
    // हिंदी: Updated list को दोबारा save करता है।
    this.saveAgents();

    // 삭제된 에이전트가 열려 있으면 대시보드로 돌아갑니다.
    // हिंदी: अगर खुला हुआ Agent delete हो जाए तो Dashboard पर वापस जाएं।
    if (this.selectedAgent?.id === id) {
      this.closeChat();
    }

  }

  // 선택한 에이전트의 채팅을 엽니다.
  // हिंदी: Selected Agent का chat खोलता है।
  openChat(agent: Agent): void {
    this.selectedAgent = agent;
  }

  // 대시보드로 돌아갑니다.
  // हिंदी: Chat से वापस Dashboard पर जाता है।
  closeChat(): void {
    this.selectedAgent = null;
  }

}
