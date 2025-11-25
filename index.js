// ===== CONFIGURATION =====
const BOT_TOKEN = '8422136188:AAHljCDC6FWQPtW38HDuh8-2PWCTeFueSG0';
const OWNER_ID = 7217149295;  // Your Telegram user ID
const WEBHOOK_SECRET = 'Anon'; // Your webhook secret

// ===== FONT MAPS =====
const fontMaps = {
  fraktur: {
    lower: '𝖆𝖇𝖈𝖉𝖊𝖋𝖌𝖍𝖎𝖏𝖐𝖑𝖒𝖓𝖔𝖕𝖖𝖗𝖘𝖙𝖚𝖛𝖜𝖝𝖞𝖟',
    upper: '𝕬𝕭𝕮𝕯𝕰𝕱𝕲𝕳𝕴𝕵𝕶𝕷𝕸𝕹𝕺𝕻𝕼𝕽𝕾𝕿𝖀𝖁𝖂𝖃𝖄𝖅',
    numbers: '1234567890'
  },
  circled: {
    lower: 'ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ',
    upper: 'ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ',
    numbers: '①②③④⑤⑥⑦⑧⑨⑩'
  },
  cursive: {
    lower: '𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃',
    upper: '𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩',
    numbers: '1234567890'
  },
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

// Converts text to selected font style
function convertFont(text, fontStyle) {
  if (!fontStyle || fontStyle === 'normal') return text;
  const font = fontMaps[fontStyle];
  if (!font) return text;
  return text.split('').map(ch => {
    const lowerIdx = normalAlphabet.lower.indexOf(ch);
    if (lowerIdx !== -1 && font.lower[lowerIdx]) return font.lower[lowerIdx];
    const upperIdx = normalAlphabet.upper.indexOf(ch);
    if (upperIdx !== -1 && font.upper[upperIdx]) return font.upper[upperIdx];
    const numIdx = normalAlphabet.numbers.indexOf(ch);
    if (numIdx !== -1 && font.numbers[numIdx]) return font.numbers[numIdx];
    return ch;
  }).join('');
}

// Sends API requests to Telegram
async function apiRequest(method, body) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return resp.json();
}

// Send a message to chat with optional keyboard
async function sendMessage(chatId, text, replyMarkup = null) {
  return apiRequest('sendMessage', {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
  });
}

// Edit existing message text and optionally update keyboard
async function editMessage(chatId, messageId, text, replyMarkup = null) {
  return apiRequest('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text: text,
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
  });
}

// Answer callback query to stop loading state
async function answerCallback(callbackQueryId) {
  return apiRequest('answerCallbackQuery', { callback_query_id: callbackQueryId });
}

// Copy message to channel without forwarding header
async function copyMessage(fromChatId, messageId, toChatId) {
  return apiRequest('copyMessage', {
    chat_id: toChatId,
    from_chat_id: fromChatId,
    message_id: messageId,
  });
}

