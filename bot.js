const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const GITHUB_TOKEN = process.env.GIT_TOKEN;
const GITHUB_REPO = 'korosh3311/bot';
const GITHUB_FILE_PATH = 'data.json';

const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');
  const referralAmount = 25;

  if (userId) {
    await handleReferral(userId, referralAmount);
    return new Response("Referral updated and message sent!");
  }

  return new Response("Missing user_id");
}

async function handleReferral(userId, referralAmount) {
  const { file, user, sha } = await getUserInfo(userId);

  if (user) {
    user.balance += referralAmount;
    user.referrals += 1;
  } else {
    file.push({
      id: userId,
      name: `User ${userId}`,
      balance: referralAmount,
      referrals: 1,
      lastWithdraw: 0
    });
  }

  await saveUserInfo(userId, user || file[file.length - 1], file, sha);
  await sendMessage(userId, `🎉 You earned $${referralAmount}!\nYour new balance: $${user ? user.balance : referralAmount}`);
}

async function sendMessage(chatId, message) {
  const payload = {
    chat_id: chatId,
    text: message
  };

  await fetch(TELEGRAM_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

async function getUserInfo(userId) {
  const res = await fetch(GITHUB_API_URL, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` }
  });

  const data = await res.json();

  if (!data.content) return { file: [], user: null, sha: null };

  const content = JSON.parse(atob(data.content));
  const user = content.find(u => u.id === userId);

  return {
    file: content,
    user,
    sha: data.sha
  };
}

async function saveUserInfo(userId, updatedUser, allUsers, sha) {
  const updatedData = allUsers.map(u => u.id === userId ? updatedUser : u);

  await fetch(GITHUB_API_URL, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: `Update user ${userId}`,
      content: btoa(JSON.stringify(updatedData)),
      sha
    })
  });
}
