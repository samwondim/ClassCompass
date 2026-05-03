import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/models/client'
import { getUserRole } from '@/utils/data-access'
import * as XLSX from 'xlsx'

interface UserRow {
  first_name?: string
  last_name?: string
  tg_username?: string
  phone_number?: string
  user_role?: string
  section_name?: string
}

interface ScheduleRow {
  course_name?: string
  teacher_username?: string
  section_name?: string
  schedule_date?: string
}

interface ValidationError {
  row: number
  field: string
  message: string
  value?: string
}

interface UploadResult {
  success: boolean
  totalRows: number
  successCount: number
  errorCount: number
  errors: ValidationError[]
}

function parseFile(buffer: Buffer, fileExtension: string): any[] {
  if (fileExtension === '.csv') {
    const content = buffer.toString('utf-8')
    const lines = content.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\r/g, ''))
    const rows: any[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/\r/g, ''))
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      rows.push(row)
    }
    return rows
  } else {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    return XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' })
  }
}

function normalizeUserRole(role?: string): 'TEACHER' | 'MANAGER' | 'ADMIN' {
  if (!role) return 'TEACHER'
  const normalized = role.toUpperCase().trim()
  if (normalized === 'MANAGER') return 'MANAGER'
  if (normalized === 'ADMIN') return 'ADMIN'
  return 'TEACHER'
}

function validateUserRow(row: UserRow, rowIndex: number, isManager: boolean = false): ValidationError[] {
  const errors: ValidationError[] = []

  if (!row.first_name || row.first_name.toString().trim().length < 2) {
    errors.push({
      row: rowIndex,
      field: 'first_name',
      message: 'First name is required (min 2 characters)',
      value: row.first_name?.toString()
    })
  }

  if (!row.tg_username || row.tg_username.toString().trim().length < 2) {
    errors.push({
      row: rowIndex,
      field: 'tg_username',
      message: 'Telegram username is required',
      value: row.tg_username?.toString()
    })
  }

  if (!row.phone_number || row.phone_number.toString().trim().length < 8) {
    errors.push({
      row: rowIndex,
      field: 'phone_number',
      message: 'Phone number is required (min 8 characters)',
      value: row.phone_number?.toString()
    })
  }

  if (!isManager) {
    const validRoles = ['TEACHER', 'MANAGER', 'ADMIN', '']
    const role = row.user_role?.toString().toUpperCase().trim()
    if (role && !validRoles.includes(role)) {
      errors.push({
        row: rowIndex,
        field: 'user_role',
        message: 'Invalid role (must be TEACHER, MANAGER, or ADMIN)',
        value: row.user_role?.toString()
      })
    }
  }

  return errors
}

function validateScheduleRow(row: ScheduleRow, rowIndex: number): ValidationError[] {
  const errors: ValidationError[] = []

  if (!row.course_name || row.course_name.toString().trim().length < 1) {
    errors.push({
      row: rowIndex,
      field: 'course_name',
      message: 'Course name is required',
      value: row.course_name?.toString()
    })
  }

  if (!row.teacher_username || row.teacher_username.toString().trim().length < 2) {
    errors.push({
      row: rowIndex,
      field: 'teacher_username',
      message: 'Teacher username is required',
      value: row.teacher_username?.toString()
    })
  }

  if (!row.section_name || row.section_name.toString().trim().length < 1) {
    errors.push({
      row: rowIndex,
      field: 'section_name',
      message: 'Section name is required',
      value: row.section_name?.toString()
    })
  }

  if (!row.schedule_date) {
    errors.push({
      row: rowIndex,
      field: 'schedule_date',
      message: 'Schedule date is required',
      value: row.schedule_date?.toString()
    })
  } else {
    const date = new Date(row.schedule_date)
    if (isNaN(date.getTime())) {
      errors.push({
        row: rowIndex,
        field: 'schedule_date',
        message: 'Invalid date format (use ISO format: YYYY-MM-DD or YYYY-MM-DDTHH:MM)',
        value: row.schedule_date?.toString()
      })
    }
  }

  return errors
}

