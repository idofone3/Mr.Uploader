// ===== CONFIGURATION =====
const BOT_TOKEN = '8422136188:AAHljCDC6FWQPtW38HDuh8-2PWCTeFueSG0';
const OWNER_ID = 7217149295;
const WEBHOOK_SECRET = 'Anon';

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

function convertFont(text, fontStyle) {
  if (!fontStyle || fontStyle === 'normal') return text;
  const font = fontMaps[fontStyle];
  if (!font) return text;
  return text.split('').map(char => {
    let idx = normalAlphabet.lower.indexOf(char);
    if (idx !== -1 && font.lower[idx]) return font.lower[idx];
    idx = normalAlphabet.upper.indexOf(char);
    if (idx !== -1 && font.upper[idx]) return font.upper[idx];
    idx = normalAlphabet.numbers.indexOf(char);
    if (idx !== -1 && font.numbers[idx]) return font.numbers[idx];
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

async function apiRequest(method, body) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return await response.json();
}

async function sendMessage(chatId, text, replyMarkup) {
  return await apiRequest('sendMessage', {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
    reply_markup: replyMarkup
  });
}

async function editMessage(chatId, messageId, text, replyMarkup) {
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

async function handleStart(msg, env) {
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
  const commands = ['Available Commands:', '', '/start - Welcome message and font setup', '/help - Show this help message', '/upload - Upload a file', '/files - View all uploaded files', '/myfiles - View your uploaded files', '/cancel - Cancel current operation'];
  if (userId === OWNER_ID) {
    commands.push('', 'Owner Commands:', '/setchannel - Set file forwarding channel', '/settings - Bot settings', '/stats - View statistics');
  }
  const text = convertFont(commands.join('
'), font);
  await sendMessage(chatId, text, null);
}

async function handleSetChannel(msg, env) {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  if (userId !== OWNER_ID) {
    await sendMessage(chatId, 'You are not authorized to use this command', null);
    return;
  }
  const font = await getUserFont(userId, env);
  const text = convertFont('Please forward a message from the channel where files should be sent', font);
  await sendMessage(chatId, text, null);
  await env.BOT_KV.put(`user:${userId}:awaiting`, 'channel_forward');
}

async function handleFileUpload(msg, env) {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const font = await getUserFont(userId, env);
  const file = msg.document || (msg.photo && msg.photo[msg.photo.length - 1]) || msg.video || msg.audio;
  if (!file) {
    await sendMessage(chatId, convertFont('Please send a file to upload', font), null);
    return;
  }
  const channelId = await getChannelId(env);
  if (!channelId) {
    await sendMessage(chatId, convertFont('Channel not configured. Please contact the owner', font), null);
    return;
  }
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
    await sendMessage(chatId, convertFont('File uploaded successfully', font), null);
  } else {
    await sendMessage(chatId, convertFont('Failed to upload file. Please try again', font), null);
  }
}

async function buildFileListText(files, currentPage, totalPages, font) {
  let parts = [convertFont('Uploaded Files', font), convertFont('────୨ৎ────', font), '', convertFont('Page ' + (currentPage + 1) + ' of ' + totalPages, font), ''];
  if (files.length === 0) {
    parts.push(convertFont('No files uploaded yet', font));
  } else {
    files.forEach((file) => {
      const name = convertFont(file.fileName, font);
      const size = (file.fileSize / 1024 / 1024).toFixed(2);
      const date = new Date(file.uploadedAt).toLocaleDateString();
      parts.push(convertFont('File', font) + ': ' + name);
      parts.push(convertFont('Size', font) + ': ' + size + ' MB ' + convertFont('Uploaded', font) + ': ' + date);
      parts.push('');
    });
  }
  parts.push(convertFont('﹌﹌﹌﹌﹌﹌﹌', font));
  return parts.join('
');
}

async function handleFilesList(msg, env, page) {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const font = await getUserFont(userId, env);
  const { files, totalPages, currentPage } = await getFileList(page || 0, 5, env);
  const text = await buildFileListText(files, currentPage, totalPages, font);
  const buttons = [];
  if (currentPage > 0) {
    buttons.push({ text: '⟨ Previous', callback_data: 'files_page_' + (currentPage - 1) });
  }
  if (currentPage < totalPages - 1) {
    buttons.push({ text: 'Next ⟩', callback_data: 'files_page_' + (currentPage + 1) });
  }
  const keyboard = buttons.length > 0 ? { inline_keyboard: [buttons] } : null;
  await sendMessage(chatId, text, keyboard);
}

async function handleCallback(callback, env) {
  const userId = callback.from.id;
  const chatId = callback.message.chat.id;
  const data = callback.data;
  if (data === 'font_yes') {
    await handleFontSelection(callback.message, env);
  } else if (data === 'font_no') {
    await setUserFont(userId, 'normal', env);
    await editMessage(chatId, callback.message.message_id, 'Font set to normal text. You can start using the bot now!', null);
  } else if (data.startsWith('font_')) {
    const fontStyle = data.replace('font_', '');
    await setUserFont(userId, fontStyle, env);
    const font = await getUserFont(userId, env);
    await editMessage(chatId, callback.message.message_id, convertFont('Font style saved! You can now use the bot with your selected style', font), null);
  } else if (data.startsWith('files_page_')) {
    const page = parseInt(data.replace('files_page_', ''));
    const font = await getUserFont(userId, env);
    const { files, totalPages, currentPage } = await getFileList(page, 5, env);
    const text = await buildFileListText(files, currentPage, totalPages, font);
    const buttons = [];
    if (currentPage > 0) {
      buttons.push({ text: '⟨ Previous', callback_data: 'files_page_' + (currentPage - 1) });
    }
    if (currentPage < totalPages - 1) {
      buttons.push({ text: 'Next ⟩', callback_data: 'files_page_' + (currentPage + 1) });
    }
    const keyboard = buttons.length > 0 ? { inline_keyboard: [buttons] } : null;
    await editMessage(chatId, callback.message.message_id, text, keyboard);
  }
  await apiRequest('answerCallbackQuery', { callback_query_id: callback.id });
}

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
        await sendMessage(msg.chat.id, convertFont('Channel configured successfully', font), null);
        return;
      }
      if (text.startsWith('/start')) {
        await handleStart(msg, env);
      } else if (text.startsWith('/help')) {
        await handleHelp(msg, env);
      } else if (text.startsWith('/setchannel')) {
        await handleSetChannel(msg, env);
      } else if (text.startsWith('/files')) {
        await handleFilesList(msg, env, 0);
      } else if (msg.document || msg.photo || msg.video || msg.audio) {
        await handleFileUpload(msg, env);
      }
    } else if (update.callback_query) {
      await handleCallback(update.callback_query, env);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function registerWebhook(request) {
  const url = new URL(request.url);
  const webhookUrl = url.protocol + '//' + url.host + '/webhook';
  const result = await apiRequest('setWebhook', { url: webhookUrl, secret_token: WEBHOOK_SECRET });
  return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/registerWebhook') {
      return await registerWebhook(request);
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
