
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface HealthResponse {
  success: boolean;
  message: string;
  koreanMessage: string;
  database?: string;
}

export interface MongoAgent {
  _id: string;
  name: string;
  role: string;
  instructions: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentRequest {
  name: string;
  role: string;
  instructions: string;
}

export interface AgentsResponse {
  success: boolean;
  agents: MongoAgent[];
}

export interface CreateAgentResponse {
  success: boolean;
  message: string;
  agent: MongoAgent;
}

export interface DeleteAgentResponse {
  success: boolean;
  message: string;
}

export interface DeleteConversationResponse {
  success: boolean;
  message: string;
}

export interface ChatRequest {
  message: string;
  agentName: string;
  role: string;
  instructions: string;
}

export interface ChatResponse {
  success: boolean;
  reply: string;
}

export interface MongoConversation {
  _id: string;
  agentId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface MongoMessage {
  _id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  updatedAt: string;
}

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

// 대시보드 통계 응답 구조
// हिंदी: Dashboard statistics API का response structure।
export interface DashboardStatsResponse {
  success: boolean;
  stats: {
    totalConversations: number;
    totalMessages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private readonly apiUrl =
    window.location.hostname === 'localhost'
      ? 'http://localhost:3000/api'
      : 'https://myagent-ai.onrender.com/api';

  constructor(private http: HttpClient) {}

  checkHealth(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(
      `${this.apiUrl}/health`
    );
  }

  getAgents(): Observable<AgentsResponse> {
    return this.http.get<AgentsResponse>(
      `${this.apiUrl}/agents`
    );
  }

  createAgent(data: CreateAgentRequest): Observable<CreateAgentResponse> {
    return this.http.post<CreateAgentResponse>(
      `${this.apiUrl}/agents`,
      data
    );
  }

  deleteAgent(id: string): Observable<DeleteAgentResponse> {
    return this.http.delete<DeleteAgentResponse>(
      `${this.apiUrl}/agents/${id}`
    );
  }

  updateAgent(id: string, data: CreateAgentRequest): Observable<CreateAgentResponse> {
    return this.http.put<CreateAgentResponse>(
      `${this.apiUrl}/agents/${id}`,
      data
    );
  }

  sendMessage(data: ChatRequest): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(
      `${this.apiUrl}/chat`,
      data
    );
  }

  createConversation(
    agentId: string,
    title = 'New Chat'
  ): Observable<{ success: boolean; conversation: MongoConversation }> {
    return this.http.post<{ success: boolean; conversation: MongoConversation }>(
      `${this.apiUrl}/agents/${agentId}/conversations`,
      { title }
    );
  }

  getConversations(agentId: string): Observable<ConversationsResponse> {
    return this.http.get<ConversationsResponse>(
      `${this.apiUrl}/agents/${agentId}/conversations`
    );
  }

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

  getMessages(conversationId: string): Observable<MessagesResponse> {
    return this.http.get<MessagesResponse>(
      `${this.apiUrl}/conversations/${conversationId}/messages`
    );
  }

  deleteConversation(conversationId: string): Observable<DeleteConversationResponse> {
    return this.http.delete<DeleteConversationResponse>(
      `${this.apiUrl}/conversations/${conversationId}`
    );
  }

  deleteAllConversations(agentId: string): Observable<DeleteConversationResponse> {
    return this.http.delete<DeleteConversationResponse>(
      `${this.apiUrl}/agents/${agentId}/conversations`
    );
  }

  // 대시보드 메시지 통계를 가져옵니다.
  // हिंदी: Dashboard के लिए MongoDB से total messages count लाता है।
  getDashboardStats(): Observable<DashboardStatsResponse> {
    return this.http.get<DashboardStatsResponse>(
      `${this.apiUrl}/dashboard/stats`
    );
  }

}
