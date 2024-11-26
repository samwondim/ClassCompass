import { Context, SessionFlavor } from "grammy";

import {
  type ConversationFlavor
} from "@grammyjs/conversations";
import SessionData from "../types/SessionData";

type MyContext = Context & ConversationFlavor & SessionFlavor<SessionData>;

export default MyContext;
