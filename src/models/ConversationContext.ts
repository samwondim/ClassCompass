import MyContext from "./Context"
import { type Conversation } from "@grammyjs/conversations";

type MyConversation = Conversation<MyContext>;
export default MyConversation;