// KV Storage helpers
async function getUserFont(userId, env) {
  const font = await env.BOT_KV.get(`user:${userId}:font`);
  return font || 'sans';
}
async function setUserFont(userId, font, env) {
  await env.BOT_KV.put(`user:${userId}:font`, font);
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
async function getFileList(page, pageSize, env) {
  const list = await env.BOT_KV.list({ prefix: 'file:' });
  const keys = list.keys;
  const start = page * pageSize;
  const end = start + pageSize;
  const pageKeys = keys.slice(start, end);
  const files = await Promise.all(pageKeys.map(async (key) => {
    const data = await env.BOT_KV.get(key.name);
    return JSON.parse(data);
  }));
  return { files, totalPages: Math.ceil(keys.length / pageSize), currentPage: page };
}

// Bot Handlers
async function handleStart(msg, env) {
  const chatId = msg.chat.id;
  const lines = [
    '「 ✦ ᴡᴇʟᴄᴏᴍᴇ ✦ 」',
    '────୨ৎ────',
    '',
    'ɦɛʟʟօ ȶɦɛʀɛ, աɛʟƈօʍɛ ȶօ ȶɦɛ ʄɨʟɛ ʊքʟօǟɖ ɮօȶ',
    '',
    'ɨ ǟʍ ɦɛʀɛ ȶօ ɦɛʟք ʏօʊ ֆɛƈʊʀɛʟʏ ֆȶօʀɛ ǟռɖ ʍǟռǟɢɛ ʏօʊʀ ʄɨʟɛֆ աɨȶɦ ƈǟʀɛ ǟռɖ ɖɛɖɨƈǟȶɨօռ',
    '',
    '⌗ ʄɨʀֆȶ, ʟɛȶ\'ֆ ƈɦɛƈӄ ɨʄ ʏօʊ ƈǟռ ֆɛɛ ǟʟʟ ȶɦɛ ʄօռȶֆ ǟռɖ ɖɛƈօʀǟȶɨʋɛ ɛʟɛʍɛռȶֆ ɮɛʟօա',
    '',
    '𝖆𝖇𝖈𝖉𝖊𝖋 ⌗ ⓐⓑⓒⓓⓔⓕ ⌗ 𝓪𝓫𝓬𝓭𝓮𝓯 ⌗ ǟɮƈɖɛʄ',
    '',
    '✿ ƈǟռ ʏօʊ ֆɛɛ ǟʟʟ ȶɦɛֆɛ ʄօռȶֆ ǟռɖ ɖɛƈօʀǟȶɨօռֆ քʀօքɛʀʟʏ?',
    '',
    '﹌﹌﹌﹌﹌﹌﹌'
  ];
  const text = lines.join('\n');
  const keyboard = {
    inline_keyboard: [
      [{ text: 'Yes, I can see them', callback_data: 'font_yes' }],
      [{ text: 'No, show normal text', callback_data: 'font_no' }]
    ]
  };
  await sendMessage(chatId, text, keyboard);
}

async function handleFontSelection(msg, env) {
  const chatId = msg.chat.id;
  const lines = [
    '「 ✦ ƈɦօօֆɛ ʏօʊʀ ֆȶʏʟɛ ✦ 」',
    '────୨ৎ────',
    '',
    '⌗ ֆɛʟɛƈȶ ȶɦɛ ʄօռȶ ֆȶʏʟɛ ʏօʊ\'ɖ ʟɨӄɛ ʄօʀ ǟʟʟ ɮօȶ ʍɛֆֆǟɢɛֆ'
  ];
  const text = lines.join('\n');
  const keyboard = {
    inline_keyboard: [
      [{ text: '「 ✦ 𝕱𝖗𝖆𝖐𝖙𝖚𝖗 𝕾𝖙𝖞𝖑𝖊 ✦ 」', callback_data: 'font_fraktur' }],
      [{ text: '「 ✦ Ⓒⓘⓡⓒⓛⓔⓓ Ⓢⓣⓨⓛⓔ ✦ 」', callback_data: 'font_circled' }],
      [{ text: '「 ✦ 𝓒𝓾𝓻𝓼𝓲𝓿𝓮 𝓢𝓽𝔂𝓵𝓮 ✦ 」', callback_data: 'font_cursive' }],
      [{ text: '「 ✦ Sǟռֆ Sȶʏʟɛ ✦ 」', callback_data: 'font_sans' }],
      [{ text: '「 ✦ Regular Style ✦ 」', callback_data: 'font_normal' }]
    ]
  };
  await editMessage(chatId, msg.message_id, text, keyboard);
}

async function handleHelp(msg, env) {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const font = await getUserFont(userId, env);
  const commands = [
    'Available Commands:',
    '',
    '/start - Start the bot and font selection',
    '/help - Show this help message',
    '/files - List your uploaded files',
    '/cancel - Cancel current operations',
    '',
    'Just send any file and I’ll ask you to confirm before upload!'
  ];
  if (userId === OWNER_ID) {
    commands.push(
      '',
      'Owner commands:',
      '/setchannel - Set upload forwarding channel',
      '/stats - View bot statistics'
    );
  }
  const text = convertFont(commands.join('\n'), font);
  await sendMessage(chatId, text);
}

// Handle the command that sets the channel for forwarded files (Owner-only)
async function handleSetChannel(msg, env) {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  if (userId !== OWNER_ID) {
    await sendMessage(chatId, 'You are not authorized to use this command.');
    return;
  }
  const font = await getUserFont(userId, env);
  const text = convertFont('Please forward a message from the channel where files should be sent.', font);
  await sendMessage(chatId, text);
  await env.BOT_KV.put(`user:${userId}:awaiting`, 'channel_forward');
}

// Handle receiving a file and ask user for confirmation before uploading
async function handleFileReceived(msg, env) {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const font = await getUserFont(userId, env);
  const file = msg.document || (msg.photo && msg.photo[msg.photo.length - 1]) || msg.video || msg.audio;
  if (!file) return;
  const channelId = await getChannelId(env);
  if (!channelId) {
    await sendMessage(chatId, convertFont('Channel not configured. Please contact the owner.', font));
    return;
  }
  const fileInfo = {
    chatId: chatId,
    messageId: msg.message_id,
    fileId: file.file_id,
    fileName: file.file_name || (msg.photo ? 'Photo' : msg.video ? 'Video' : msg.audio ? 'Audio' : 'File'),
    fileSize: file.file_size || 0,
    fileType: msg.document ? 'document' : (msg.photo ? 'photo' : (msg.video ? 'video' : 'audio'))
  };
  await savePendingUpload(userId, fileInfo, env);

  // Ask for upload confirmation
  const sizeMB = (fileInfo.fileSize / 1024 / 1024).toFixed(2);
  const textConfirm = convertFont(
    `✦ Upload this file?\n\nFile: ${fileInfo.fileName}\nSize: ${sizeMB} MB`,
    font
  );
  const keyboard = {
    inline_keyboard: [[
      { text: '✅ Yes, Upload', callback_data: 'upload_yes' },
      { text: '❌ No, Cancel', callback_data: 'upload_no' }
    ]]
  };
  await sendMessage(chatId, textConfirm, keyboard);
}

// Confirm and perform file upload
async function handleUploadConfirm(callback, env) {
  const userId = callback.from.id;
  const font = await getUserFont(userId, env);
  const fileInfo = await getPendingUpload(userId, env);
  if (!fileInfo) {
    await editMessage(callback.message.chat.id, callback.message.message_id,
      convertFont('Upload expired. Please send the file again.', font));
    return;
  }
  const channelId = await getChannelId(env);
  const result = await copyMessage(fileInfo.chatId, fileInfo.messageId, channelId);
  if (result.ok) {
    const metadata = {
      fileId: fileInfo.fileId,
      fileName: fileInfo.fileName,
      fileSize: fileInfo.fileSize,
      fileType: fileInfo.fileType,
      uploadedBy: userId,
      uploadedAt: new Date().toISOString(),
      channelMessageId: result.result.message_id
    };
    await saveFileMetadata(fileInfo.fileId, metadata, env);
    await deletePendingUpload(userId, env);
    await editMessage(callback.message.chat.id, callback.message.message_id,
      convertFont('✅ File uploaded successfully!', font));
  } else {
    await editMessage(callback.message.chat.id, callback.message.message_id,
      convertFont('❌ Upload failed, please try again.', font));
  }
}

// Cancel upload on user request
async function handleUploadCancel(callback, env) {
  const userId = callback.from.id;
  const font = await getUserFont(userId, env);
  await deletePendingUpload(userId, env);
  await editMessage(callback.message.chat.id, callback.message.message_id,
    convertFont('Upload cancelled.', font));
}

// Respond to callback queries such as font selection and upload confirmations
async function handleCallback(callback, env) {
  const data = callback.data;

  if (data === 'font_yes') {
    await handleFontSelection(callback.message, env);
  } else if (data === 'font_no') {
    await setUserFont(callback.from.id, 'normal', env);
    const text = 'Font set to normal text.\nYou can now send files to upload them.\nUse /help for commands.';
    await editMessage(callback.message.chat.id, callback.message.message_id, text);
  } else if (data.startsWith('font_')) {
    const fontStyle = data.slice(5);
    await setUserFont(callback.from.id, fontStyle, env);
    const text = convertFont('Font saved! Send a file to upload it.\nUse /help to see commands.', fontStyle);
    await editMessage(callback.message.chat.id, callback.message.message_id, text);
  } else if (data === 'upload_yes') {
    await handleUploadConfirm(callback, env);
  } else if (data === 'upload_no') {
    await handleUploadCancel(callback, env);
  }
  await answerCallback(callback.id);
}

// Core update handler routing messages and callbacks
async function handleUpdate(update, env) {
  try {
    if (update.message) {
      const msg = update.message;
      const text = msg.text || '';
      const userId = msg.from.id;
      const awaiting = await env.BOT_KV.get(`user:${userId}:awaiting`);
      
      if (awaiting === 'channel_forward' && msg.forward_from_chat) {
        await setChannelId(msg.forward_from_chat.id, env);
        await env.BOT_KV.delete(`user:${userId}:awaiting`);
        const font = await getUserFont(userId, env);
        await sendMessage(msg.chat.id, convertFont('Channel configured successfully.', font));
        return;
      }

      if (text === '/start') return handleStart(msg, env);
      if (text === '/help') return handleHelp(msg, env);
      if (text === '/setchannel' && userId === OWNER_ID) return handleSetChannel(msg, env);
      if (msg.document || msg.photo || msg.video || msg.audio) return handleFileReceived(msg, env);
    } else if (update.callback_query) {
      return handleCallback(update.callback_query, env);
    }
  } catch (e) {
    console.error('Error handling update:', e);
  }
}

// Webhook registration helper
async function registerWebhook(request) {
  const url = new URL(request.url);
  const webhookUrl = url.protocol + '//' + url.host + '/webhook';
  const res = await apiRequest('setWebhook', { url: webhookUrl, secret_token: WEBHOOK_SECRET });
  return new Response(JSON.stringify(res), { headers: { 'Content-Type': 'application/json' } });
}

// Cloudflare Worker entry point
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/registerWebhook') {
      return registerWebhook(request);
    }
    if (url.pathname === '/webhook' && request.method === 'POST') {
      const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
      if (secret !== WEBHOOK_SECRET) return new Response('Unauthorized', { status: 401 });
      const update = await request.json();
      await handleUpdate(update, env);
      return new Response('OK');
    }
    return new Response('Telegram File Upload Bot running!', { status: 200 });
  }
};
