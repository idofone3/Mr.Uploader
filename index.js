// ===== CONFIGURATION =====
const BOT_TOKEN = '8422136188:AAHljCDC6FWQPtW38HDuh8-2PWCTeFueSG0'; // Get from @BotFather
const OWNER_ID = 7217149295; // Replace with your Telegram user ID
const WEBHOOK_SECRET = 'Anon'; // Random secret for security

// ===== FONT MAPS =====
const fontMaps = {
  fraktur: {
    lower: '𝖆𝖇𝖈𝖉𝖊𝖋𝖌𝖍𝖎𝖏𝖐𝖑𝖒𝖓𝖔𝖕𝖖𝖗𝖘𝖙𝖚𝖛𝖜𝖝𝖞𝖟',
    upper: '𝕬𝕭𝕮𝕯𝕰𝕱𝕲𝕳𝕴𝕵𝕶𝕷𝕸𝕹𝕺𝕻𝕼𝕽𝕾𝕿𝖀𝖁𝖂𝖃𝖄𝖅',
    numbers: '𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗𝟎'
  },
  circled: {
    lower: 'ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ',
    upper: 'ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ',
    numbers: '①②③④⑤⑥⑦⑧⑨⑩'
  },
  cursive: {
    lower: '𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃',
    upper: '𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩',
    numbers: '123456789'
  },
  sans: {
    lower: 'ǟɮƈɖɛʄɢɦɨʝӄʟʍռօքզʀֆȶʊʋաӼʏʐ',
    upper: 'ǟɮƈɖɛʄɢɦɨʝӄʟʍռօքզʀֆȶʊʋաӼʏʐ',
    numbers: '123456789'
  }
};

const normalAlphabet = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '1234567890'
};

// ===== UTILITY FUNCTIONS =====
function convertFont(text, fontStyle) {
  if (!fontStyle || fontStyle === 'normal') return text;
  
  const font = fontMaps[fontStyle];
  if (!font) return text;
  
  return text.split('').map(char => {
    let idx = normalAlphabet.lower.indexOf(char);
    if (idx !== -1) return font.lower[idx] || char;
    
    idx = normalAlphabet.upper.indexOf(char);
    if (idx !== -1) return font.upper[idx] || char;
    
    idx = normalAlphabet.numbers.indexOf(char);
    if (idx !== -1) return font.numbers[idx] || char;
    
    return char;
  }).join('');
}

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

