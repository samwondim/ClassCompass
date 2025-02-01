import MyContext from "../models/Context";
import MyConversation from "../models/ConversationContext";

export default async function registerTeacher(conversation: MyConversation, ctx: MyContext) {
  await ctx.reply("Please send me the excel file that holds your list of teachers' information.");
}
