const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;  // استفاده از متغیر محیطی برای توکن تلگرام
const GITHUB_TOKEN = process.env.GIT_TOKEN;  // استفاده از متغیر محیطی برای توکن گیت هاب
const GITHUB_REPO = 'korosh3311/bot';
const GITHUB_FILE_PATH = 'data.json';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;

const { fetch } = require('undici');

// سایر کدها مشابه قبل
async function getUserInfo(userId) {
  const response = await fetch(GITHUB_API_URL, {
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`
    }
  });
  const data = await response.json();
  return data;
}

async function saveUserInfo(userId, userInfo) {
  const response = await fetch(GITHUB_API_URL, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: `Update user ${userId} info`,
      content: Buffer.from(JSON.stringify(userInfo)).toString('base64'),
      sha: userInfo.sha // برای آپدیت داده‌ها از SHA فایل استفاده کنید
    })
  });
  return await response.json();
}

async function sendMessage(userId, message) {
  const payload = {
    chat_id: userId,
    text: message
  };
  await fetch(TELEGRAM_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

// فراخوانی به‌روزرسانی موجودی
async function handleReferral(userId, referralAmount) {
  const userInfo = await getUserInfo(userId);

  if (userInfo) {
    userInfo.balance += referralAmount;

    await saveUserInfo(userId, userInfo);
    await sendMessage(userId, `🎉 You have earned $${referralAmount}. Your new balance is $${userInfo.balance}`);
  }
}

// درخواست از کاربر
addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');
  const referralAmount = 25; // مبلغ ارجاع

  if (userId) {
    await handleReferral(userId, referralAmount);
  }

  return new Response("OK");
}

