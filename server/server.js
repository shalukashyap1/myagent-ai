
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dns = require('dns');
const Agent = require('./models/Agent');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 로컬 개발 환경에서 DNS 서버를 설정합니다.
// हिंदी: Local development में Google DNS का उपयोग करता है।
if (process.env.NODE_ENV !== 'production') {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}

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

// MongoDB 데이터베이스에 연결합니다.
// हिंदी: MongoDB database से connection बनाता है।
const connectDatabase = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing in .env file');
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 15000
  });

  console.log('MongoDB connected successfully!');
};

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
// हिंदी: Backend और MongoDB का status check करता है।
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'MyAgent AI backend is running!',
    koreanMessage: '서버가 정상적으로 실행 중입니다.',
    database: mongoose.connection.readyState === 1
      ? 'Connected'
      : 'Disconnected'
  });
});

// 모든 에이전트를 가져옵니다.
// हिंदी: MongoDB से सभी Agents लाता है।
app.get('/api/agents', async (req, res) => {
  try {
    const agents = await Agent.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      agents
    });
  } catch (error) {
    console.error('Get Agents Error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Unable to fetch agents.'
    });
  }
});

// 새로운 에이전트를 생성합니다.
// हिंदी: नया Agent MongoDB में save करता है।
app.post('/api/agents', async (req, res) => {
  try {
    const { name, role, instructions } = req.body;

    if (
      typeof name !== 'string' || !name.trim() ||
      typeof role !== 'string' || !role.trim() ||
      typeof instructions !== 'string' || !instructions.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Name, role and instructions are required.'
      });
    }

    const agent = await Agent.create({
      name: name.trim(),
      role: role.trim(),
      instructions: instructions.trim()
    });

    res.status(201).json({
      success: true,
      message: 'Agent created successfully.',
      agent
    });
  } catch (error) {
    console.error('Create Agent Error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Unable to create agent.'
    });
  }
});

// 에이전트를 삭제합니다.
// हिंदी: MongoDB से Agent delete करता है।
app.delete('/api/agents/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid agent ID.'
      });
    }

    const agent = await Agent.findByIdAndDelete(id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found.'
      });
    }

    res.json({
      success: true,
      message: 'Agent deleted successfully.'
    });
  } catch (error) {
    console.error('Delete Agent Error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Unable to delete agent.'
    });
  }
});



// 에이전트 정보를 수정합니다.
// हिंदी: MongoDB में existing Agent की details update करता है।
app.put('/api/agents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, instructions } = req.body;

    // 에이전트 ID가 유효한지 확인합니다.
    // हिंदी: Check करता है कि Agent ID valid है या नहीं।
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid agent ID.'
      });
    }

    // 필수 입력값을 확인합니다.
    // हिंदी: सभी required fields को validate करता है।
    if (
      typeof name !== 'string' || !name.trim() ||
      typeof role !== 'string' || !role.trim() ||
      typeof instructions !== 'string' || !instructions.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Name, role and instructions are required.'
      });
    }

    // MongoDB에서 에이전트 정보를 수정합니다.
    // हिंदी: MongoDB में Agent की details update करता है।
    const updatedAgent = await Agent.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        role: role.trim(),
        instructions: instructions.trim()
      },
      {
        new: true,
        runValidators: true
      }
    );

    // 에이전트를 찾을 수 없는 경우 처리합니다.
    // हिंदी: Agent नहीं मिलने पर 404 response देता है।
    if (!updatedAgent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found.'
      });
    }

    res.json({
      success: true,
      message: 'Agent updated successfully.',
      agent: updatedAgent
    });

  } catch (error) {
    console.error('Update Agent Error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Unable to update agent.'
    });
  }
});


// Gemini AI에 메시지를 전송합니다.
// हिंदी: User का message Gemini AI को भेजता है।
app.post('/api/chat', async (req, res) => {
  try {
    const { message, agentName, role, instructions } = req.body;

    if (typeof message !== 'string' || !message.trim()) {
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

// 데이터베이스 연결 후 서버를 실행합니다.
// हिंदी: Database connect होने के बाद backend server start करता है।
const startServer = async () => {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`MyAgent AI server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
};

startServer();
