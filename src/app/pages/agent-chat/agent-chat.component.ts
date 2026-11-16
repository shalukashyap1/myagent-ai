
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { DatePipe } from '@angular/common';

import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit
} from '@angular/core';

import {
  ApiService,
  MongoConversation,
  MongoMessage
} from '../../services/api.service';

import { FormsModule } from '@angular/forms';

import hljs from 'highlight.js/lib/core';

import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import scss from 'highlight.js/lib/languages/scss';
import java from 'highlight.js/lib/languages/java';
import python from 'highlight.js/lib/languages/python';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import sql from 'highlight.js/lib/languages/sql';
import csharp from 'highlight.js/lib/languages/csharp';

// 코드 언어를 등록합니다.
// हिंदी: Syntax highlighting के लिए programming languages register करता है।
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('scss', scss);
hljs.registerLanguage('java', java);
hljs.registerLanguage('python', python);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('csharp', csharp);

interface MessagePart {
  type: 'text' | 'code';
  content: string;
  html?: string;
  language?: string;
  highlightedHtml?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  parts?: MessagePart[];
}

interface Agent {
  id: string;
  name: string;
  role: string;
  instructions: string;
}

@Component({
  selector: 'app-agent-chat',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './agent-chat.component.html',
  styleUrl: './agent-chat.component.scss'
})
export class AgentChatComponent implements OnInit {

  @Input() agent!: Agent;
  @Output() back = new EventEmitter<void>();

  userMessage = '';
  messages: ChatMessage[] = [];

  isLoading = false;
  errorMessage = '';

  // 대화 목록과 현재 대화를 관리합니다.
  // हिंदी: Chat history और currently selected conversation manage करता है।
  conversations: MongoConversation[] = [];

  selectedConversationId: string | null = null;

  isHistoryLoading = false;
  isConversationLoading = false;

  // 사이드바 열림 상태를 관리합니다.
  // हिंदी: Sidebar खुला है या बंद, यह manage करता है।
  isSidebarCollapsed = false;

  constructor(private apiService: ApiService) {}

  // 사이드바를 열거나 닫습니다.
  // हिंदी: Sidebar को open और close करता है।
  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  // 모바일 sidebar를 닫습니다.
  // हिंदी: Mobile sidebar को बंद करता है।
  closeSidebar(): void {
    this.isSidebarCollapsed = true;
  }
  

  ngOnInit(): void {

  // 모바일에서는 sidebar를 기본적으로 닫습니다.
  // हिंदी: Mobile पर sidebar default रूप से बंद रहेगी।
  this.isSidebarCollapsed = window.innerWidth <= 600;

  this.loadConversations();
}

  // 해당 Agent의 모든 대화를 가져옵니다.
  // हिंदी: Current Agent की सभी conversations load करता है।
  loadConversations(): void {
    this.isHistoryLoading = true;

    this.apiService.getConversations(this.agent.id).subscribe({
      next: (response) => {
        this.conversations = response.conversations || [];
        this.isHistoryLoading = false;
      },
      error: (error) => {
        console.error('Load Conversations Error:', error);
        this.errorMessage = 'Unable to load chat history.';
        this.isHistoryLoading = false;
      }
    });
  }

  // 새로운 대화를 시작합니다.
  // हिंदी: बिना message भेजे केवल खाली chat screen खोलता है।
  // MongoDB में conversation तभी बनेगी जब user पहला message भेजेगा।
  startNewChat(): void {
    if (this.isConversationLoading || this.isLoading) {
      return;
    }

    // 현재 선택된 conversation을 초기화합니다.
    // हिंदी: पुरानी selected conversation को reset करता है।
    this.selectedConversationId = null;

    // 새 채팅 화면을 비웁니다.
    // हिंदी: नई chat के लिए messages और input खाली करता है।
    this.messages = [];
    this.userMessage = '';
    this.errorMessage = '';
  }

  // 기존 대화를 엽니다.
  // हिंदी: History से पुरानी conversation खोलता है।
  
  // 기존 대화를 엽니다.
  // हिंदी: History से पुरानी conversation खोलता है।
  openConversation(conversation: MongoConversation): void {
    this.selectedConversationId = conversation._id;
    this.isConversationLoading = true;
    this.errorMessage = '';

    this.apiService.getMessages(conversation._id).subscribe({
      next: (response) => {
        this.messages = (response.messages || []).map(
          (message: MongoMessage) => {
            if (message.role === 'assistant') {
              return this.formatAssistantMessage(message.content);
            }

            return {
              role: 'user' as const,
              content: message.content
            };
          }
        );

        this.userMessage = '';
        this.isConversationLoading = false;
      },
      error: (error) => {
        console.error('Load Messages Error:', error);
        this.errorMessage = 'Unable to load this conversation.';
        this.isConversationLoading = false;
      }
    });
  }


