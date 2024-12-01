import { Bot, session } from "grammy";
import {
  conversations,
  createConversation,
} from "@grammyjs/conversations";
import MyContext from "./models/Context";
import registerTeacher from "./middlewares/registerTeacher";
import optKeyboard from "./menus/subTeachers";
import getTeachers from "./middlewares/getTeachers";
import { PrismaClient } from "@prisma/client";

import { PsqlAdapter } from '@grammyjs/storage-psql';
import { Client } from "pg";
import tKeyboard from "./menus/teacherMenu";
import axios from "axios";
import fs from "fs";
import processExcel from "./utils/processExcel";

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
    use(createConversation(getTeachers));

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
    // const schedule = await prisma.schedule.findMany({
    //   where: {
    //     teacher: {
    //       phone_number: phone_number
    //     }
    //   },
    //   include: {
    //     course: true,
    //     section: true
    //   }
    // });
    //
    // if (schedule.length === 0) {
    //   await ctx.reply(`You don't have any schedules yet for user ${phone_number}`);
    //   return;
    // }
    //
    // let res = `Schedules for ${ctx.from?.first_name + ctx.from?.last_name}\n`;
    // schedule.forEach((scdl) => {
    //   res += `Course ${scdl.course?.course_name}, Section ${scdl.section?.section_name}`;
    // })
    //
    // await ctx.reply(res);
  });

  bot.on("message:document", async (ctx) => {
    const file = ctx.message.document;

    if (file) {
      const fileId = file.file_id;
      const fileInfo = await ctx.api.getFile(fileId);
      const fileLink = `https://api.telegram.org/file/bot${bot.token}/${fileInfo.file_path}`;

      try {
        // Await the axios response before accessing `data`
        const response = await axios.get(fileLink, { responseType: "stream" });

        // Save the file locally
        const filePath = `./uploads/${file.file_name}`;
        const writer = fs.createWriteStream(filePath);

        response.data.pipe(writer);

        writer.on("finish", async () => {
          await ctx.reply(`File saved`);
          await processExcel(filePath);

        });
        writer.on("error", (err) => {
          console.error(err);
          ctx.reply("Error saving the file.");
        });
      } catch (error) {
        console.error("Error downloading file:", error);
        ctx.reply("Failed to download the file.");
      }
    } else {
      await ctx.reply("No document found in your message.");
    }
  });

  bot.catch(console.error);
  bot.start();
  // console.info(`Bot ${bot.botInfo.username} us up and running`);
}
