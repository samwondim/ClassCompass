import { startAPI } from "./api";
import { startBot } from "./bot";

import * as dotenv from "dotenv";

//load the config files from .env
dotenv.config();

startBot();
startAPI();
