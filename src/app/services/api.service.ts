
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface HealthResponse {
  success: boolean;
  message: string;
  koreanMessage: string;
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

  private readonly apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // 서버 상태를 확인합니다.
  // हिंदी: Backend server का status check करता है।
  checkHealth(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(
      `${this.apiUrl}/health`
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
