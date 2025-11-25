// ===== CONFIGURATION =====
const BOT_TOKEN = '8422136188:AAHljCDC6FWQPtW38HDuh8-2PWCTeFueSG0';
const OWNER_ID = 7217149295;
const WEBHOOK_SECRET = 'Anon';

// Fixed sans style font map (using your emoticon style)
const fontMaps = {
  sans: {
    lower: 'ǟɮƈɖɛʄɢɦɨʝӄʟʍռօքզʀֆȶʊʋաӼʏʐ',
    upper: 'ǟɮƈɖɛʄɢɦɨʝӄʟʍռօքզʀֆȶʊʋաӼʏʐ',
    numbers: '1234567890'
  }
};

const normalAlphabet = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '1234567890'
};

function convertFont(text) {
  const font = fontMaps.sans;
  return text.split('').map(ch => {
    let idx = normalAlphabet.lower.indexOf(ch);
    if (idx !== -1 && font.lower[idx]) return font.lower[idx];
    idx = normalAlphabet.upper.indexOf(ch);
    if (idx !== -1 && font.upper[idx]) return font.upper[idx];
    idx = normalAlphabet.numbers.indexOf(ch);
    if (idx !== -1 && font.numbers[idx]) return font.numbers[idx];
    return ch;
  }).join('');
}

// Telegram API request helper
async function apiRequest(method, body) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return resp.json();
}
async function sendMessage(chatId, text, replyMarkup = null) {
  return apiRequest('sendMessage', {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
  });
}
async function editMessage(chatId, messageId, text, replyMarkup = null) {
  return apiRequest('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text: text,
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
  });
}
async function answerCallback(callbackQueryId) {
  return apiRequest('answerCallbackQuery', { callback_query_id: callbackQueryId });
}
async function copyMessage(fromChatId, messageId, toChatId) {
  return apiRequest('copyMessage', {
    chat_id: toChatId,
    from_chat_id: fromChatId,
    message_id: messageId,
  });
}

// KV storage helpers
async function getUserFont(userId, env) {
  return 'sans'; // fixed font style, ignore KV
}
async function setUserFont(userId, font, env) {
  // no-op, fixed font
}
async function getChannelId(env) {
  return await env.BOT_KV.get('settings:channel_id');
}
async function setChannelId(channelId, env) {
  await env.BOT_KV.put('settings:channel_id', channelId);
}
async function saveFileMetadata(fileId, metadata, env) {
  await env.BOT_KV.put(`file:${fileId}`, JSON.stringify(metadata));
}
async function savePendingUpload(userId, fileInfo, env) {
  await env.BOT_KV.put(`pending:${userId}`, JSON.stringify(fileInfo), { expirationTtl: 300 });
}
async function getPendingUpload(userId, env) {
  const data = await env.BOT_KV.get(`pending:${userId}`);
  return data ? JSON.parse(data) : null;
}
async function deletePendingUpload(userId, env) {
  await env.BOT_KV.delete(`pending:${userId}`);
}

// Interactive help commands & descriptions using emoticons you gave
const helpInfo = {
  '/start': '✿ Starts the bot and shows welcome message.',
  '/help': '✿ Shows this help menu where you can select commands.',
  '/files': '✿ Lists uploaded files with pagination.',
  '/cancel': '✿ Cancels the current action.',
  '/setchannel': '✿ Owner only: Set channel for file forwarding.',
  '/stats': '✿ Owner only: View bot stats.'
};

function generateHelpKeyboard() {
  const buttons = [];
  for (const cmd in helpInfo) {
    buttons.push([{ text: cmd, callback_data: `help_${cmd}` }]);
  }
  return { inline_keyboard: buttons };
}

async function handleStart(msg) {
  const text = [
    '[translate:「 ✦ ᴡᴇʟᴄᴏᴍᴇ ✦ 」]',
    '────୨ৎ────',
    '[translate:ɦɛʟʟօ ȶɦɛʀɛ, աɛʟƈօʍɛ ȶօ ȶɦɛ ʄɨʟɛ ʊքʟօǟɖ ɮօȶ]',
    '[translate:ɨ ǟʍ ɦɛʀɛ ȶօ ɦɛʟք ʏօʊ ֆɛƈʊʀɛʟʏ ֆȶօʀɛ ǟռɖ ʍǟռǟɢɛ ʏօʊʀ ʄɨʟɛֆ աɨȶɦ ƈǟʀɛ ǟռɖ ɖɛɖɨƈǟȶɨօռ]',
    '',
    '[translate:✿ ƈǟռ ʏօʊ ֆɛɛ ǟʟʟ ȶɦɛֆɛ ʄօռȶֆ ǟռɖ ɖɛƈօʀǟȶɨօռֆ քʀօքɛʀʟʏ?]',
    '',
    '[translate:﹌﹌﹌﹌﹌﹌﹌]',
    '',
    '「 ✦ Please send any file to upload ✦ 」',
    'Use /help to get command list.'
  ].join('\n');
  await sendMessage(msg.chat.id, convertFont(text), null);
}

