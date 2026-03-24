'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle2, XCircle, Upload, FileSpreadsheet, AlertCircle } from 'lucide-react'
import useToast from '@/hooks/use-toast'
import * as XLSX from 'xlsx'

type UploadType = 'users' | 'schedules'

interface UserRow {
  first_name?: string
  last_name?: string
  tg_username?: string
  phone_number?: string
  user_role?: string
  section_name?: string
  _rowNumber: number
  _errors: string[]
}

interface ScheduleRow {
  course_name?: string
  teacher_username?: string
  section_name?: string
  schedule_date?: string
  _rowNumber: number
  _errors: string[]
}

interface ValidationError {
  row: number
  field: string
  message: string
  value?: string
}

const userColumns = ['#', 'First Name', 'Last Name', 'Telegram', 'Phone', 'Role', 'Section', 'Status']
const scheduleColumns = ['#', 'Course', 'Teacher', 'Section', 'Date', 'Status']

interface BulkUploadFormProps {
  role?: 'ADMIN' | 'MANAGER'
}

export function BulkUploadForm({ role = 'ADMIN' }: BulkUploadFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const isManager = role === 'MANAGER'
  const [uploadType, setUploadType] = useState<UploadType>('users')
  const [file, setFile] = useState<File | null>(null)
  const [parsedUsers, setParsedUsers] = useState<UserRow[]>([])
  const [parsedSchedules, setParsedSchedules] = useState<ScheduleRow[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const validateUserRow = (row: any, rowIndex: number): string[] => {
    const errors: string[] = []

    if (!row.first_name || row.first_name.toString().trim().length < 2) {
      errors.push('First name is required (min 2 characters)')
    }
    if (!row.tg_username || row.tg_username.toString().trim().length < 2) {
      errors.push('Telegram username is required')
    }
    if (!row.phone_number || row.phone_number.toString().trim().length < 8) {
      errors.push('Phone number is required (min 8 characters)')
    }
    
    if (isManager) {
      const userRole = row.user_role?.toString().toUpperCase().trim()
      if (userRole && userRole !== 'TEACHER' && userRole !== '') {
        errors.push('Managers can only create TEACHER users')
      }
    } else {
      const validRoles = ['TEACHER', 'MANAGER', 'ADMIN', '']
      const userRole = row.user_role?.toString().toUpperCase().trim()
      if (userRole && !validRoles.includes(userRole)) {
        errors.push('Invalid role (must be TEACHER, MANAGER, or ADMIN)')
      }
    }

    return errors
  }

  const validateScheduleRow = (row: any, rowIndex: number): string[] => {
    const errors: string[] = []

    if (!row.course_name || row.course_name.toString().trim().length < 1) {
      errors.push('Course name is required')
    }
    if (!row.teacher_username && !row.teacher) {
      errors.push('Teacher username is required')
    }
    if (!row.section_name) {
      errors.push('Section name is required')
    }
    if (!row.schedule_date) {
      errors.push('Schedule date is required')
    } else {
      const date = new Date(row.schedule_date)
      if (isNaN(date.getTime())) {
        errors.push('Invalid date format')
      }
    }

    return errors
  }

  const parseFile = useCallback(async (selectedFile: File) => {
    try {
      const buffer = await selectedFile.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' })

      if (jsonData.length === 0) {
        toast({
          title: 'Error',
          description: 'No data found in the file',
          variant: 'destructive'
        })
        return
      }

      const errors: ValidationError[] = []

      if (uploadType === 'users') {
        const parsed: UserRow[] = []
        jsonData.forEach((row: any, index: number) => {
          const normalizedRow = {
            first_name: row.first_name || row.firstName || row['First Name'] || row['ስም'] || '',
            last_name: row.last_name || row.lastName || row['Last Name'] || row['የአባት ስም'] || '',
            tg_username: row.tg_username || row.tgUsername || row['Telegram Username'] || row.username || row['ተሌግራም ዩዘርኔም'] || '',
            phone_number: row.phone_number || row.phoneNumber || row['Phone Number'] || row['የስልክ ቁጥር'] || '',
            user_role: row.user_role || row.userRole || row['User Role'] || row.role || 'TEACHER',
            section_name: row.section_name || row.sectionName || row['Section Name'] || row['ክፍል'] || ''
          }
          const rowErrors = validateUserRow(normalizedRow, index + 2)
          parsed.push({
            ...normalizedRow,
            _rowNumber: index + 2,
            _errors: rowErrors
          })
          rowErrors.forEach(err => {
            errors.push({
              row: index + 2,
              field: err.split(' ')[0].toLowerCase(),
              message: err,
              value: ''
            })
          })
        })
        setParsedUsers(parsed)
        setParsedSchedules([])
      } else {
        const parsed: ScheduleRow[] = []
        jsonData.forEach((row: any, index: number) => {
          const normalizedRow = {
            course_name: row.course_name || row.courseName || row['Course Name'] || row['Course'] || '',
            teacher_username: row.teacher_username || row.teacher_username || row.teacherUsername || row.teacher || row['Teacher'] || row['Teacher Username'] || '',
            section_name: row.section_name || row.sectionName || row['Section Name'] || row['Section'] || '',
            schedule_date: row.schedule_date || row.scheduleDate || row['Schedule Date'] || row['Date'] || ''
          }
          const rowErrors = validateScheduleRow(normalizedRow, index + 2)
          parsed.push({
            ...normalizedRow,
            _rowNumber: index + 2,
            _errors: rowErrors
          })
          rowErrors.forEach(err => {
            errors.push({
              row: index + 2,
              field: err.split(' ')[0].toLowerCase(),
              message: err,
              value: ''
            })
          })
        })
        setParsedSchedules(parsed)
        setParsedUsers([])
      }

      setValidationErrors(errors)

      if (errors.length > 0) {
        toast({
          title: 'Validation Warning',
          description: `${errors.length} validation errors found. You can still proceed with valid rows.`,
          variant: 'default'
        })
      }

    } catch (error) {
      console.error('File parsing error:', error)
      toast({
        title: 'Error',
        description: 'Failed to parse file. Please ensure it is a valid Excel or CSV file.',
        variant: 'destructive'
      })
    }
  }, [uploadType, toast])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const allowedExtensions = ['.xlsx', '.xls', '.csv']
      const fileExtension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'))

      if (!allowedExtensions.includes(fileExtension)) {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload an Excel (.xlsx, .xls) or CSV file',
          variant: 'destructive'
        })
        return
      }

      setFile(selectedFile)
      parseFile(selectedFile)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      const allowedExtensions = ['.xlsx', '.xls', '.csv']
      const fileExtension = droppedFile.name.toLowerCase().slice(droppedFile.name.lastIndexOf('.'))

      if (!allowedExtensions.includes(fileExtension)) {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload an Excel (.xlsx, .xls) or CSV file',
          variant: 'destructive'
        })
        return
      }

      setFile(droppedFile)
      parseFile(droppedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'No File',
        description: 'Please select a file to upload',
        variant: 'destructive'
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', uploadType)

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch('/api/admin/bulk-upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      if (data.successCount > 0) {
        toast({
          title: 'Upload Complete',
          description: `${data.successCount} of ${data.totalRows} records created successfully.${data.errorCount > 0 ? ` ${data.errorCount} errors.` : ''}`,
          variant: data.errorCount > 0 ? 'default' : 'default'
        })
        router.refresh()
      } else {
        toast({
          title: 'Upload Failed',
          description: 'No records were created. Check validation errors.',
          variant: 'destructive'
        })
      }

    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'An error occurred during upload',
        variant: 'destructive'
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const parsedData = uploadType === 'users' ? parsedUsers : parsedSchedules
  const validRows = parsedData.filter(row => row._errors.length === 0).length
  const invalidRows = parsedData.filter(row => row._errors.length > 0).length

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Upload
          </CardTitle>
          <CardDescription>
            Upload an Excel or CSV file to bulk create {uploadType === 'users' ? 'users' : 'schedules'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Upload Type</Label>
            <Select value={uploadType} onValueChange={(value) => {
              setUploadType(value as UploadType)
              setFile(null)
              setParsedUsers([])
              setParsedSchedules([])
              setValidationErrors([])
            }}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="users">Users (Teachers, Managers)</SelectItem>
                <SelectItem value="schedules">Schedules</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">
              Drag and drop your file here, or
            </p>
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-primary hover:underline">browse files</span>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
              />
            </label>
            <p className="text-xs text-muted-foreground mt-2">
              Supported formats: .xlsx, .xls, .csv
            </p>
          </div>

          {file && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null)
                  setParsedUsers([])
                  setParsedSchedules([])
                  setValidationErrors([])
                }}
              >
                Remove
              </Button>
            </div>
          )}

          {uploadType === 'users' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Expected Columns for Users</AlertTitle>
              <AlertDescription>
                <code className="text-xs">
                  {isManager 
                    ? 'first_name, last_name, tg_username, phone_number, user_role (TEACHER only), section_name'
                    : 'first_name, last_name, tg_username, phone_number, user_role (TEACHER/MANAGER/ADMIN), section_name'
                  }
                </code>
              </AlertDescription>
            </Alert>
          )}

          {uploadType === 'schedules' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Expected Columns for Schedules</AlertTitle>
              <AlertDescription>
                <code className="text-xs">course_name, teacher_username, section_name, schedule_date (YYYY-MM-DD or ISO format)</code>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview ({parsedData.length} rows)</CardTitle>
            <CardDescription className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                {validRows} valid
              </span>
              {invalidRows > 0 && (
                <span className="flex items-center gap-1">
                  <XCircle className="h-4 w-4 text-red-500" />
                  {invalidRows} with errors
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    {(uploadType === 'users' ? userColumns : scheduleColumns).map((col, i) => (
                      <th key={i} className="px-3 py-2 text-left">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 100).map((row: any, index: number) => (
                    <tr key={index} className={row._errors.length > 0 ? 'bg-red-50' : ''}>
                      <td className="px-3 py-2">{row._rowNumber}</td>
                      {uploadType === 'users' ? (
                        <>
                          <td className="px-3 py-2">{row.first_name}</td>
                          <td className="px-3 py-2">{row.last_name || '-'}</td>
                          <td className="px-3 py-2">{row.tg_username}</td>
                          <td className="px-3 py-2">{row.phone_number}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              row.user_role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                              row.user_role === 'MANAGER' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {row.user_role || 'TEACHER'}
                            </span>
                          </td>
                          <td className="px-3 py-2">{row.section_name || '-'}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2">{row.course_name}</td>
                          <td className="px-3 py-2">{row.teacher_username}</td>
                          <td className="px-3 py-2">{row.section_name}</td>
                          <td className="px-3 py-2">{row.schedule_date ? new Date(row.schedule_date).toLocaleString() : '-'}</td>
                        </>
                      )}
                      <td className="px-3 py-2">
                        {row._errors.length === 0 ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <div className="flex items-center gap-1 text-red-500">
                            <XCircle className="h-4 w-4" />
                            <span className="text-xs">{row._errors.length} error(s)</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedData.length > 100 && (
                <p className="text-center text-muted-foreground py-4">
                  Showing first 100 of {parsedData.length} rows
                </p>
              )}
            </div>

            {validationErrors.length > 0 && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Validation Errors</AlertTitle>
                <AlertDescription className="max-h-40 overflow-y-auto">
                  <ul className="list-disc list-inside text-sm">
                    {validationErrors.slice(0, 20).map((error, index) => (
                      <li key={index}>
                        Row {error.row}, {error.field}: {error.message}
                      </li>
                    ))}
                    {validationErrors.length > 20 && (
                      <li className="font-medium">
                        ... and {validationErrors.length - 20} more errors
                      </li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {isUploading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => router.push(isManager ? '/manager' : '/admin')}
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          disabled={!file || isUploading || parsedData.length === 0}
        >
          {isUploading ? 'Uploading...' : `Upload ${uploadType === 'users' ? 'Users' : 'Schedules'}`}
        </Button>
      </div>
    </div>
  )
}
