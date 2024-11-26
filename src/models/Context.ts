import { Context } from "grammy";

import {
  type ConversationFlavor
} from "@grammyjs/conversations";

type MyContext = Context & ConversationFlavor;

export default MyContext;