  // 언어 이름을 표준화합니다.
  // हिंदी: अलग-अलग language names को एक standard नाम में बदलता है।
  private normalizeLanguage(language: string): string {

    const lang = language.trim().toLowerCase();

    const aliases: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      html: 'html',
      htm: 'html',
      xml: 'xml',
      yml: 'json',
      shell: 'bash',
      sh: 'bash',
      zsh: 'bash',
      cs: 'csharp',
      'c#': 'csharp'
    };

    return aliases[lang] || lang || 'text';
  }

  // 코드에 syntax highlighting을 적용합니다.
  // हिंदी: Code में अलग-अलग रंग लगाकर readable बनाता है।
  private highlightCode(code: string, language: string): string {

    const normalizedLanguage = this.normalizeLanguage(language);

    try {

      if (
        normalizedLanguage !== 'text' &&
        hljs.getLanguage(normalizedLanguage)
      ) {

        return hljs.highlight(code, {
          language: normalizedLanguage
        }).value;
      }

      return hljs.highlightAuto(code).value;

    } catch (error) {

      console.error('Highlight error:', error);

      return code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  }

  // Markdown 텍스트를 HTML로 변환합니다.
  // हिंदी: Markdown text को HTML में convert और sanitize करता है।
  private parseMarkdown(content: string): string {

    const parsed = marked.parse(content, {
      async: false
    }) as string;

    return DOMPurify.sanitize(parsed);
  }

  // =========================================
  // OLD LOCAL CHAT CODE
  // हिंदी: पुराना Local Chat code study के लिए सुरक्षित रखा है।
  // =========================================

  /*
  sendMessage(): void {

    const message = this.userMessage.trim();

    if (!message || this.isLoading) {
      return;
    }

    this.messages.push({
      role: 'user',
      content: message
    });

    this.userMessage = '';
    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.sendMessage({
      message,
      agentName: this.agent.name,
      role: this.agent.role,
      instructions: this.agent.instructions
    }).subscribe({

      next: (response) => {

        const reply = response.reply || '';

        this.messages.push({
          role: 'assistant',
          content: reply
        });

        this.isLoading = false;
      },

      error: (error) => {

        console.error('Chat API Error:', error);

        this.errorMessage =
          error.error?.message ||
          'Unable to get AI response. Please try again.';

        this.isLoading = false;
      }
    });
  }
  */

  // AI 메시지를 전송하고 MongoDB에 저장합니다.
  // हिंदी: User और AI दोनों के messages MongoDB में save करता है।
  sendMessage(): void {

    const message = this.userMessage.trim();

    if (!message || this.isLoading || this.isConversationLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // 대화 ID를 확인하고 메시지를 저장합니다.
    // हिंदी: पहले conversation ID प्राप्त करके User message save करता है।
    const saveUserMessage = (conversationId: string): void => {

      this.selectedConversationId = conversationId;

      this.apiService.saveMessage(
        conversationId,
        'user',
        message
      ).subscribe({

        next: () => {

          this.messages.push({
            role: 'user',
            content: message
          });

          this.userMessage = '';

          // Gemini AI에 메시지를 전송합니다.
          // हिंदी: User message save होने के बाद Gemini को भेजता है।
          this.apiService.sendMessage({
            message,
            agentName: this.agent.name,
            role: this.agent.role,
            instructions: this.agent.instructions
          }).subscribe({

            next: (response) => {

              const reply = response.reply || 'No response generated.';

              // AI 응답을 MongoDB에 저장합니다.
              // हिंदी: Gemini का reply MongoDB में save करता है।
              this.apiService.saveMessage(
                conversationId,
                'assistant',
                reply
              ).subscribe({

                next: () => {

                  this.addAssistantReply(reply);
                  this.isLoading = false;

                  // 최신 대화가 위에 표시되도록 목록을 갱신합니다.
                  // हिंदी: Updated conversation history को refresh करता है।
                  this.loadConversations();
                },

                error: (error) => {

                  console.error('Save AI Message Error:', error);

                  this.addAssistantReply(reply);

                  this.errorMessage =
                    'AI replied, but its message could not be saved.';

                  this.isLoading = false;
                }
              });
            },

            error: (error) => {

              console.error('Chat API Error:', error);

              this.errorMessage =
                error.error?.message ||
                'Unable to get AI response. Please try again.';

              this.isLoading = false;
            }
          });
        },

        error: (error) => {

          console.error('Save User Message Error:', error);

          this.errorMessage = 'Unable to save your message.';
          this.isLoading = false;
        }
      });
    };

    // 기존 대화가 있으면 사용하고, 없으면 새로 생성합니다.
    // हिंदी: Conversation ID न होने पर पहली बार नई conversation बनाता है।
    if (this.selectedConversationId) {

      saveUserMessage(this.selectedConversationId);

    } else {

      this.apiService.createConversation(
        this.agent.id,
        message.slice(0, 40) || 'New Chat'
      ).subscribe({

        next: (response) => {

          const conversation = response.conversation;

          this.conversations = [
            conversation,
            ...this.conversations
          ];

          saveUserMessage(conversation._id);
        },

        error: (error) => {

          console.error('Create Conversation Error:', error);

          this.errorMessage = 'Unable to create a new conversation.';
          this.isLoading = false;
        }
      });
    }
  }


  // 하나의 대화와 모든 메시지를 삭제합니다.
  // हिंदी: Selected conversation और उसके सभी messages delete करता है।
  deleteConversation(conversation: MongoConversation, event: Event): void {
    event.stopPropagation();

    const confirmed = confirm(
      `"${conversation.title}" chat को delete करना चाहते हैं? यह वापस नहीं आएगी।`
    );

    if (!confirmed) {
      return;
    }

    this.apiService.deleteConversation(conversation._id).subscribe({
      next: () => {

        // 삭제된 대화를 목록에서 제거합니다.
        // हिंदी: Deleted conversation को sidebar history से हटाता है।
        this.conversations = this.conversations.filter(
          item => item._id !== conversation._id
        );

        // 현재 열려 있는 대화라면 새 채팅 화면으로 이동합니다.
        // हिंदी: अगर यही chat खुली थी, तो खाली New Chat screen दिखाता है।
        if (this.selectedConversationId === conversation._id) {
          this.selectedConversationId = null;
          this.messages = [];
          this.userMessage = '';
        }

        this.errorMessage = '';
      },
      error: (error) => {
        console.error('Delete Conversation Error:', error);
        this.errorMessage = 'Unable to delete conversation. Please try again.';
      }
    });
  }


  // 현재 Agent의 모든 대화와 메시지를 삭제합니다.
  // हिंदी: Current Agent की पूरी chat history और उसके messages delete करता है।
  deleteAllConversations(): void {
    if (this.conversations.length === 0) {
      return;
    }

    const confirmed = confirm(
      'क्या आप इस Agent की पूरी chat history delete करना चाहते हैं? यह वापस नहीं आएगी।'
    );

    if (!confirmed) {
      return;
    }

    this.apiService.deleteAllConversations(this.agent.id).subscribe({
      next: () => {

        // 모든 대화를 화면에서도 초기화합니다.
        // हिंदी: Sidebar history और current chat दोनों खाली करता है।
        this.conversations = [];
        this.selectedConversationId = null;
        this.messages = [];
        this.userMessage = '';
        this.errorMessage = '';
      },
      error: (error) => {
        console.error('Delete All Conversations Error:', error);
        this.errorMessage = 'Unable to clear chat history. Please try again.';
      }
    });
  }


  // AI 응답을 화면에 표시합니다.
  // हिंदी: Gemini reply को Markdown और code highlighting के साथ दिखाता है।
  
  // AI 응답을 Markdown과 코드로 변환합니다.
  // हिंदी: AI reply को formatted Markdown और code में बदलता है।
  private formatAssistantMessage(reply: string): ChatMessage {
    const parts: MessagePart[] = [];

    const codeRegex = /```([^\r\n`]*)\r?\n([\s\S]*?)```/g;

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeRegex.exec(reply)) !== null) {
      const textBeforeCode = reply.slice(lastIndex, match.index);

      if (textBeforeCode.trim()) {
        parts.push({
          type: 'text',
          content: textBeforeCode,
          html: this.parseMarkdown(textBeforeCode)
        });
      }

      const language = this.normalizeLanguage(match[1]);
      const code = match[2].replace(/\r?\n$/, '');

      const highlightedHtml = DOMPurify.sanitize(
        this.highlightCode(code, language),
        {
          ALLOWED_TAGS: ['span'],
          ALLOWED_ATTR: ['class']
        }
      );

      parts.push({
        type: 'code',
        content: code,
        language,
        highlightedHtml
      });

      lastIndex = codeRegex.lastIndex;
    }

    const remainingText = reply.slice(lastIndex);

    if (remainingText.trim()) {
      parts.push({
        type: 'text',
        content: remainingText,
        html: this.parseMarkdown(remainingText)
      });
    }

    return {
      role: 'assistant',
      content: reply,
      parts
    };
  }

  // AI 응답을 화면에 추가합니다.
  // हिंदी: Formatted AI reply को chat में add करता है।
  private addAssistantReply(reply: string): void {
    this.messages.push(this.formatAssistantMessage(reply));
  }


  // 코드 복사 버튼을 처리합니다.
  // हिंदी: Copy Code button से code clipboard में copy करता है।
  async copyCode(code: string, event: MouseEvent): Promise<void> {

    const button = event.currentTarget as HTMLButtonElement;

    try {

      await navigator.clipboard.writeText(code);

      button.textContent = 'Copied!';

      setTimeout(() => {
        button.textContent = 'Copy Code';
      }, 2000);

    } catch (error) {

      console.error('Copy error:', error);

      this.errorMessage =
        'Unable to copy code. Please check browser permissions.';
    }
  }
}
