// ===== CONFIGURATION =====
const BOT_TOKEN = '8422136188:AAHljCDC6FWQPtW38HDuh8-2PWCTeFueSG0';
const OWNER_ID = 7217149295;
const WEBHOOK_SECRET = 'Anon';

// ===== SANS FONT MAPPING =====
const sansFont = {
  lower: 'ǟɮƈɖɛʄɢɦɨʝӄʟʍռօքզʀֆȶʊʋաӼʏʐ',
  upper: 'ǟɮƈɖɛʄɢɦɨʝӄʟʍռօքզʀֆȶʊʋաӼʏʐ',
  numbers: '1234567890'
};

const normalChars = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '1234567890'
};

function toSansFont(text) {
  return text.split('').map(char => {
    let idx = normalChars.lower.indexOf(char);
    if (idx !== -1 && sansFont.lower[idx]) return sansFont.lower[idx];
    idx = normalChars.upper.indexOf(char);
    if (idx !== -1 && sansFont.upper[idx]) return sansFont.upper[idx];
    idx = normalChars.numbers.indexOf(char);
    if (idx !== -1 && sansFont.numbers[idx]) return sansFont.numbers[idx];
    return char;
  }).join('');
}

// ===== TELEGRAM API HELPERS =====
async function apiRequest(method, body) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return response.json();
}

async function sendMessage(chatId, text, keyboard = null) {
  return apiRequest('sendMessage', {
    chat_id: chatId,
    text: text,
    reply_markup: keyboard
  });
}

async function editMessage(chatId, messageId, text, keyboard = null) {
  return apiRequest('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text: text,
    reply_markup: keyboard
  });
}

async function answerCallback(callbackId, text = '') {
  return apiRequest('answerCallbackQuery', {
    callback_query_id: callbackId,
    text: text
  });
}

async function copyMessage(fromChat, msgId, toChat) {
  return apiRequest('copyMessage', {
    chat_id: toChat,
    from_chat_id: fromChat,
    message_id: msgId
  });
}

// ===== KV STORAGE HELPERS =====
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
  await env.BOT_KV.put(`pending:${userId}`, JSON.stringify(fileInfo), {
    expirationTtl: 300
  });
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
  const files = await Promise.all(
    pageKeys.map(async key => {
      const data = await env.BOT_KV.get(key.name);
      return JSON.parse(data);
    })
  );
  return {
    files,
    totalPages: Math.ceil(keys.length / pageSize),
    currentPage: page
  };
}

// ===== COMMAND INFO =====
const commandInfo = {
  '/start': 'Start the bot and see welcome message',
  '/help': 'Show interactive help menu with all commands',
  '/files': 'View list of all uploaded files with pagination',
  '/cancel': 'Cancel current operation or pending upload',
  '/setchannel': 'Owner only - Set channel for file forwarding',
  '/stats': 'Owner only - View bot statistics and usage'
};

