import { Bot, Context, InlineKeyboard, session } from "grammy";
import {
  conversations,
  createConversation,
} from "@grammyjs/conversations";
import mKeyboard from "./menus/managerMenu";
import MyContext from "./models/Context";
import { run } from "@grammyjs/runner";
import registerTeacher from "./middlewares/registerTeacher";
import optKeyboard from "./menus/subTeachers";
import getTeachers from "./middlewares/getTeachers";
import greetUser from "./middlewares/greetUser";
import { PrismaClient } from "@prisma/client";
import { freeStorage } from "@grammyjs/storage-free";
import SessionData from "./types/SessionData";

const prisma = new PrismaClient();

export default async function runApp() {

  const bot = new Bot<MyContext>(process.env.BOT_TOKEN as string);

  //register middlewares
  bot.
    use(session({
      initial: () => ({ telegramId: "", phone_number: "" }),
      storage: freeStorage<SessionData>(bot.token)
    })
    ).
    use(conversations()).
    use(createConversation(registerTeacher)).
    use(createConversation(getTeachers)).
    use(createConversation(greetUser));

  //commands
  bot.command("start", async (ctx) => {
    await ctx.conversation.enter("greetUser");
  });

  bot.callbackQuery("teacher-pl", async (ctx) => {
    await ctx.reply("What would you like to do?", { reply_markup: optKeyboard });
  })

  bot.callbackQuery("add-pl", async (ctx) => {
    await ctx.conversation.enter("registerTeacher");
  });

  bot.callbackQuery("view-pl", async (ctx) => {
    await ctx.conversation.enter("getTeachers");
  })

  //teacher's commands
  bot.callbackQuery("t-schedule-pl", async (ctx) => {
    const phone_number = ctx.session.phone_number;
    const schedule = await prisma.schedule.findMany({
      where: {
        teacher: {
          phone_number: phone_number
        }
      },
      include: {
        course: true,
        section: true
      }
    });

    if (schedule.length === 0) {
      await ctx.reply("You don't have any schedules yet");
      return;
    }

    let res = `Schedules for ${ctx.from?.first_name + ctx.from?.last_name}\n`;
    schedule.forEach((scdl) => {
      res += `Course ${scdl.course?.course_name}, Section ${scdl.section?.section_name}`;
    })

    await ctx.reply(res);
  });

  console.log("Hello")
  bot.catch(console.error);
  // await bot.init();
  // run(bot);
  bot.start();
  // console.info(`Bot ${bot.botInfo.username} us up and running`);
  console.log("started")
}
