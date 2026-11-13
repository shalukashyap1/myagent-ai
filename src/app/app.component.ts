
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

import { ApiService, MongoAgent } from './services/api.service';
import { AgentChatComponent } from './pages/agent-chat/agent-chat.component';

// 에이전트 정보 구조
// हिंदी: Agent की information का structure
interface Agent {
  id: string;
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

  // 수정할 에이전트 ID를 저장합니다.
  // हिंदी: जिस Agent को edit करना है उसकी ID रखता है।
  editingAgentId: string | null = null;

  isMobileMenuOpen = false;

  agentForm: FormGroup;

  // 에이전트 작업 상태를 관리합니다.
  // हिंदी: Agent API operations की loading और error state रखता है।
  isAgentsLoading = false;
  agentErrorMessage = '';

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

        if (response.database !== 'Connected') {
          this.backendMessage = 'Backend connected, database disconnected';
        }
      },

      error: () => {
        this.backendConnected = false;
        this.backendMessage = 'Backend connection failed';
      }

    });

  }

  // 에이전트 생성 폼을 엽니다.
  // हिंदी: नया Agent create करने का popup खोलता है।
  openCreateAgent(): void {

    this.closeMobileMenu();
    this.agentErrorMessage = '';
    this.editingAgentId = null;

    this.agentForm.reset({
      name: '',
      role: 'Coding Assistant',
      instructions: ''
    });

    this.showCreateForm = true;
  }

  // 에이전트 수정 폼을 엽니다.
  // हिंदी: Existing Agent की details edit form में खोलता है।
  editAgent(agent: Agent): void {

    this.closeMobileMenu();
    this.agentErrorMessage = '';

    this.editingAgentId = agent.id;

    this.agentForm.patchValue({
      name: agent.name,
      role: agent.role,
      instructions: agent.instructions
    });

    this.showCreateForm = true;
  }

  // 에이전트 생성 및 수정 폼을 닫습니다.
  // हिंदी: Create और Edit form को बंद करता है।
  closeCreateAgent(): void {

    this.showCreateForm = false;
    this.editingAgentId = null;
    this.agentErrorMessage = '';

    this.agentForm.reset({
      name: '',
      role: 'Coding Assistant',
      instructions: ''
    });

  }

  // 새로운 에이전트를 생성하거나 기존 에이전트를 수정합니다.
  // हिंदी: नया Agent create या existing Agent update करता है।
  createAgent(): void {

    if (this.agentForm.invalid) {
      this.agentForm.markAllAsTouched();
      return;
    }

    const formValue = this.agentForm.getRawValue();

    const agentData = {
      name: formValue.name.trim(),
      role: formValue.role.trim(),
      instructions: formValue.instructions.trim()
    };

    this.agentErrorMessage = '';

    // 수정 모드이면 기존 Agent를 업데이트합니다.
    // हिंदी: Edit mode होने पर existing Agent update करता है।
    if (this.editingAgentId) {

      const agentId = this.editingAgentId;

      this.apiService.updateAgent(agentId, agentData).subscribe({

        next: (response) => {

          if (response.success) {

            const updatedAgent = this.mapMongoAgent(response.agent);

            this.agents = this.agents.map(agent =>
              agent.id === agentId ? updatedAgent : agent
            );

            // 현재 채팅 중인 Agent도 업데이트합니다.
            // हिंदी: Open chat वाले Agent की details भी update करता है।
            if (this.selectedAgent?.id === agentId) {
              this.selectedAgent = updatedAgent;
            }

            this.closeCreateAgent();
          }

        },

        error: (error) => {

          console.error('Update Agent Error:', error);

          this.agentErrorMessage =
            error.error?.message || 'Unable to update agent. Please try again.';

        }

      });

      return;
    }

    // 새로운 Agent를 MongoDB에 저장합니다.
    // हिंदी: नया Agent MongoDB में save करता है।
    this.apiService.createAgent(agentData).subscribe({

      next: (response) => {

        if (response.success) {

          const savedAgent = this.mapMongoAgent(response.agent);

          this.agents = [savedAgent, ...this.agents];

          this.closeCreateAgent();
        }

      },

      error: (error) => {

        console.error('Create Agent Error:', error);

        this.agentErrorMessage =
          error.error?.message || 'Unable to create agent. Please try again.';

      }

    });

  }

  // MongoDB Agent를 frontend Agent 구조로 변환합니다.
  // हिंदी: MongoDB के Agent को frontend के Agent structure में बदलता है।
  private mapMongoAgent(agent: MongoAgent): Agent {

    return {
      id: agent._id,
      name: agent.name,
      role: agent.role,
      instructions: agent.instructions
    };

  }

  // MongoDB에서 저장된 에이전트를 가져옵니다.
  // हिंदी: MongoDB से saved Agents की list load करता है।
  loadAgents(): void {

    this.isAgentsLoading = true;
    this.agentErrorMessage = '';

    this.apiService.getAgents().subscribe({

      next: (response) => {

        this.agents = response.agents.map(
          agent => this.mapMongoAgent(agent)
        );

        this.isAgentsLoading = false;

      },

      error: (error) => {

        console.error('Load Agents Error:', error);

        this.agentErrorMessage =
          error.error?.message || 'Unable to load agents.';

        this.isAgentsLoading = false;

      }

    });

  }

  // 에이전트를 MongoDB에서 삭제합니다.
  // हिंदी: MongoDB database से Agent delete करता है।
  deleteAgent(id: string): void {

    this.agentErrorMessage = '';

    this.apiService.deleteAgent(id).subscribe({

      next: (response) => {

        if (response.success) {

          this.agents = this.agents.filter(
            agent => agent.id !== id
          );

          if (this.selectedAgent?.id === id) {
            this.closeChat();
          }

        }

      },

      error: (error) => {

        console.error('Delete Agent Error:', error);

        this.agentErrorMessage =
          error.error?.message || 'Unable to delete agent.';

      }

    });

  }

  /*
  ============================================================
  OLD LOCAL STORAGE APPROACH
  हिंदी: यह पुराना code study के लिए comment किया गया है।
  ============================================================

  // पुराने तरीके से नया Agent create करना।
  // हिंदी: पहले Agent को केवल browser में save किया जाता था।

  createAgentUsingLocalStorage(): void {

    if (this.agentForm.invalid) {
      this.agentForm.markAllAsTouched();
      return;
    }

    const formValue = this.agentForm.getRawValue();

    const newAgent: Agent = {
      id: Date.now().toString(),
      name: formValue.name.trim(),
      role: formValue.role,
      instructions: formValue.instructions.trim()
    };

    this.agents = [...this.agents, newAgent];

    this.saveAgentsUsingLocalStorage();

    this.closeCreateAgent();
  }

  // 에이전트 목록을 LocalStorage에 저장합니다.
  // हिंदी: Agent list को browser LocalStorage में save करता है।

  saveAgentsUsingLocalStorage(): void {

    localStorage.setItem(
      'my-agents',
      JSON.stringify(this.agents)
    );

  }

  // 저장된 에이전트를 LocalStorage에서 불러옵니다.
  // हिंदी: Browser LocalStorage से Agents load करता है।

  loadAgentsUsingLocalStorage(): void {

    const savedAgents = localStorage.getItem('my-agents');

    if (savedAgents) {

      try {
        this.agents = JSON.parse(savedAgents);
      } catch {
        this.agents = [];
      }

    }

  }

  // LocalStorage에서 Agent를 삭제합니다.
  // हिंदी: Browser LocalStorage से Agent delete करता है।

  deleteAgentUsingLocalStorage(id: string): void {

    this.agents = this.agents.filter(
      agent => agent.id !== id
    );

    this.saveAgentsUsingLocalStorage();

    if (this.selectedAgent?.id === id) {
      this.closeChat();
    }

  }

  ============================================================
  END OF OLD LOCAL STORAGE APPROACH
  ============================================================
  */

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
