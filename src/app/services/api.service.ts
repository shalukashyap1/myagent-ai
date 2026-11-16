
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// 서버 상태 응답 데이터입니다.
// हिंदी: Backend health check का response structure।
export interface HealthResponse {
  success: boolean;
  message: string;
  koreanMessage: string;
  database?: string;
}

// 에이전트 데이터 구조입니다.
// हिंदी: MongoDB में save होने वाले Agent का structure।
export interface MongoAgent {
  _id: string;
  name: string;
  role: string;
  instructions: string;
  createdAt: string;
  updatedAt: string;
}

// 에이전트 생성 요청 데이터입니다.
// हिंदी: नया Agent create करने के लिए भेजा जाने वाला data।
export interface CreateAgentRequest {
  name: string;
  role: string;
  instructions: string;
}

// 에이전트 목록 응답 데이터입니다.
// हिंदी: MongoDB से मिलने वाली Agents list का response।
export interface AgentsResponse {
  success: boolean;
  agents: MongoAgent[];
}

// 에이전트 생성 응답 데이터입니다.
// हिंदी: नया Agent save होने के बाद मिलने वाला response।
export interface CreateAgentResponse {
  success: boolean;
  message: string;
  agent: MongoAgent;
}

// 에이전트 삭제 응답 데이터입니다.
// हिंदी: Agent delete होने के बाद मिलने वाला response।
export interface DeleteAgentResponse {
  success: boolean;
  message: string;
}

// 대화 삭제 응답 데이터입니다.
// हिंदी: Chat या पूरी history delete होने के बाद मिलने वाला response।
export interface DeleteConversationResponse {
  success: boolean;
  message: string;
}

// 채팅 요청 데이터입니다.
// हिंदी: Chat API को भेजे जाने वाले data का structure।
export interface ChatRequest {
  message: string;
  agentName: string;
  role: string;
  instructions: string;
}

// 채팅 응답 데이터입니다.
// हिंदी: Gemini से मिलने वाले response का structure।
export interface ChatResponse {
  success: boolean;
  reply: string;
}

// 대화 데이터 구조입니다.
// हिंदी: Conversation का data structure।
export interface MongoConversation {
  _id: string;
  agentId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

// 메시지 데이터 구조입니다.
// हिंदी: MongoDB में save होने वाले message का structure।
export interface MongoMessage {
  _id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  updatedAt: string;
}

// 대화 및 메시지 응답 구조입니다.
// हिंदी: Conversation और messages API का response structure।
export interface ConversationsResponse {
  success: boolean;
  conversations: MongoConversation[];
}

export interface MessagesResponse {
  success: boolean;
  messages: MongoMessage[];
}

export interface SaveMessageResponse {
  success: boolean;
  message: string;
  data: MongoMessage;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  // API 서버 주소입니다.
  // हिंदी: Local और Production के लिए सही Backend URL चुनता है।
  private readonly apiUrl =
    window.location.hostname === 'localhost'
      ? 'http://localhost:3000/api'
      : 'https://myagent-ai.onrender.com/api';

  constructor(private http: HttpClient) {}

  // 서버 상태를 확인합니다.
  // हिंदी: Backend server और database का status check करता है।
  checkHealth(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(
      `${this.apiUrl}/health`
    );
  }

  // 모든 에이전트를 가져옵니다.
  // हिंदी: MongoDB से सभी Agents लाता है।
  getAgents(): Observable<AgentsResponse> {
    return this.http.get<AgentsResponse>(
      `${this.apiUrl}/agents`
    );
  }

  // 새로운 에이전트를 생성합니다.
  // हिंदी: नया Agent MongoDB में save करता है।
  createAgent(data: CreateAgentRequest): Observable<CreateAgentResponse> {
    return this.http.post<CreateAgentResponse>(
      `${this.apiUrl}/agents`,
      data
    );
  }

  // 에이전트를 삭제합니다.
  // हिंदी: MongoDB से Agent delete करता है।
  deleteAgent(id: string): Observable<DeleteAgentResponse> {
    return this.http.delete<DeleteAgentResponse>(
      `${this.apiUrl}/agents/${id}`
    );
  }

  // 에이전트 정보를 수정합니다.
  // हिंदी: Existing Agent की details update करता है।
  updateAgent(
    id: string,
    data: CreateAgentRequest
  ): Observable<CreateAgentResponse> {
    return this.http.put<CreateAgentResponse>(
      `${this.apiUrl}/agents/${id}`,
      data
    );
  }

  // Gemini AI에 메시지를 전송합니다.
  // हिंदी: User का message Gemini AI को भेजता है।
  sendMessage(data: ChatRequest): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(
      `${this.apiUrl}/chat`,
      data
    );
  }

  // 새로운 대화를 생성합니다.
  // हिंदी: किसी Agent के लिए नई conversation बनाता है।
  createConversation(
    agentId: string,
    title = 'New Chat'
  ): Observable<{ success: boolean; conversation: MongoConversation }> {
    return this.http.post<{ success: boolean; conversation: MongoConversation }>(
      `${this.apiUrl}/agents/${agentId}/conversations`,
      { title }
    );
  }

  // Agent의 모든 대화 목록을 가져옵니다.
  // हिंदी: Agent की सभी पुरानी conversations लाता है।
  getConversations(agentId: string): Observable<ConversationsResponse> {
    return this.http.get<ConversationsResponse>(
      `${this.apiUrl}/agents/${agentId}/conversations`
    );
  }

  // 메시지를 MongoDB에 저장합니다.
  // हिंदी: User या AI message को MongoDB में save करता है।
  saveMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string
  ): Observable<SaveMessageResponse> {
    return this.http.post<SaveMessageResponse>(
      `${this.apiUrl}/conversations/${conversationId}/messages`,
      { role, content }
    );
  }

  // 기존 대화의 메시지를 가져옵니다.
  // हिंदी: पुरानी conversation के सभी messages लाता है।
  getMessages(conversationId: string): Observable<MessagesResponse> {
    return this.http.get<MessagesResponse>(
      `${this.apiUrl}/conversations/${conversationId}/messages`
    );
  }

  // 하나의 대화와 모든 메시지를 삭제합니다.
  // हिंदी: एक conversation और उसके सभी messages delete करता है।
  deleteConversation(
    conversationId: string
  ): Observable<DeleteConversationResponse> {
    return this.http.delete<DeleteConversationResponse>(
      `${this.apiUrl}/conversations/${conversationId}`
    );
  }

  // 특정 Agent의 모든 대화와 메시지를 삭제합니다.
  // हिंदी: Current Agent की पूरी chat history और messages delete करता है।
  deleteAllConversations(
    agentId: string
  ): Observable<DeleteConversationResponse> {
    return this.http.delete<DeleteConversationResponse>(
      `${this.apiUrl}/agents/${agentId}/conversations`
    );
  }

}