async function handleHelpMenu(msg) {
  const keyboard = generateHelpKeyboard();
  await sendMessage(msg.chat.id, convertFont('✿ Please select a command:'), keyboard);
}

async function handleHelpCommandCallback(callback) {
  const chatId = callback.message.chat.id;
  const messageId = callback.message.message_id;
  const command = callback.data.replace('help_', '');
  const description = helpInfo[command] || 'No info available.';
  const text = `${command}\n\n${description}`;
  await editMessage(chatId, messageId, convertFont(text), generateHelpKeyboard());
  await answerCallback(callback.id);
}

async function handleFileReceived(msg, env) {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const file = msg.document || (msg.photo && msg.photo[msg.photo.length - 1]) || msg.video || msg.audio;
  if (!file) return;
  const fileName = file.file_name || (msg.photo ? '[translate:ʄօȶօ]' : msg.video ? '[translate:ʋɨɖɛօ]' : msg.audio ? '[translate:ɖɨʋɛ]' : '[translate:ʄɨʟɛ]');
  const fileSizeMB = ((file.file_size || 0) / 1024 / 1024).toFixed(2);
  const fileInfo = {
    chatId,
    messageId: msg.message_id,
    fileId: file.file_id,
    fileName,
    fileSize: file.file_size || 0,
    fileType: msg.document ? 'document' : (msg.photo ? 'photo' : msg.video ? 'video' : 'audio')
  };
  await savePendingUpload(userId, fileInfo, env);

  const text = convertFont(
    `✿ Upload this file?\n\n${fileName}\n[translate:ֆɨʐɛ]: ${fileSizeMB} MB`
  );
  const keyboard = {
    inline_keyboard: [[
      { text: '✅ [translate:Yes]', callback_data: 'upload_yes' },
      { text: '❌ [translate:No]', callback_data: 'upload_no' }
    ]]
  };
  await sendMessage(chatId, text, keyboard);
}

async function handleUploadConfirm(callback, env) {
  const userId = callback.from.id;
  const fileInfo = await getPendingUpload(userId, env);
  if (!fileInfo) {
    await editMessage(callback.message.chat.id, callback.message.message_id,
      convertFont('✿ [translate:Upload expired. Send the file again.]'));
    return;
  }
  const channelId = await getChannelId(env);
  const result = await copyMessage(fileInfo.chatId, fileInfo.messageId, channelId);
  if (result.ok) {
    await saveFileMetadata(fileInfo.fileId, { ...fileInfo, channelMessageId: result.result.message_id }, env);
    await deletePendingUpload(userId, env);
    await editMessage(callback.message.chat.id, callback.message.message_id,
      convertFont('✅ [translate:File uploaded successfully]'));
  } else {
    await editMessage(callback.message.chat.id, callback.message.message_id,
      convertFont('❌ [translate:Upload failed, try again]'));
  }
}

async function handleUploadCancel(callback, env) {
  const userId = callback.from.id;
  await deletePendingUpload(userId, env);
  await editMessage(callback.message.chat.id, callback.message.message_id,
    convertFont('✿ [translate:Upload cancelled]'));
}

async function handleCallback(callback, env) {
  const data = callback.data;
  if (data.startsWith('help_')) {
    await handleHelpCommandCallback(callback);
    return;
  }
  if (data === 'upload_yes') {
    await handleUploadConfirm(callback, env);
    return;
  }
  if (data === 'upload_no') {
    await handleUploadCancel(callback, env);
    return;
  }
  await answerCallback(callback.id);
}

async function handleUpdate(update, env) {
  try {
    if (update.message) {
      const msg = update.message;
      const text = msg.text || '';
      if (text === '/start') {
        return handleStart(msg);
      }
      if (text === '/help') {
        return handleHelpMenu(msg);
      }
      if (msg.document || msg.photo || msg.video || msg.audio) {
        return handleFileReceived(msg, env);
      }
      await sendMessage(msg.chat.id, convertFont('[translate:Unknown command. Use /help]'));
    } else if (update.callback_query) {
      await handleCallback(update.callback_query, env);
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

async function registerWebhook(request) {
  const url = new URL(request.url);
  const webhookUrl = `${url.protocol}//${url.host}/webhook`;
  const res = await apiRequest('setWebhook', { url: webhookUrl, secret_token: WEBHOOK_SECRET });
  return new Response(JSON.stringify(res), { headers: { 'Content-Type': 'application/json' } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/registerWebhook') return registerWebhook(request);
    if (url.pathname === '/webhook' && request.method === 'POST') {
      const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
      if (secret !== WEBHOOK_SECRET) return new Response('Unauthorized', { status: 401 });
      const update = await request.json();
      await handleUpdate(update, env);
      return new Response('OK');
    }
    return new Response('Telegram File Upload Bot Running', { status: 200 });
  }
};
