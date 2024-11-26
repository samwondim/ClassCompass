import MyConversation from "../models/ConversationContext";
import MyContext from "../models/Context";
import tKeyboard from "../menus/teacherMenu";

export default async function greetUser(conversation: MyConversation, ctx: MyContext) {
  await ctx.reply(`Welcome to Class Compass!\n
I am created @triviosa to help you manage your Sunday School Schedules.`);

  ctx.session.telegramId = ctx.from?.id.toString();

  await ctx.reply("What would you like to do?", {
    reply_markup: tKeyboard
  });
}
