import { Context, NextFunction } from "grammy";
import prisma from "../models/Client";
import MyContext from "../models/Context";

// Middleware to attach user role to ctx
async function attachUserRole(ctx: MyContext, phone_number: string) {
  const user = await prisma.teacher.findUnique({
    where: { phone_number: phone_number },
  });

  if (!user) return ctx.reply("You are not registered.");

  // Attach user info to context
  ctx.session.user = {
    telegramId: user.id,
    phone_number: user.name,
    is_manager: user.is_manager,
  };

}

export default attachUserRole;
