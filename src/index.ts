import { startAPI } from "./api";
import runApp from "./bot";

import * as dotenv from "dotenv";

//load the config files from .env
dotenv.config();

runApp();
