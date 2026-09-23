const fs = require('fs');
let code = fs.readFileSync('packages/boardgame-core/src/engine/baseReducer.ts', 'utf8');

code = code.replace(
  "    case 'SEND_CHAT_MESSAGE': {\\n      return {\\n        ...state,\\n        chatMessages: [...state.chatMessages, action.payload]\\n      };\\n    }",
  "    case 'SEND_CHAT_MESSAGE': {\\n      return {\\n        ...state,\\n        chatMessages: [...state.chatMessages, action.payload]\\n      };\\n    }\\n    case 'UPDATE_SETTINGS': {\\n      return {\\n        ...state,\\n        settings: action.payload\\n      };\\n    }"
);

fs.writeFileSync('packages/boardgame-core/src/engine/baseReducer.ts', code);
