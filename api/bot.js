import { kv } from '@vercel/kv';
const TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = '5610370588';
export default async function handler(req, res) {
  if (req.method!== 'POST') return res.status(200).send('OK');
  const update = req.body;
  const msg = update.message;
  if (!msg) return res.status(200).send('OK');
  const chatId = msg.chat.id;
  const text = msg.text || '';
  const name = msg.from.first_name || 'مستخدم';
  const userId = String(msg.from.id);
  let users = (await kv.get('users')) || {};
  if (!users[userId]) {
    users[userId] = { id: userId, name, balance: 0, invites: 0, hasProof: false };
    if (text.startsWith('/start ')) {
      const inviter = text.split(' ')[1];
      if (inviter && inviter!== userId && users[inviter]) {
        users[inviter].invites += 1;
        users[inviter].balance += 5;
      }
    }
    await kv.set('users', users);
  }
  const domain = process.env.VERCEL_URL? `https://${process.env.VERCEL_URL}` : '';
  const webAppUrl = `${domain}/?start=${userId}`;
  const adminUrl = `${domain}/admin.html`;
  let reply = '';
  if (text.startsWith('/start')) {
    reply = `أهلا ${name} 💰\nرصيدك: ${users[userId]?.balance || 0} ليرة\n\nادخل للتطبيق وابدأ الربح:`;
  } else if (userId === ADMIN_ID && text === '/admin') {
    reply = `لوحة الأدمن: ${adminUrl}`;
  } else {
    reply = `استخدم /start`;
  }
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: reply,
      reply_markup: { inline_keyboard: [[{ text: '💰 افتح التطبيق', web_app: { url: webAppUrl } }]] }
    })
  });
  return res.status(200).send('OK');
}
