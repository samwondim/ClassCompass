import { NextRequest } from 'next/server';
import mammoth from 'mammoth';
import { getRequestUser } from '@/utils/request-auth';
import { extractCourseFromText, AiExtractionError, MAX_INPUT_CHARS } from '@/utils/course-ai-extract';
import { ok, badRequest, unauthorized, forbidden, serverError, serviceUnavailable } from '@/utils/response';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
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
    if (trimmedText.length > MAX_INPUT_CHARS) {
      return badRequest(
        `Document is too long (${trimmedText.length} characters, max ${MAX_INPUT_CHARS}). Please import a single lesson at a time.`
      );
    }

    const draft = await extractCourseFromText(trimmedText);
    return ok({ draft });
  } catch (error) {
    console.error('Course docx extraction error:', error);
    if (error instanceof AiExtractionError && error.retryable) {
      return serviceUnavailable('The AI service is busy right now. Please try again in a moment.');
    }
    return serverError('Failed to extract lesson from document');
  }
}
