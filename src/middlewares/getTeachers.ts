import { PrismaClient } from "@prisma/client";
import MyContext from "../models/Context";
import MyConversation from "../models/ConversationContext";

export default async function getTeachers(conversation: MyConversation, ctx: MyContext) {
  const prisma = new PrismaClient();
  const teachers = await prisma.teacher.findMany();
  let response = 'Here is a list of all teachers.\n';

  for (let i = 0; i < teachers.length; i++) {
    response += `${i + 1} ${teachers[i].name} \t ${teachers[i].phone_number}\n`
  }

  await ctx.reply(response);
}
