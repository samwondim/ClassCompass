import { Bot, session } from "grammy";
import {
  conversations,
  createConversation,
} from "@grammyjs/conversations";
import MyContext from "./models/Context";
import registerTeacher from "./middlewares/registerTeacher";
import optKeyboard from "./menus/subTeachers";
import getTeachers from "./middlewares/getTeachers";
import greetUser from "./middlewares/greetUser";
import { PrismaClient } from "@prisma/client";

import { PsqlAdapter } from '@grammyjs/storage-psql';
import { Client } from "pg";
import tKeyboard from "./menus/teacherMenu";

const prisma = new PrismaClient();

export default async function runApp() {
  const client = new Client({
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: 5432
  });

  try {
    await client.connect();
  } catch (error) {
    console.log(error);
  }

  const bot = new Bot<MyContext>(process.env.BOT_TOKEN as string);

  //register middlewares
  bot.
    use(session({
      initial: () => ({}),
      storage: await PsqlAdapter.create({ tableName: 'sessions', client }),
    })
    ).
    use(conversations()).
    use(createConversation(registerTeacher)).
    use(createConversation(getTeachers)).
    use(createConversation(greetUser));

  //commands
  bot.command("start", async (ctx) => {
    await ctx.reply(`Welcome to Class Compass!\n
I am created @triviosa to help you manage your Sunday School Schedules.`,
      {
        reply_markup: {
          keyboard: [
            [{ text: "Share Phone Number", request_contact: true }],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
  });
  bot.on("message:contact", async (ctx) => {
    const phone_number = ctx.message.contact?.phone_number;
    const telegramId = ctx.from?.id.toString();

    if (phone_number) {
      ctx.session.phone_number = phone_number;
      ctx.session.telegramId = telegramId;
      await ctx.reply("Your phone number has been saved. \nWhat would you like to do?", { reply_markup: tKeyboard });
    } else {
      await ctx.reply("Your phone number has not been saved");
    }
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
    console.log(ctx.session);
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
      await ctx.reply(`You don't have any schedules yet for user ${phone_number}`);
      return;
    }

    let res = `Schedules for ${ctx.from?.first_name + ctx.from?.last_name}\n`;
    schedule.forEach((scdl) => {
      res += `Course ${scdl.course?.course_name}, Section ${scdl.section?.section_name}`;
    })

    await ctx.reply(res);
  });

  bot.catch(console.error);
  bot.start();
  // console.info(`Bot ${bot.botInfo.username} us up and running`);
}
