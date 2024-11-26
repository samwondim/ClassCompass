import { PrismaClient } from "@prisma/client";
import MyContext from "../models/Context";
import MyConversation from "../models/ConversationContext";

export default async function registerTeacher(conversation: MyConversation, ctx: MyContext) {
  await ctx.reply("Please enter the teacher's name:");

  const { message: newMessage } = await conversation.wait();
  const name = newMessage?.text;

  if (!name) {
    await ctx.reply("Invalid name. Registration canceled.");
    return;
  }

  await ctx.reply("Please enter the teacher's phone number:");

  const { message: phone } = await conversation.wait();
  const phone_number = phone?.text;

  if (!phone_number || !/^\d+$/.test(phone_number)) {
    await ctx.reply("Invalid phone number. Registeration canceled");
    return;
  }

  await ctx.reply("Is this teacher a manager? (yes/no)");
  const { message: managerMessage } = await conversation.wait();
  const is_manager = managerMessage?.text?.toLowerCase() === "yes";

  try {
    const prisma = new PrismaClient();
    await prisma.teacher.create({
      data: { name, phone_number, is_manager },
    });
    await ctx.reply(`Teacher ${name} registered successfully.`);
  } catch (error) {
    console.log(error);
    await ctx.reply("An error occured while registering teacher. Please try again");
  }
}
