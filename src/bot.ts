import { Bot, Context, InlineKeyboard, session } from "grammy";
import {
  conversations,
  createConversation,
} from "@grammyjs/conversations";
import mKeyboard from "./menus/managerMenu";
import MyContext from "./models/Context";
import greetings from "./middlewares/greetUser";
import { run } from "@grammyjs/runner";

export default async function runApp() {

  const bot = new Bot<MyContext>(process.env.BOT_TOKEN as string);

  //register middlewares
  bot.use(session({ initial: () => ({}) })).
    use(conversations()).
    use(createConversation(greetings));

  //commands
  bot.command("start", async (ctx) => {
    await ctx.reply("Welcome to the bot mister", { reply_markup: mKeyboard })
  });

  bot.callbackQuery("teacher-pl", async (ctx) => {
    await ctx.conversation.enter("greetings");
  })

  bot.callbackQuery("schedule-pl", async (ctx) => {
    await ctx.answerCallbackQuery("same process")
  })

  bot.callbackQuery("request-pl", async (ctx) => {
    await ctx.answerCallbackQuery("third payload requested here")
  })

  bot.on("message", (ctx) => {
    ctx.reply("Hello there")
  })

  console.log("Hello")
  bot.catch(console.error);
  // await bot.init();
  // run(bot);
  bot.start();
  // console.info(`Bot ${bot.botInfo.username} us up and running`);
  console.log("started")
}
