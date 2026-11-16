
const mongoose = require('mongoose');

// 대화 데이터 구조를 정의합니다.
// हिंदी: हर Agent की conversation का structure define करता है।
const conversationSchema = new mongoose.Schema(
  {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      required: true,
      index: true
    },
    title: {
      type: String,
      default: 'New Chat',
      trim: true
    }
  },
  {
    timestamps: true
  }
);

const Conversation = mongoose.model(
  'Conversation',
  conversationSchema
);

module.exports = Conversation;
