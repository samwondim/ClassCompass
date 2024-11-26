import { InlineKeyboard } from "grammy";

const optionsDataPairs = [
  ["add teacher", "add-pl"],
  ["view teachers", "view-pl"],
];
const optionsRows = optionsDataPairs.map(([label, data]) => InlineKeyboard.text(label, data));
const optKeyboard = InlineKeyboard.from([optionsRows])

export default optKeyboard;
