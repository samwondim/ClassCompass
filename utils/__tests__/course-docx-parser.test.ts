import { describe, expect, it } from "vitest";

import { parseLessonDocx } from "@/utils/course-docx-parser";

// Condensed version of the real lesson-plan template this is tuned against: numbered,
// emoji-prefixed sections rather than flat "Label: value" lines, with duration folded
// into a section header's parenthetical and some fields spanning multiple lines.
const SAMPLE_LESSON = `
📖 የሰንበት ትምህርት

ርዕስ፦ እግዚአብሄር ሁሉን ፈጠረ በ7ተኛውም ቀን አረፈ

የትምህርቱ ዓላማ፦ ልጆች የሁሉ ፈጣሪ እግዚአብሄር መሆኑን እንዲረዱ

ክፍል፦（7 አመት）

📖 1. የመጽሐፍ ቅዱስ መሠረት

መሪ/ ዋና የመጽሐፍ ቅዱስ ክፍል፦

ዘፍጥረት 1፡1-31

ተያያዥ የመጽሐፍ ቅዱስ ክፍሎች፦

ዮሐንስ 1:3

🎒 2. ዝግጅት

የማስተማሪያ አጋዥ ቁሳቁሶች፦

-እግዚአብሄር የፈጠራቸው ፍጥረታት ምስሎች

⏰ 3. የትምህርት ክፍለ ጊዜ(90 ደቂቃ)

😊 እንኳን ደህና መጣችሁ / መግቢያ

✦ ሰላምታ መቀያየር

⏰ ጊዜ፦ 20ደቂቃ

📖 የቃል ጊዜ

✦ መግቢያ • ውይይት • ጥያቄና መልስ

⭐ ዋና ዋና ትምህርቶች / መልዕክቶች

የሁሉ ፈጣሪ እግዚአብሄር ነው ፡፡

እግዚአብሄር የፈጠረው ሁሉ መልካም ነው፡፡

የትምህርቱ አቀራረብ

የመግቢያ ተግባር

-የፍጥረታትን ስዕል በማሳየት ፀሐይን ማን ፈጠረ በማለት ልጆችን ጠይቁ፡፡

📖 የቃል ጊዜ

-ዘፍጥረት አንድን የልጆችን ትኩረት በሚስብ መልኩ ተርኩ፡፡

❤️ 5. ማዛመድ

ከሕይወቴ ጋር እንዴት አዛምደዋለሁ?

እግዚአብሄር ስለፈጠረው መልካም ነገር ሁሌም ልናመሰግነው ይገባል፡፡

6. የክፍል ዉስጥ ተግባር

ለእንዳንዱ ልጅ አንድ ፍሬ ስቲኪ ኖትስ ስጡ፡፡

🙏 7. መደምደሚያ

የዛሬ ዋና መልዕክት፦

የሁሉ ፈጣሪ እግዚአብሄር ነው ፡፡

የማስታወሻ ጥቅስ፦

በመጀመሪያ እግዚአብሄር ሰማይንና ምድርን ፈጠረ፡፡ ዘፍጥረት 1፡1

🧒 ሥም መጥራት / አቴንዳንስ፦

👋 ስንብት
`;

describe("parseLessonDocx", () => {
  it("extracts all fields from the real lesson template structure", () => {
    const draft = parseLessonDocx(SAMPLE_LESSON);

    expect(draft.course_name).toBe("እግዚአብሄር ሁሉን ፈጠረ በ7ተኛውም ቀን አረፈ");
    expect(draft.age_group).toBe("7 አመት");
    expect(draft.duration_minutes).toBe(90);
    expect(draft.verse).toBe("ዘፍጥረት 1፡1-31");
    expect(draft.course_description).toContain("ልጆች የሁሉ ፈጣሪ እግዚአብሄር መሆኑን እንዲረዱ");
    expect(draft.objectives).toEqual([
      "የሁሉ ፈጣሪ እግዚአብሄር ነው ፡፡",
      "እግዚአብሄር የፈጠረው ሁሉ መልካም ነው፡፡",
    ]);
    expect(draft.lesson_plan.opening).toContain("የፍጥረታትን ስዕል በማሳየት");
    expect(draft.lesson_plan.teaching).toContain("ዘፍጥረት አንድን የልጆችን ትኩረት");
    expect(draft.lesson_plan.application).toContain("ከሕይወቴ ጋር እንዴት አዛምደዋለሁ");
    expect(draft.lesson_plan.activity).toContain("ስቲኪ ኖትስ");
    expect(draft.lesson_plan.closing).toContain("የሁሉ ፈጣሪ እግዚአብሄር ነው");
    expect(draft.lesson_plan.memory_verse).toContain("ዘፍጥረት 1፡1");
  });

  it("does not leak unrelated ('related passages') verses into the main verse field", () => {
    const draft = parseLessonDocx(SAMPLE_LESSON);
    expect(draft.verse).not.toContain("ዮሐንስ");
  });

  it("does not treat materials-list content (section 2) as any tracked field", () => {
    const draft = parseLessonDocx(SAMPLE_LESSON);
    const allText = JSON.stringify(draft);
    expect(allText).not.toContain("ማስተማሪያ አጋዥ ቁሳቁሶች");
  });

  it("stops capturing once trailing housekeeping markers (🧒/👋) are reached", () => {
    const draft = parseLessonDocx(SAMPLE_LESSON);
    const allText = JSON.stringify(draft);
    expect(allText).not.toContain("አቴንዳንስ");
    expect(allText).not.toContain("ስንብት");
  });

  it("does not let an emoji sharing a surrogate pair with the stop markers (📖) end the parse early", () => {
    // Regression test: an earlier version used a non-unicode-aware regex where
    // "🧒👋" as a character class matched individual UTF-16 surrogate halves, which
    // silently triggered on any line starting with certain other common emoji (📖
    // shares a high surrogate with 👋) and stopped parsing after the first line.
    const draft = parseLessonDocx(SAMPLE_LESSON);
    expect(draft.course_name).not.toBeNull();
    expect(draft.lesson_plan.closing).not.toBeNull();
  });

  it("does not misfire a section switch on a bulleted outline line that merely mentions a header keyword", () => {
    // "✦ መግቢያ • ውይይት • ጥያቄና መልስ" mentions "opening" as one of several bullet
    // topics but is not itself a section header - it must not steal the next line
    // into the wrong field.
    const draft = parseLessonDocx(SAMPLE_LESSON);
    expect(draft.lesson_plan.opening).not.toContain("ውይይት");
  });

  it("returns an empty draft for blank input without throwing", () => {
    const draft = parseLessonDocx("   \n\n  ");
    expect(draft.course_name).toBeNull();
    expect(draft.objectives).toEqual([]);
    expect(draft.duration_minutes).toBeNull();
    expect(draft.lesson_plan).toEqual({
      opening: null,
      teaching: null,
      application: null,
      activity: null,
      memory_verse: null,
      closing: null,
    });
  });

  it("leaves duration_minutes null when the document has no duration section", () => {
    const draft = parseLessonDocx("ርዕስ፦ Some Title\nክፍል፦（5-7）");
    expect(draft.duration_minutes).toBeNull();
    expect(draft.age_group).toBe("5-7");
  });

  it("accepts a plain ':' as well as the Ethiopic '፦' label separator", () => {
    const draft = parseLessonDocx("ርዕስ: English-colon Title\nክፍል:(6-8)");
    expect(draft.course_name).toBe("English-colon Title");
    expect(draft.age_group).toBe("6-8");
  });
});
