
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dns = require('dns');
const Agent = require('./models/Agent');

// 대화 및 메시지 모델을 가져옵니다.
// हिंदी: Conversation और Message के MongoDB models import करता है।
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');

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


// 새로운 대화를 생성합니다.
// हिंदी: किसी Agent के लिए नई conversation MongoDB में create करता है।
app.post('/api/agents/:agentId/conversations', async (req, res) => {
  try {
    const { agentId } = req.params;

    // Agent ID가 유효한지 확인합니다.
    // हिंदी: Agent ID valid है या नहीं check करता है।
    if (!mongoose.isValidObjectId(agentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid agent ID.'
      });
    }

    // Agent가 MongoDB에 존재하는지 확인합니다.
    // हिंदी: Check करता है कि Agent MongoDB में मौजूद है।
    const agent = await Agent.findById(agentId);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found.'
      });
    }

    // 새로운 conversation을 저장합니다.
    // हिंदी: नई conversation MongoDB में save करता है।
    const conversation = await Conversation.create({
      agentId,
      title: req.body.title?.trim() || 'New Chat'
    });

    res.status(201).json({
      success: true,
      message: 'Conversation created successfully.',
      conversation
    });

  } catch (error) {
    console.error('Create Conversation Error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Unable to create conversation.'
    });
  }
});


// Agent의 모든 대화 목록을 가져옵니다.
// हिंदी: किसी Agent की सभी पुरानी conversations लाता है।
app.get('/api/agents/:agentId/conversations', async (req, res) => {
  try {
    const { agentId } = req.params;

    // Agent ID가 유효한지 확인합니다.
    // हिंदी: Agent ID validate करता है।
    if (!mongoose.isValidObjectId(agentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid agent ID.'
      });
    }

    // Agent가 존재하는지 확인합니다.
    // हिंदी: Agent की मौजूदगी check करता है।
    const agent = await Agent.findById(agentId);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found.'
      });
    }

    // 해당 Agent의 대화 목록을 가져옵니다.
    // हिंदी: केवल इसी Agent की conversations लाता है।
    const conversations = await Conversation.find({ agentId })
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      conversations
    });

  } catch (error) {
    console.error('Get Conversations Error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Unable to fetch conversations.'
    });
  }
});


// 특정 대화와 모든 메시지를 삭제합니다.
// हिंदी: एक conversation और उसके सभी messages delete करता है।
app.delete('/api/conversations/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;

    // 대화 ID가 유효한지 확인합니다.
    // हिंदी: Conversation ID valid है या नहीं check करता है।
    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID.'
      });
    }

    // 삭제할 대화를 찾습니다.
    // हिंदी: Delete की जाने वाली conversation को ढूँढता है।
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.'
      });
    }

    // 대화에 연결된 모든 메시지를 삭제합니다.
    // हिंदी: इस conversation के सभी messages delete करता है।
    await Message.deleteMany({ conversationId });

    // 대화를 삭제합니다.
    // हिंदी: MongoDB से conversation delete करता है।
    await Conversation.findByIdAndDelete(conversationId);

    res.json({
      success: true,
      message: 'Conversation deleted successfully.'
    });

  } catch (error) {
    console.error('Delete Conversation Error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Unable to delete conversation.'
    });
  }
});


// 특정 Agent의 모든 대화와 메시지를 삭제합니다.
// हिंदी: Current Agent की पूरी chat history और messages delete करता है।
app.delete('/api/agents/:agentId/conversations', async (req, res) => {
  try {
    const { agentId } = req.params;

    // Agent ID가 유효한지 확인합니다.
    // हिंदी: Agent ID valid है या नहीं check करता है।
    if (!mongoose.isValidObjectId(agentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid agent ID.'
      });
    }

    // Agent가 존재하는지 확인합니다.
    // हिंदी: Check करता है कि Agent मौजूद है।
    const agent = await Agent.findById(agentId);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found.'
      });
    }

    // 해당 Agent의 모든 대화 ID를 가져옵니다.
    // हिंदी: इस Agent की सभी conversations की IDs लाता है।
    const conversations = await Conversation.find({ agentId }).select('_id');
    const conversationIds = conversations.map(conversation => conversation._id);

    // 해당 대화들의 모든 메시지를 삭제합니다.
    // हिंदी: इन conversations के सभी messages delete करता है।
    await Message.deleteMany({
      conversationId: { $in: conversationIds }
    });

    // 해당 Agent의 모든 대화를 삭제합니다.
    // हिंदी: इस Agent की सभी conversations delete करता है।
    await Conversation.deleteMany({ agentId });

    res.json({
      success: true,
      message: 'All chat history deleted successfully.'
    });

  } catch (error) {
    console.error('Delete All Conversations Error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Unable to delete chat history.'
    });
  }
});


// 새로운 메시지를 저장합니다.
// हिंदी: User या AI का message MongoDB में save करता है।
app.post('/api/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { role, content } = req.body;

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID.'
      });
    }

    if (!['user', 'assistant'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message role.'
      });
    }

    if (typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required.'
      });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.'
      });
    }

    const message = await Message.create({
      conversationId,
      role,
      content: content.trim()
    });

    // 대화의 수정 시간을 업데이트합니다.
    // हिंदी: Conversation की updatedAt date update करता है।
    conversation.updatedAt = new Date();
    await conversation.save();

    res.status(201).json({
      success: true,
      message: 'Message saved successfully.',
      data: message
    });

  } catch (error) {
    console.error('Save Message Error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Unable to save message.'
    });
  }
});


// 기존 대화의 모든 메시지를 가져옵니다.
// हिंदी: किसी conversation के सभी पुराने messages लाता है।
app.get('/api/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID.'
      });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.'
      });
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      messages
    });

  } catch (error) {
    console.error('Get Messages Error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Unable to fetch messages.'
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
