import { InlineKeyboard } from "grammy";

const managerLabledDataPairs = [
  ["Teachers", "teacher-pl"],
  ["Schedules", "schedule-pl"],
  // ["Request", "request-pl"],
];
const managerButtonRows = managerLabledDataPairs.map(([label, data]) => InlineKeyboard.text(label, data));
const mKeyboard = InlineKeyboard.from([managerButtonRows])

export default mKeyboard;
