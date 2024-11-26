import MyConversation from "../models/ConversationContext";
import MyContext from "../models/Context";

export default async function greetings(conversation: MyConversation, ctx: MyContext) {
  await ctx.reply("How many favorite movies do you have?");
  const count = await conversation.form.number();

  const movies: string[] = [];

  for (let i = 0; i < count; i++) {
    await ctx.reply(`tell me number ${i + 1}`);
    const title = await conversation.waitFor(":text");
    movies.push(title.msg.text);
  }

  await ctx.reply("Here is by ranking them");
  movies.sort();

  await ctx.reply(movies.map((title, i) => `${i + 1}. ${title}`).join("\n"))
}