async function processUserUploads(rows: UserRow[], user: any): Promise<UploadResult> {
  const errors: ValidationError[] = []
  let successCount = 0
  const isManager = user?.user_role === 'MANAGER'

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowIndex = i + 2

    // Normalize row keys to match our expected format, similar to frontend
    const normalizedRow: UserRow = {
      first_name: (row.first_name || row.firstName || row['First Name'] || row['ስም'] || '').toString(),
      last_name: (row.last_name || row.lastName || row['Last Name'] || row['የአባት ስም'] || '').toString(),
      tg_username: (row.tg_username || row.tgUsername || row['Telegram Username'] || row.username || row['ተሌግራም ዩዘርኔም'] || '').toString(),
      phone_number: (row.phone_number || row.phoneNumber || row['Phone Number'] || row['የስልክ ቁጥር'] || '').toString(),
      user_role: (row.user_role || row.userRole || row['User Role'] || row.role || '').toString(),
      section_name: (row.section_name || row.sectionName || row['Section Name'] || row['ክፍል'] || '').toString()
    }

    const rowErrors = validateUserRow(normalizedRow, rowIndex, isManager)
    if (rowErrors.length > 0) {
      errors.push(...rowErrors)
      continue
    }

    try {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { tg_username: normalizedRow.tg_username!.trim() },
            { phone_number: normalizedRow.phone_number!.trim() }
          ]
        }
      })

      if (existingUser) {
        errors.push({
          row: rowIndex,
          field: 'tg_username/phone_number',
          message: 'User with this Telegram username or phone number already exists',
          value: normalizedRow.tg_username
        })
        continue
      }

      const finalRole = isManager ? 'TEACHER' : normalizeUserRole(normalizedRow.user_role)

      const createdUser = await prisma.user.create({
        data: {
          first_name: normalizedRow.first_name!.trim(),
          last_name: normalizedRow.last_name?.trim() || null,
          tg_username: normalizedRow.tg_username!.trim(),
          phone_number: normalizedRow.phone_number!.trim().replace(/\s/g, ''),
          user_role: finalRole
        }
      })

      if (normalizedRow.section_name && finalRole === 'TEACHER') {
        const section = await prisma.section.findFirst({
          where: { section_name: { equals: normalizedRow.section_name.trim(), mode: 'insensitive' } }
        })

        if (section) {
          if (isManager) {
            const managerOwnsSection = await prisma.managerSection.findFirst({
              where: {
                manager_id: user.user_id,
                section_id: section.section_id
              }
            })

            if (!managerOwnsSection) {
              errors.push({
                row: rowIndex,
                field: 'section_name',
                message: 'You can only add teachers to sections you manage',
                value: normalizedRow.section_name
              })
              continue
            }
          }

          await prisma.teacherSection.create({
            data: {
              teacher_id: createdUser.user_id,
              section_id: section.section_id
            }
          })
        } else {
          errors.push({
            row: rowIndex,
            field: 'section_name',
            message: `Section "${normalizedRow.section_name}" not found. User created but not assigned.`,
            value: normalizedRow.section_name
          })
        }
      } else if (normalizedRow.section_name && finalRole === 'MANAGER' && !isManager) {
        const section = await prisma.section.findFirst({
          where: { section_name: { equals: normalizedRow.section_name.trim(), mode: 'insensitive' } }
        })

        if (section) {
          await prisma.managerSection.create({
            data: {
              manager_id: createdUser.user_id,
              section_id: section.section_id
            }
          })
        } else {
          errors.push({
            row: rowIndex,
            field: 'section_name',
            message: `Section "${normalizedRow.section_name}" not found. User created but not assigned.`,
            value: normalizedRow.section_name
          })
        }
      }

      successCount++
    } catch (error: any) {
      console.error(`Error creating user at row ${rowIndex}:`, error)
      errors.push({
        row: rowIndex,
        field: 'general',
        message: error?.message || 'Failed to create user',
        value: row.tg_username
      })
    }
  }

  return {
    success: errors.length === 0,
    totalRows: rows.length,
    successCount,
    errorCount: errors.length,
    errors
  }
}

