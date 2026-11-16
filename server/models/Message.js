
const mongoose = require('mongoose');

// 메시지 데이터 구조를 정의합니다.
// हिंदी: हर chat message का structure define करता है।
const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    content: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Message = mongoose.model(
  'Message',
  messageSchema
);

module.exports = Message;
