const config = require('../src/config');

async function main() {
  if (!config.telegramBotToken) {
    throw new Error('TELEGRAM_BOT_TOKEN is required.');
  }
  const webhookUrl = `${config.publicUrl}/telegram/${config.telegramWebhookSecret}`;
  const response = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/setWebhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ['message', 'edited_message', 'callback_query']
    })
  });
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
  console.log(`Webhook URL: ${webhookUrl}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