async function processScheduleUploads(rows: ScheduleRow[], request: NextRequest): Promise<UploadResult> {
  const user = await getUserRole(request)
  const errors: ValidationError[] = []
  let successCount = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowIndex = i + 2

    // Normalize row keys
    const normalizedRow: ScheduleRow = {
      course_name: (row.course_name || row.courseName || row['Course Name'] || row.Course || '').toString(),
      teacher_username: (row.teacher_username || row.teacherUsername || row.teacher || row['Teacher'] || row['Teacher Username'] || '').toString(),
      section_name: (row.section_name || row.sectionName || row['Section Name'] || row.Section || '').toString(),
      schedule_date: (row.schedule_date || row.scheduleDate || row['Schedule Date'] || row.Date || '').toString()
    }

    const rowErrors = validateScheduleRow(normalizedRow, rowIndex)
    if (rowErrors.length > 0) {
      errors.push(...rowErrors)
      continue
    }

    try {
      const course = await prisma.course.findFirst({
        where: { course_name: { equals: normalizedRow.course_name!.trim(), mode: 'insensitive' } }
      })

      if (!course) {
        errors.push({
          row: rowIndex,
          field: 'course_name',
          message: `Course "${normalizedRow.course_name}" not found`,
          value: normalizedRow.course_name
        })
        continue
      }

      const section = await prisma.section.findFirst({
        where: { section_name: { equals: normalizedRow.section_name!.trim(), mode: 'insensitive' } }
      })

      if (!section) {
        errors.push({
          row: rowIndex,
          field: 'section_name',
          message: `Section "${normalizedRow.section_name}" not found`,
          value: normalizedRow.section_name
        })
        continue
      }

      // Check if course belongs to the section
      if (course.section_id && course.section_id !== section.section_id) {
        errors.push({
          row: rowIndex,
          field: 'course_name',
          message: `Course "${normalizedRow.course_name}" does not belong to section "${normalizedRow.section_name}"`,
          value: normalizedRow.course_name
        })
        continue
      }

      const teacher = await prisma.user.findFirst({
        where: { tg_username: { equals: normalizedRow.teacher_username!.trim(), mode: 'insensitive' } }
      })

      if (!teacher) {
        errors.push({
          row: rowIndex,
          field: 'teacher_username',
          message: `Teacher with username "${normalizedRow.teacher_username}" not found`,
          value: normalizedRow.teacher_username
        })
        continue
      }

      if (user?.user_role === 'MANAGER') {
        const managerOwnsSection = await prisma.managerSection.findFirst({
          where: {
            manager_id: user.user_id,
            section_id: section.section_id
          }
        })

        if (!managerOwnsSection) {
          errors.push({
            row: rowIndex,
            field: 'section_name',
            message: 'You can only create schedules for sections you manage',
            value: normalizedRow.section_name
          })
          continue
        }
      }

      const teacherSection = await prisma.teacherSection.findFirst({
        where: {
          teacher_id: teacher.user_id,
          section_id: section.section_id
        }
      })

      if (!teacherSection) {
        errors.push({
          row: rowIndex,
          field: 'teacher_username',
          message: `Teacher "${normalizedRow.teacher_username}" is not assigned to section "${normalizedRow.section_name}"`,
          value: normalizedRow.teacher_username
        })
        continue
      }

      const scheduleDate = new Date(normalizedRow.schedule_date!)

      const existingSchedule = await prisma.schedule.findFirst({
        where: {
          course_id: course.course_id,
          teacher_id: teacher.user_id,
          section_id: section.section_id,
          schedule_date: scheduleDate
        }
      })

      if (existingSchedule) {
        errors.push({
          row: rowIndex,
          field: 'schedule_date',
          message: 'Schedule already exists for this course, teacher, section, and date',
          value: row.schedule_date
        })
        continue
      }

      await prisma.schedule.create({
        data: {
          course_id: course.course_id,
          teacher_id: teacher.user_id,
          section_id: section.section_id,
          schedule_date: scheduleDate
        }
      })

      successCount++
    } catch (error: any) {
      console.error(`Error creating schedule at row ${rowIndex}:`, error)
      errors.push({
        row: rowIndex,
        field: 'general',
        message: error?.message || 'Failed to create schedule',
        value: row.course_name
      })
    }
  }

  return {
    success: errors.length === 0,
    totalRows: rows.length,
    successCount,
    errorCount: errors.length,
    errors
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserRole(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['ADMIN', 'MANAGER'].includes(user.user_role || '')) {
      return NextResponse.json({ error: 'Forbidden: Only admins and managers can bulk upload' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const uploadType = formData.get('type') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!uploadType || !['users', 'schedules'].includes(uploadType)) {
      return NextResponse.json({ error: 'Invalid upload type. Must be "users" or "schedules"' }, { status: 400 })
    }

    const allowedExtensions = ['.xlsx', '.xls', '.csv']
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))

    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json({
        error: 'Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV file'
      }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    let parsedData: any[]
    try {
      parsedData = parseFile(buffer, fileExtension)
    } catch (error) {
      console.error('File parsing error:', error)
      return NextResponse.json({
        error: 'Failed to parse file. Please ensure it is a valid Excel or CSV file'
      }, { status: 400 })
    }

    if (parsedData.length === 0) {
      return NextResponse.json({
        error: 'No data found in the file. Please ensure the file has headers and at least one data row.'
      }, { status: 400 })
    }

    let result: UploadResult

    if (uploadType === 'users') {
      result = await processUserUploads(parsedData, user)
    } else {
      result = await processScheduleUploads(parsedData, request)
    }

    return NextResponse.json(result, { status: 200 })

  } catch (error) {
    console.error('Bulk upload error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
