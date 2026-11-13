
const mongoose = require('mongoose');

// 에이전트 데이터 구조를 정의합니다.
// हिंदी: Agent के data का structure define करता है।
const agentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Agent name is required'],
      trim: true
    },

    role: {
      type: String,
      required: [true, 'Agent role is required'],
      trim: true
    },

    instructions: {
      type: String,
      required: [true, 'Agent instructions are required'],
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// 에이전트 모델을 생성합니다.
// हिंदी: MongoDB में Agent model बनाता है।
const Agent = mongoose.model('Agent', agentSchema);

module.exports = Agent;
