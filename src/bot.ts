
import { Telegraf, Context, session } from 'telegraf';

interface SessionData {
  customProp: number;
}

interface MyContext extends Context {
  session?: SessionData;
}

const setUpBotConfigs = () => {
  const bot = new Telegraf<MyContext>(process.env.BOT_TOKEN as string);
  bot.use(session());

  // Start command
  bot.start((ctx) => ctx.reply('Hello! Welcome to my Telegram bot!'));

  // Echo back any text message sent by users
  bot.on('message', async (ctx) => {
    ctx.session ??= { customProp: 1 }
    await ctx.reply('' + ctx.session.customProp);
  });

  return bot;
}
export const startBot = () => {
  // Launch the bot
  setUpBotConfigs().launch()
    .then(() => console.log('Bot started successfully'))
    .catch((err) => console.error('Error starting bot:', err));
}

// Enable graceful stop
// process.once('SIGINT', () => bot.stop('SIGINT'));
// process.once('SIGTERM', () => bot.stop('SIGTERM'));

