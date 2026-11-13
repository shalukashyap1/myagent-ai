
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 허용된 프론트엔드 주소를 설정합니다.
// हिंदी: Local और live frontend URLs को allow करता है।
const allowedOrigins = [
  'http://localhost:4200',
  'https://myagent-ai-rosy.vercel.app'
];

// CORS 요청을 처리합니다.
// हिंदी: Allowed frontend से आने वाली requests को अनुमति देता है।
app.use(cors({
  origin: allowedOrigins
}));

// Gemini AI 클라이언트를 초기화합니다.
// हिंदी: Gemini AI client को initialize करता है।
const genAIClientPromise = import('@google/genai').then(({ GoogleGenAI }) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing in .env file');
  }

  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });
});

// 서버 상태를 확인합니다.
// हिंदी: Backend server का status check करता है।
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'MyAgent AI backend is running!',
    koreanMessage: '서버가 정상적으로 실행 중입니다.'
  });
});

// Gemini AI에 메시지를 전송합니다.
// हिंदी: User का message Gemini AI को भेजता है।
app.post('/api/chat', async (req, res) => {
  try {
    const { message, agentName, role, instructions } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a message.'
      });
    }

    const ai = await genAIClientPromise;

    const prompt = `
      You are ${agentName || 'MyAgent AI'}.
      Your role is: ${role || 'AI Assistant'}.
      Follow these instructions: ${instructions || 'Help the user clearly and accurately.'}

      User message: ${message}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: prompt
    });

    res.json({
      success: true,
      reply: response.text || 'No response generated.'
    });

  } catch (error) {
    console.error('Gemini API Error:', error.message);

    res.status(500).json({
      success: false,
      message: 'AI response failed. Please check your API key and try again.'
    });
  }
});

// 서버를 실행합니다.
// हिंदी: Backend server start करता है।
app.listen(PORT, () => {
  console.log(`MyAgent AI server running on port ${PORT}`);
});
