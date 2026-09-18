import { NextRequest } from 'next/server';
import mammoth from 'mammoth';
import { getRequestUser } from '@/utils/request-auth';
import { parseLessonDocx } from '@/utils/course-docx-parser';
import { ok, badRequest, unauthorized, forbidden, serverError } from '@/utils/response';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_TEXT_LENGTH = 100000; // sanity bound against a pathological upload
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return unauthorized();
    if (!['ADMIN', 'MANAGER'].includes(user.user_role || '')) {
      return forbidden('Only admins and managers can import lessons');
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return badRequest('A .docx file is required');

    const hasDocxExtension = file.name.toLowerCase().endsWith('.docx');
    if (!hasDocxExtension && file.type !== DOCX_MIME) {
      return badRequest('Only .docx files are supported');
    }
    if (file.size > MAX_FILE_SIZE) {
      return badRequest('File is too large (max 5MB)');
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { value: text } = await mammoth.extractRawText({ buffer });

    const trimmedText = text.trim();
    if (!trimmedText) {
      return badRequest('No readable text found in the document');
    }
    if (trimmedText.length > MAX_TEXT_LENGTH) {
      return badRequest('Document is too long to process');
    }

    const draft = parseLessonDocx(trimmedText);
    return ok({ draft });
  } catch (error) {
    console.error('Course docx extraction error:', error);
    return serverError('Failed to extract lesson from document');
  }
}
