// Deterministic (no AI) parser that turns the raw text of an uploaded .docx lesson
// into a structured Course draft. The result is always a human-reviewable draft -
// callers must let the admin/manager edit it before saving, never persist it directly.
//
// Tuned against a real lesson-plan template used by this church: a numbered,
// emoji-prefixed section structure (Bible Basis / Preparation / Time Schedule /
// Presentation / Relate / In-class Activity / Closing) rather than flat "Label: value"
// lines. Word's auto-numbered lists don't survive plain-text extraction, so section
// numbers are unreliable - matching is done on the section title text instead.
// Documents that deviate significantly from this template will simply end up with
// fewer fields filled in (never wrong data), since a human always reviews the draft
// before saving.

export interface ExtractedCourseDraft {
  course_name: string | null;
  verse: string | null;
  course_description: string | null;
  objectives: string[];
  age_group: string | null;
  duration_minutes: number | null;
  lesson_plan: {
    opening: string | null;
    teaching: string | null;
    application: string | null;
    activity: string | null;
    memory_verse: string | null;
    closing: string | null;
  };
}

type BufferKey = 'description' | 'verse' | 'objectives' | 'opening' | 'teaching' | 'application' | 'activity' | 'closing' | 'memory_verse';

// Accepts either the Ethiopic colon (፦, U+1366) or a plain ":" as a label separator.
const LABEL_SEP = '[፦:]';

function stripBulletPrefix(line: string): string {
  return line.replace(/^[-•✦➜*]\s*/, '').trim();
}

function endsWithSentencePunctuation(line: string): boolean {
  return /[።፡?!.][»"'）)]?$/.test(line.trim());
}

// Drops short, unpunctuated lines - almost always a decorative section heading that
// slipped through rather than real lesson content (e.g. "🎒 2. ዝግጅት").
function isLikelyNoise(line: string): boolean {
  const words = line.split(/\s+/).filter(Boolean);
  return words.length <= 3 && !endsWithSentencePunctuation(line);
}

function cleanLines(lines: string[], filterNoise: boolean): string[] {
  return lines
    .map(stripBulletPrefix)
    .filter((l) => l.length > 0 && (!filterNoise || !isLikelyNoise(l)));
}

// Verse references are inherently short (e.g. "ዮሓ 3:16") and never end in sentence
// punctuation, so the noise filter - tuned to drop stray section headings - would
// wrongly strip them. Their content is already bounded by dedicated label/terminator
// matches above, so noise-filtering isn't needed for correctness there anyway.
function finalizeText(lines: string[], filterNoise = true): string | null {
  const cleaned = cleanLines(lines, filterNoise);
  return cleaned.length > 0 ? cleaned.join('\n') : null;
}

function finalizeList(lines: string[]): string[] {
  return cleanLines(lines, true);
}

export function parseLessonDocx(documentText: string): ExtractedCourseDraft {
  const lines = documentText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  let course_name: string | null = null;
  let age_group: string | null = null;
  let duration_minutes: number | null = null;

  const buffers: Record<BufferKey, string[]> = {
    description: [],
    verse: [],
    objectives: [],
    opening: [],
    teaching: [],
    application: [],
    activity: [],
    closing: [],
    memory_verse: [],
  };

  let current: BufferKey | null = null;
  let stopped = false;

  for (const line of lines) {
    if (stopped) break;

    // Trailing housekeeping (roll call, farewell) marks the end of useful content.
    if (/^[🧒👋]/u.test(line)) {
      stopped = true;
      continue;
    }

    const titleMatch = line.match(new RegExp(`^ርዕስ${LABEL_SEP}\\s*(.+)$`));
    if (titleMatch) {
      course_name = titleMatch[1].trim();
      current = null;
      continue;
    }

    const ageMatch = line.match(/ክፍል[፦:]\s*[（(]\s*(.+?)\s*[）)]/);
    if (ageMatch) {
      age_group = ageMatch[1].trim();
      current = null;
      continue;
    }

    const durationMatch = line.match(/ትምህርት\s*ክፍለ\s*ጊዜ[^0-9]*(\d+)\s*ደቂቃ/);
    if (durationMatch) {
      duration_minutes = Number(durationMatch[1]);
      continue;
    }

    const descriptionMatch = line.match(new RegExp(`^የትምህርቱ\\s*[ዓአ]ላማ${LABEL_SEP}\\s*(.*)$`));
    if (descriptionMatch) {
      current = 'description';
      if (descriptionMatch[1].trim()) buffers.description.push(descriptionMatch[1].trim());
      continue;
    }

    const verseLabelMatch = line.match(new RegExp(`^መሪ.*መጽሐፍ\\s*ቅዱስ\\s*ክፍል${LABEL_SEP}\\s*(.*)$`));
    if (verseLabelMatch) {
      current = 'verse';
      if (verseLabelMatch[1].trim()) buffers.verse.push(verseLabelMatch[1].trim());
      continue;
    }
    if (/ተያያዥ\s*የመጽሐፍ\s*ቅዱስ\s*ክፍሎች/.test(line)) {
      // Related (non-primary) passages - not the course's main verse, stop capturing.
      current = null;
      continue;
    }

    // A "•"-separated line is always a compact outline bullet (e.g. a line listing
    // "Opening • Discussion • Q&A" as sub-topics), never a real section header - even
    // though it may contain a header keyword as one of its listed topics.
    const isBulletList = line.includes('•');

    if (!isBulletList && /[ዋዉ]ና\s*[ዋዉ]ና\s*ትምህርት|መልዕክቶች/.test(line)) {
      current = 'objectives';
      continue;
    }

    if (!isBulletList && /መግቢያ/.test(line)) {
      current = 'opening';
      continue;
    }
    if (!isBulletList && /የቃል\s*ጊዜ/.test(line)) {
      current = 'teaching';
      continue;
    }
    if (!isBulletList && /ማዛመድ/.test(line)) {
      current = 'application';
      continue;
    }
    if (!isBulletList && /የክፍል\s*[ዉው]ስጥ\s*ተግባር/.test(line)) {
      current = 'activity';
      continue;
    }
    if (!isBulletList && /መደምደሚያ/.test(line)) {
      current = 'closing';
      continue;
    }
    const memoryVerseMatch = line.match(new RegExp(`የማስታወ[ሻስ]\\s*ጥቅስ${LABEL_SEP}\\s*(.*)$`));
    if (memoryVerseMatch) {
      current = 'memory_verse';
      if (memoryVerseMatch[1].trim()) buffers.memory_verse.push(memoryVerseMatch[1].trim());
      continue;
    }

    if (current) buffers[current].push(line);
  }

  return {
    course_name,
    verse: finalizeText(buffers.verse, false),
    course_description: finalizeText(buffers.description),
    objectives: finalizeList(buffers.objectives),
    age_group,
    duration_minutes,
    lesson_plan: {
      opening: finalizeText(buffers.opening),
      teaching: finalizeText(buffers.teaching),
      application: finalizeText(buffers.application),
      activity: finalizeText(buffers.activity),
      memory_verse: finalizeText(buffers.memory_verse, false),
      closing: finalizeText(buffers.closing),
    },
  };
}
