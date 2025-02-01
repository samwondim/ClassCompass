import { Bot, Keyboard, session } from "grammy";
import * as path from "path";
import {
  conversations,
  createConversation,
} from "@grammyjs/conversations";
import MyContext from "./models/Context";
import registerTeacher from "./middlewares/registerTeacher";
import optKeyboard from "./menus/subTeachers";
import getTeachers from "./middlewares/getTeachers";
import prisma from "./models/Client";

import { PsqlAdapter } from '@grammyjs/storage-psql';
import { Client } from "pg";
import tKeyboard from "./menus/teacherMenu";
import axios from "axios";
import fs from "fs";
import processExcel from "./utils/processExcel";
import mKeyboard from "./menus/managerMenu";
import mScheduleMenu from "./menus/managerScheduleMenu";
import getSchedules from "./middlewares/getSchedules";
import addSchedules from "./middlewares/addSchedules";
import attachUserRole from "./middlewares/attachUserRole";


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
    use(createConversation(getSchedules)).
    use(createConversation(addSchedules));

  bot.callbackQuery("teacher-pl", async (ctx) => {
    await ctx.reply("What would you like to do?", { reply_markup: optKeyboard });
  })

  bot.callbackQuery("schedule-pl", async (ctx) => {
    await ctx.reply("What would you like to do?", { reply_markup: mScheduleMenu });
  })

  bot.callbackQuery("add-schedule-pl", async (ctx) => {
    await ctx.conversation.enter("addSchedules");
  });

  bot.callbackQuery("view-schedule-pl", async (ctx) => {
    await ctx.conversation.enter("getSchedules");
  });

  bot.callbackQuery("add-pl", async (ctx) => {
    await ctx.conversation.enter("registerTeacher");
  });

  bot.callbackQuery("view-pl", async (ctx) => {
    await ctx.conversation.enter("getTeachers");
  })

  // teacher's commands
  bot.callbackQuery("t-schedule-pl", async (ctx) => {
    const phone_number = ctx.session.user.phone_number;
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
        console.log("Filename: ", path.basename(filePath))
        const fileBaseName: string = path.basename(filePath);

        response.data.pipe(writer);

        writer.on("finish", async () => {
          await ctx.reply(`File successfully saved`);
          await processExcel(filePath, fileBaseName);
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

  bot.on("message:contact", async (ctx) => {
    const contact = ctx.message.contact;
    const senderId = ctx.from?.id;

    if (!contact || !contact.user_id || contact.user_id !== senderId) {
      return ctx.reply("❌ Please share your own contact.");
    }
    await ctx.reply("Contact received!");
    await attachUserRole(ctx, contact.phone_number);
  })

  //commands
  bot.command("start", async (ctx) => {
    const keyboard = new Keyboard()
      .requestContact("📞 Share Your Contact")
      .oneTime()
      .resized();

    await ctx.reply(`Welcome to Class Compass!\n
I am created to help you manage your Sunday School Schedules.
You can use these buttons below to manage your schedules and teachers.`)

    await ctx.reply("Please share your phone number to continue:", {
      reply_markup: keyboard,
    });
  });

  bot.command("manage", async (ctx) => {
    if (ctx.session.user?.is_manager) {
      await ctx.reply(`Please choose an option to manage:`,
        {
          reply_markup: mKeyboard
        });
    } else {
      await ctx.reply('You are not a manager :(')
    }
  });

  bot.command("teach", async (ctx) => {
    await ctx.reply("Choose an option to manage your schedules", {
      reply_markup: tKeyboard
    });

  })

  bot.catch(console.error);
  bot.start();
  // console.info(`Bot ${bot.botInfo.username} us up and running`);
}
