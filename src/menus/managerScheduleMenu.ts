
import { InlineKeyboard } from "grammy";

const optionsDataPairs = [
  ["add schedule", "add-schedule-pl"],
  ["view schedules", "view-schedule-pl"],
];
const optionsRows = optionsDataPairs.map(([label, data]) => InlineKeyboard.text(label, data));
const mScheduleMenu = InlineKeyboard.from([optionsRows])

export default mScheduleMenu;