async function getFileList(page = 0, pageSize = 5, env) {
  const list = await env.BOT_KV.list({ prefix: 'file:' });
  const keys = list.keys;
  
  const start = page * pageSize;
  const end = start + pageSize;
  const pageKeys = keys.slice(start, end);
  
  const files = await Promise.all(
    pageKeys.map(async (key) => {
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

// ===== TELEGRAM API =====
async function apiRequest(method, body) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return await response.json();
}

async function sendMessage(chatId, text, replyMarkup = null) {
  return await apiRequest('sendMessage', {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
    reply_markup: replyMarkup
  });
}

async function editMessage(chatId, messageId, text, replyMarkup = null) {
  return await apiRequest('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text: text,
    parse_mode: 'HTML',
    reply_markup: replyMarkup
  });
}

async function copyMessageToChannel(chatId, messageId, channelId) {
  return await apiRequest('copyMessage', {
    chat_id: channelId,
    from_chat_id: chatId,
    message_id: messageId
  });
}

// ===== MESSAGE HANDLERS =====
async function handleStart(msg, env) {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  
  const text = `「 ✦ ᴡᴇʟᴄᴏᴍᴇ ✦ 」
────୨ৎ────

ɦɛʟʟօ ȶɦɛʀɛ, աɛʟƈօʍɛ ȶօ ȶɦɛ ʄɨʟɛ ʊքʟօǟɖ ɮօȶ

ɨ ǟʍ ɦɛʀɛ ȶօ ɦɛʟք ʏօʊ ֆɛƈʊʀɛʟʏ ֆȶօʀɛ ǟռɖ ʍǟռǟɢɛ ʏօʊʀ ʄɨʟɛֆ աɨȶɦ ƈǟʀɛ ǟռɖ ɖɛɖɨƈǟȶɨօռ

⌗ ʄɨʀֆȶ, ʟɛȶ'ֆ ƈɦɛƈӄ ɨʄ ʏօʊ ƈǟռ ֆɛɛ ǟʟʟ ȶɦɛ ʄօռȶֆ ǟռɖ ɖɛƈօʀǟȶɨʋɛ ɛʟɛʍɛռȶֆ ɮɛʟօա

𝖆𝖇𝖈𝖉𝖊𝖋 ⌗ ⓐⓑⓒⓓⓔⓕ ⌗ 𝓪𝓫𝓬𝓭𝓮𝓯 ⌗ ǟɮƈɖɛʄ

✿ ƈǟռ ʏօʊ ֆɛɛ ǟʟʟ ȶɦɛֆɛ ʄօռȶֆ ǟռɖ ɖɛƈօʀǟȶɨօռֆ քʀօքɛʀʟʏ?

﹌﹌﹌﹌﹌﹌﹌`;

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
  const userId = msg.from.id;
  
  const text = `「 ✦ ƈɦօօֆɛ ʏօʊʀ ֆȶʏʟɛ ✦ 」
────୨ৎ────

⌗ ֆɛʟɛƈȶ ȶɦɛ ʄօռȶ ֆȶʏʟɛ ʏօʊ'ɖ ʟɨӄɛ ʄօʀ ǟʟʟ ɮօȶ ʍɛֆֆǟɢɛֆ`;

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
  
  let text = `Available Commands:

/start - Welcome message and font setup
/help - Show this help message
/upload - Upload a file
/files - View all uploaded files
/myfiles - View your uploaded files
/cancel - Cancel current operation`;

  if (userId === OWNER_ID) {
    text += `

Owner Commands:
/setchannel - Set file forwarding channel
/settings - Bot settings
/stats - View statistics`;
  }
  
  text = convertFont(text, font);
  await sendMessage(chatId, text);
}

async function handleSetChannel(msg, env) {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  
  if (userId !== OWNER_ID) {
    await sendMessage(chatId, 'You are not authorized to use this command');
    return;
  }
  
  const font = await getUserFont(userId, env);
  const text = convertFont('Please forward a message from the channel where files should be sent', font);
  
  await sendMessage(chatId, text);
  await env.BOT_KV.put(`user:${userId}:awaiting`, 'channel_forward');
}

async function handleFileUpload(msg, env) {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const font = await getUserFont(userId, env);
  
  const file = msg.document || msg.photo?.[msg.photo.length - 1] || msg.video || msg.audio;
  
  if (!file) {
    const text = convertFont('Please send a file to upload', font);
    await sendMessage(chatId, text);
    return;
  }
  
  const channelId = await getChannelId(env);
  if (!channelId) {
    const text = convertFont('Channel not configured. Please contact the owner', font);
    await sendMessage(chatId, text);
    return;
  }
  
  // Copy message to channel without forward header
  const result = await copyMessageToChannel(chatId, msg.message_id, channelId);
  
  if (result.ok) {
    const metadata = {
      fileId: file.file_id,
      fileName: file.file_name || 'unnamed',
      fileSize: file.file_size || 0,
      fileType: msg.document ? 'document' : (msg.photo ? 'photo' : (msg.video ? 'video' : 'audio')),
      uploadedBy: userId,
      uploadedAt: new Date().toISOString(),
      channelMessageId: result.result.message_id
    };
    
    await saveFileMetadata(file.file_id, metadata, env);
    
    const text = convertFont('File uploaded successfully', font);
    await sendMessage(chatId, text);
  } else {
    const text = convertFont('Failed to upload file. Please try again', font);
    await sendMessage(chatId, text);
  }
}

async function handleFilesList(msg, env, page = 0) {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const font = await getUserFont(userId, env);
  
  const { files, totalPages, currentPage } = await getFileList(page, 5, env);
  
  let text = convertFont('Uploaded Files', font) + '
';
  text += convertFont('────୨ৎ────', font) + '

';
  text += convertFont(`Page ${currentPage + 1} of ${totalPages}`, font) + '

';
  
  files.forEach((file, idx) => {
    const name = convertFont(file.fileName, font);
    const size = (file.fileSize / 1024 / 1024).toFixed(2);
    const date = new Date(file.uploadedAt).toLocaleDateString();
    text += convertFont('File', font) + ': ' + name + '
';
    text += convertFont('Size', font) + ': ' + size + ' MB ' + convertFont('Uploaded', font) + ': ' + date + '

';
  });
  
  text += convertFont('﹌﹌﹌﹌﹌﹌﹌', font);
  
  // Pagination buttons
  const buttons = [];
  if (currentPage > 0) {
    buttons.push({ text: '⟨ Previous', callback_data: `files_page_${currentPage - 1}` });
  }
  if (currentPage < totalPages - 1) {
    buttons.push({ text: 'Next ⟩', callback_data: `files_page_${currentPage + 1}` });
  }
  
  const keyboard = buttons.length > 0 ? { inline_keyboard: [buttons] } : null;
  
  await sendMessage(chatId, text, keyboard);
}

// ===== CALLBACK HANDLERS =====
async function handleCallback(callback, env) {
  const userId = callback.from.id;
  const chatId = callback.message.chat.id;
  const data = callback.data;
  
  if (data === 'font_yes') {
    await handleFontSelection(callback.message, env);
  } else if (data === 'font_no') {
    await setUserFont(userId, 'normal', env);
    const text = 'Font set to normal text. You can start using the bot now!';
    await editMessage(chatId, callback.message.message_id, text);
  } else if (data.startsWith('font_')) {
    const fontStyle = data.replace('font_', '');
    await setUserFont(userId, fontStyle, env);
    const font = await getUserFont(userId, env);
    const text = convertFont('Font style saved! You can now use the bot with your selected style', font);
    await editMessage(chatId, callback.message.message_id, text);
  } else if (data.startsWith('files_page_')) {
    const page = parseInt(data.replace('files_page_', ''));
    await handleFilesList(callback.message, env, page);
  }
  
  // Answer callback to remove loading state
  await apiRequest('answerCallbackQuery', { callback_query_id: callback.id });
}

// ===== MAIN HANDLER =====
async function handleUpdate(update, env) {
  try {
    if (update.message) {
      const msg = update.message;
      const text = msg.text || '';
      const userId = msg.from.id;
      
      // Check for awaiting state
      const awaiting = await env.BOT_KV.get(`user:${userId}:awaiting`);
      
      if (awaiting === 'channel_forward' && msg.forward_from_chat) {
        await setChannelId(msg.forward_from_chat.id, env);
        await env.BOT_KV.delete(`user:${userId}:awaiting`);
        const font = await getUserFont(userId, env);
        const successText = convertFont('Channel configured successfully', font);
        await sendMessage(msg.chat.id, successText);
        return;
      }
      
      // Handle commands
      if (text.startsWith('/start')) {
        await handleStart(msg, env);
      } else if (text.startsWith('/help')) {
        await handleHelp(msg, env);
      } else if (text.startsWith('/setchannel')) {
        await handleSetChannel(msg, env);
      } else if (text.startsWith('/files')) {
        await handleFilesList(msg, env);
      } else if (msg.document || msg.photo || msg.video || msg.audio) {
        await handleFileUpload(msg, env);
      }
    } else if (update.callback_query) {
      await handleCallback(update.callback_query, env);
    }
  } catch (error) {
    console.error('Error handling update:', error);
  }
}

// ===== WEBHOOK SETUP =====
async function registerWebhook(request, env) {
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

// ===== WORKER ENTRY POINT =====
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname === '/registerWebhook') {
      return await registerWebhook(request, env);
    }
    
    if (url.pathname === '/webhook') {
      if (request.method === 'POST') {
        const secretToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
        if (secretToken !== WEBHOOK_SECRET) {
          return new Response('Unauthorized', { status: 401 });
        }
        
        const update = await request.json();
        await handleUpdate(update, env);
        
        return new Response('OK');
      }
    }
    
    return new Response('File Upload Bot is running!', { status: 200 });
  }
};