// ===== MESSAGE HANDLERS =====
async function handleStart(msg, env) {
  const lines = [];
  lines.push('「 ✦ ᴡᴇʟᴄᴏᴍᴇ ✦ 」');
  lines.push('────୨ৎ────');
  lines.push('');
  lines.push('ɦɛʟʟօ ȶɦɛʀɛ, աɛʟƈօʍɛ ȶօ ȶɦɛ ʄɨʟɛ ʊքʟօǟɖ ɮօȶ');
  lines.push('');
  lines.push('ɨ ǟʍ ɦɛʀɛ ȶօ ɦɛʟք ʏօʊ ֆɛƈʊʀɛʟʏ ֆȶօʀɛ ǟռɖ ʍǟռǟɢɛ');
  lines.push('ʏօʊʀ ʄɨʟɛֆ աɨȶɦ ƈǟʀɛ ǟռɖ ɖɛɖɨƈǟȶɨօռ');
  lines.push('');
  lines.push('✿ ʝʊֆȶ ֆɛռɖ ʍɛ ǟռʏ ʄɨʟɛ ȶօ ʊքʟօǟɖ');
  lines.push('');
  lines.push('⌗ ʊֆɛ /help ȶօ ֆɛɛ ǟʟʟ ƈօʍʍǟռɖֆ');
  lines.push('');
  lines.push('﹌﹌﹌﹌﹌﹌﹌');
  
  await sendMessage(msg.chat.id, lines.join('
'));
}

async function handleHelp(msg, env) {
  const buttons = [];
  for (const cmd in commandInfo) {
    buttons.push([{ text: toSansFont(cmd), callback_data: `help_${cmd}` }]);
  }
  
  const text = toSansFont('Select a command to see details:');
  const keyboard = { inline_keyboard: buttons };
  
  await sendMessage(msg.chat.id, text, keyboard);
}

async function handleHelpCallback(callback, env) {
  const command = callback.data.replace('help_', '');
  const description = commandInfo[command] || 'No information available';
  
  const lines = [];
  lines.push(`「 ✦ ${command} ✦ 」`);
  lines.push('────୨ৎ────');
  lines.push('');
  lines.push(toSansFont(description));
  lines.push('');
  lines.push('﹌﹌﹌﹌﹌﹌﹌');
  
  const buttons = [];
  for (const cmd in commandInfo) {
    buttons.push([{ text: toSansFont(cmd), callback_data: `help_${cmd}` }]);
  }
  
  await editMessage(
    callback.message.chat.id,
    callback.message.message_id,
    lines.join('
'),
    { inline_keyboard: buttons }
  );
  
  await answerCallback(callback.id);
}

async function handleSetChannel(msg, env) {
  const userId = msg.from.id;
  
  if (userId !== OWNER_ID) {
    await sendMessage(msg.chat.id, toSansFont('You are not authorized'));
    return;
  }
  
  await env.BOT_KV.put(`user:${userId}:awaiting`, 'channel_forward');
  
  const text = toSansFont('Forward a message from the channel');
  await sendMessage(msg.chat.id, text);
}

async function handleFileReceived(msg, env) {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  
  const file = msg.document || 
    (msg.photo && msg.photo[msg.photo.length - 1]) || 
    msg.video || 
    msg.audio;
  
  if (!file) return;
  
  const channelId = await getChannelId(env);
  if (!channelId) {
    await sendMessage(chatId, toSansFont('Channel not configured. Contact owner.'));
    return;
  }
  
  const fileName = file.file_name || 
    (msg.photo ? 'Photo' : msg.video ? 'Video' : msg.audio ? 'Audio' : 'File');
  const fileSize = (file.file_size || 0) / 1024 / 1024;
  
  const fileInfo = {
    chatId,
    messageId: msg.message_id,
    fileId: file.file_id,
    fileName,
    fileSize: file.file_size || 0,
    fileType: msg.document ? 'document' : 
      (msg.photo ? 'photo' : msg.video ? 'video' : 'audio')
  };
  
  await savePendingUpload(userId, fileInfo, env);
  
  const lines = [];
  lines.push('「 ✦ ' + toSansFont('Upload Confirmation') + ' ✦ 」');
  lines.push('────୨ৎ────');
  lines.push('');
  lines.push('✿ ' + toSansFont('File') + ': ' + fileName);
  lines.push('✿ ' + toSansFont('Size') + ': ' + fileSize.toFixed(2) + ' MB');
  lines.push('');
  lines.push(toSansFont('Upload this file?'));
  lines.push('');
  lines.push('﹌﹌﹌﹌﹌﹌﹌');
  
  const keyboard = {
    inline_keyboard: [[
      { text: '✅ ' + toSansFont('Yes Upload'), callback_data: 'upload_yes' },
      { text: '❌ ' + toSansFont('No Cancel'), callback_data: 'upload_no' }
    ]]
  };
  
  await sendMessage(chatId, lines.join('
'), keyboard);
}

async function handleUploadConfirm(callback, env) {
  const userId = callback.from.id;
  const chatId = callback.message.chat.id;
  const messageId = callback.message.message_id;
  
  const fileInfo = await getPendingUpload(userId, env);
  
  if (!fileInfo) {
    await editMessage(chatId, messageId, toSansFont('Upload expired. Send file again.'));
    await answerCallback(callback.id, 'Upload session expired');
    return;
  }
  
  const channelId = await getChannelId(env);
  const result = await copyMessage(fileInfo.chatId, fileInfo.messageId, channelId);
  
  if (result.ok) {
    const metadata = {
      ...fileInfo,
      uploadedBy: userId,
      uploadedAt: new Date().toISOString(),
      channelMessageId: result.result.message_id
    };
    
    await saveFileMetadata(fileInfo.fileId, metadata, env);
    await deletePendingUpload(userId, env);
    
    const lines = [];
    lines.push('「 ✦ ' + toSansFont('Success') + ' ✦ 」');
    lines.push('────୨ৎ────');
    lines.push('');
    lines.push('✅ ' + toSansFont('File uploaded successfully'));
    lines.push('');
    lines.push('✿ ' + toSansFont('Your file has been sent to the channel'));
    lines.push('');
    lines.push('﹌﹌﹌﹌﹌﹌﹌');
    
    await editMessage(chatId, messageId, lines.join('
'));
    await answerCallback(callback.id, '✅ Upload successful!');
  } else {
    await editMessage(chatId, messageId, toSansFont('Upload failed. Try again.'));
    await answerCallback(callback.id, '❌ Upload failed');
  }
}

async function handleUploadCancel(callback, env) {
  const userId = callback.from.id;
  
  await deletePendingUpload(userId, env);
  
  const lines = [];
  lines.push('「 ✦ ' + toSansFont('Cancelled') + ' ✦ 」');
  lines.push('────୨ৎ────');
  lines.push('');
  lines.push('❌ ' + toSansFont('Upload cancelled'));
  lines.push('');
  lines.push('﹌﹌﹌﹌﹌﹌﹌');
  
  await editMessage(
    callback.message.chat.id,
    callback.message.message_id,
    lines.join('
')
  );
  
  await answerCallback(callback.id, 'Upload cancelled');
}

async function handleFiles(msg, env, page = 0) {
  const { files, totalPages, currentPage } = await getFileList(page, 5, env);
  
  const lines = [];
  lines.push('「 ✦ ' + toSansFont('Uploaded Files') + ' ✦ 」');
  lines.push('────୨ৎ────');
  lines.push('');
  lines.push(toSansFont(`Page ${currentPage + 1} of ${totalPages}`));
  lines.push('');
  
  if (files.length === 0) {
    lines.push(toSansFont('No files uploaded yet'));
  } else {
    files.forEach((file, idx) => {
      const size = (file.fileSize / 1024 / 1024).toFixed(2);
      const date = new Date(file.uploadedAt).toLocaleDateString();
      lines.push(`${idx + 1}. ${file.fileName}`);
      lines.push(`   ${toSansFont('Size')}: ${size} MB | ${toSansFont('Date')}: ${date}`);
      lines.push('');
    });
  }
  
  lines.push('﹌﹌﹌﹌﹌﹌﹌');
  
  const buttons = [];
  if (currentPage > 0) {
    buttons.push({ text: '⟨ ' + toSansFont('Previous'), callback_data: `files_${currentPage - 1}` });
  }
  if (currentPage < totalPages - 1) {
    buttons.push({ text: toSansFont('Next') + ' ⟩', callback_data: `files_${currentPage + 1}` });
  }
  
  const keyboard = buttons.length > 0 ? { inline_keyboard: [buttons] } : null;
  
  await sendMessage(msg.chat.id, lines.join('
'), keyboard);
}

async function handleFilesCallback(callback, env) {
  const page = parseInt(callback.data.replace('files_', ''));
  const { files, totalPages, currentPage } = await getFileList(page, 5, env);
  
  const lines = [];
  lines.push('「 ✦ ' + toSansFont('Uploaded Files') + ' ✦ 」');
  lines.push('────୨ৎ────');
  lines.push('');
  lines.push(toSansFont(`Page ${currentPage + 1} of ${totalPages}`));
  lines.push('');
  
  if (files.length === 0) {
    lines.push(toSansFont('No files uploaded yet'));
  } else {
    files.forEach((file, idx) => {
      const size = (file.fileSize / 1024 / 1024).toFixed(2);
      const date = new Date(file.uploadedAt).toLocaleDateString();
      lines.push(`${idx + 1}. ${file.fileName}`);
      lines.push(`   ${toSansFont('Size')}: ${size} MB | ${toSansFont('Date')}: ${date}`);
      lines.push('');
    });
  }
  
  lines.push('﹌﹌﹌﹌﹌﹌﹌');
  
  const buttons = [];
  if (currentPage > 0) {
    buttons.push({ text: '⟨ ' + toSansFont('Previous'), callback_data: `files_${currentPage - 1}` });
  }
  if (currentPage < totalPages - 1) {
    buttons.push({ text: toSansFont('Next') + ' ⟩', callback_data: `files_${currentPage + 1}` });
  }
  
  const keyboard = buttons.length > 0 ? { inline_keyboard: [buttons] } : null;
  
  await editMessage(
    callback.message.chat.id,
    callback.message.message_id,
    lines.join('
'),
    keyboard
  );
  
  await answerCallback(callback.id);
}

// ===== CALLBACK HANDLER =====
async function handleCallback(callback, env) {
  const data = callback.data;
  
  if (data.startsWith('help_')) {
    await handleHelpCallback(callback, env);
  } else if (data === 'upload_yes') {
    await handleUploadConfirm(callback, env);
  } else if (data === 'upload_no') {
    await handleUploadCancel(callback, env);
  } else if (data.startsWith('files_')) {
    await handleFilesCallback(callback, env);
  } else {
    await answerCallback(callback.id);
  }
}

// ===== MAIN UPDATE HANDLER =====
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
        await sendMessage(msg.chat.id, toSansFont('Channel configured successfully'));
        return;
      }
      
      if (text === '/start') {
        await handleStart(msg, env);
      } else if (text === '/help') {
        await handleHelp(msg, env);
      } else if (text === '/setchannel') {
        await handleSetChannel(msg, env);
      } else if (text === '/files') {
        await handleFiles(msg, env);
      } else if (msg.document || msg.photo || msg.video || msg.audio) {
        await handleFileReceived(msg, env);
      }
    } else if (update.callback_query) {
      await handleCallback(update.callback_query, env);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// ===== WEBHOOK SETUP =====
async function registerWebhook(request) {
  const url = new URL(request.url);
  const webhookUrl = `${url.protocol}//${url.host}/webhook`;
  const result = await apiRequest('setWebhook', {
    url: webhookUrl,
    secret_token: WEBHOOK_SECRET
  });
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// ===== CLOUDFLARE WORKER =====
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname === '/registerWebhook') {
      return await registerWebhook(request);
    }
    
    if (url.pathname === '/webhook' && request.method === 'POST') {
      const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
      if (secret !== WEBHOOK_SECRET) {
        return new Response('Unauthorized', { status: 401 });
      }
      
      const update = await request.json();
      await handleUpdate(update, env);
      return new Response('OK');
    }
    
    return new Response('Telegram File Upload Bot Running', { status: 200 });
  }
};
    
