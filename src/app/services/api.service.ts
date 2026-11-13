
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

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  // 로컬 백엔드 주소입니다.
  // हिंदी: Local development में local backend से connect करता है।
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
}
