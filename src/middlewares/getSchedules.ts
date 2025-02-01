
import MyContext from "../models/Context";
import MyConversation from "../models/ConversationContext";
import prisma from "../models/Client";

export default async function getSchedules(conversation: MyConversation, ctx: MyContext) {
  const schedules = await prisma.schedule.findMany({
    include: {
      course: true,
      section: true,
      teacher: true,
    },
  });

  let response = "Here are the schedules you requested:\n\n";

  // Iterate over the schedules and append them to response.
  for (const schedule of schedules) {
    response += `${schedule.date.toISOString().split("T")[0]} \t ${schedule.course?.course_name || "N/A"} \t ${schedule.section?.section_name || "N/A"} \t ${schedule.teacher.name} \t ${schedule.teacher.phone_number}\n`;
  }

  // Ensure the response is within Telegram's message limit
  if (response.length > 4000) {
    await ctx.reply("The response is too long. Please refine your request.");
  } else {
    await ctx.reply(response);
  }

}
