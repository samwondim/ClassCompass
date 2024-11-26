import { InlineKeyboard } from "grammy";

const teacherLabledDataPairs = [
  ["Schedules", "t-schedule-pl"],
  ["Report", "report-pl"],
];

const teacherButtonRows = teacherLabledDataPairs.map(([label, data]) => InlineKeyboard.text(label, data));
const tKeyboard = InlineKeyboard.from([teacherButtonRows])
