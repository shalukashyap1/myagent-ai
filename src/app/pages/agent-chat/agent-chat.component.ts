
import { marked } from 'marked';
import DOMPurify from 'dompurify';

import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

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
  id: number;
  name: string;
  role: string;
  instructions: string;
}

@Component({
  selector: 'app-agent-chat',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './agent-chat.component.html',
  styleUrl: './agent-chat.component.scss'
})
export class AgentChatComponent {

  @Input() agent!: Agent;
  @Output() back = new EventEmitter<void>();

  userMessage = '';
  messages: ChatMessage[] = [];

  isLoading = false;
  errorMessage = '';

  constructor(private apiService: ApiService) {}

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

  // AI 메시지를 전송합니다.
  // हिंदी: User का message Backend और Gemini AI को भेजता है।
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

        const parts: MessagePart[] = [];

        // 코드 블록을 찾습니다.
        // हिंदी: AI response में code blocks को पहचानता है।
        const codeRegex = /```([^\r\n`]*)\r?\n([\s\S]*?)```/g;

        let lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = codeRegex.exec(reply)) !== null) {

          const textBeforeCode = reply.slice(
            lastIndex,
            match.index
          );

          // 코드 앞의 일반 텍스트를 저장합니다.
          // हिंदी: Code से पहले वाले सामान्य text को store करता है।
          if (textBeforeCode.trim()) {

            parts.push({
              type: 'text',
              content: textBeforeCode,
              html: this.parseMarkdown(textBeforeCode)
            });
          }

          const language = this.normalizeLanguage(match[1]);

          const code = match[2].replace(/\r?\n$/, '');

          // 코드에 색상을 적용합니다.
          // हिंदी: Code में syntax highlighting लगाता है।
          const highlightedHtml = DOMPurify.sanitize(
            this.highlightCode(code, language),
            {
              ALLOWED_TAGS: ['span'],
              ALLOWED_ATTR: ['class']
            }
          );

          // 코드 블록을 저장합니다.
          // हिंदी: Highlighted code को अलग से store करता है।
          parts.push({
            type: 'code',
            content: code,
            language,
            highlightedHtml
          });

          lastIndex = codeRegex.lastIndex;
        }

        // 마지막 코드 뒤의 텍스트를 저장합니다.
        // हिंदी: Last code block के बाद बचा हुआ text store करता है।
        const remainingText = reply.slice(lastIndex);

        if (remainingText.trim()) {

          parts.push({
            type: 'text',
            content: remainingText,
            html: this.parseMarkdown(remainingText)
          });
        }

        // AI 응답을 채팅 목록에 추가합니다.
        // हिंदी: AI का पूरा response chat में add करता है।
        this.messages.push({
          role: 'assistant',
          content: reply,
          parts
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
