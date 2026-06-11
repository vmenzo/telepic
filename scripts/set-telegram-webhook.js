const config = require('../src/config');
const { registerTelegramBotCommands, telegramAllowedUpdates } = require('../src/telegram');

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
      allowed_updates: telegramAllowedUpdates()
    })
  });
  const data = await response.json();
  if (!data || !data.ok) {
    throw new Error(data && data.description ? data.description : 'Telegram webhook registration failed.');
  }
  const commands = await registerTelegramBotCommands(config);
  if (!commands || !commands.ok) {
    throw new Error(commands && commands.description ? commands.description : 'Telegram command menu registration failed.');
  }
  console.log(JSON.stringify(data, null, 2));
  console.log(JSON.stringify({ commands }, null, 2));
  console.log(`Webhook URL: ${webhookUrl}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
