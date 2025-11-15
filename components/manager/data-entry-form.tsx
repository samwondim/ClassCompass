'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useTelegram } from '@/components/telegram-provider'
import { CalendarIcon, Loader2, Save } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { format, addDays } from 'date-fns'
import { useIsMobile } from '@/components/ui/use-mobile'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from '@/components/ui/drawer'

interface Teacher {
	id: number
	name: string
	phone_number: string
	is_manager: boolean
}

interface Course {
	id: number
	course_name: string
	verse?: string
}

interface Section {
	id: number
	section_name: string
}

export function DataEntryForm() {
	const { webApp } = useTelegram()
	const { toast } = useToast()
	const [loading, setLoading] = useState(false)
	const [loadingData, setLoadingData] = useState(false)
	const isMobile = useIsMobile()

	// Data lists
	const [teachers, setTeachers] = useState<Teacher[]>([])
	const [courses, setCourses] = useState<Course[]>([])
	const [sections, setSections] = useState<Section[]>([])

	// Form state
	const [scheduleForm, setScheduleForm] = useState({
		teacher_id: '',
		course_id: '',
		section_id: '',
		date: undefined as Date | undefined,
		time: '09:00'
	})
	
	const [showDatePicker, setShowDatePicker] = useState(false)
	const [mobilePickerOpen, setMobilePickerOpen] = useState(false)

	// Load data on component mount
	useEffect(() => {
		loadData()
	}, [])

	const loadData = async () => {
		if (!webApp) return
		
		setLoadingData(true)
		try {
			const headers = {
				'x-telegram-init-data': webApp.initData
			}

			const [teachersRes, coursesRes, sectionsRes] = await Promise.all([
				fetch('/api/teachers', { headers }),
				fetch('/api/courses', { headers }),
				fetch('/api/sections', { headers })
			])

			if (teachersRes.ok) {
				const data = await teachersRes.json()
				setTeachers(data.teachers)
			}

			if (coursesRes.ok) {
				const data = await coursesRes.json()
				setCourses(data.courses)
			}

			if (sectionsRes.ok) {
				const data = await sectionsRes.json()
				setSections(data.sections)
			}
		} catch (error) {
			console.error('Error loading data:', error)
		} finally {
			setLoadingData(false)
		}
	}

	const handleScheduleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		
		if (!webApp) {
			toast({
				title: 'Error',
				description: 'Telegram WebApp not initialized',
				variant: 'destructive'
			})
			return
		}

		if (!scheduleForm.teacher_id || !scheduleForm.date) {
			toast({
				title: 'Error',
				description: 'Teacher and date are required',
				variant: 'destructive'
			})
			return
		}

		// Validate date is not in the past
		const selectedDate = new Date(scheduleForm.date)
		const [hours, minutes] = scheduleForm.time.split(':').map(Number)
		selectedDate.setHours(hours, minutes, 0, 0)
		
		const now = new Date()
		if (selectedDate < now) {
			toast({
				title: 'Error',
				description: 'Please select a future date and time',
				variant: 'destructive'
			})
			return
		}

		// Check for duplicate schedule
		try {
			const duplicateCheck = await fetch(`/api/schedules/check?teacher_id=${scheduleForm.teacher_id}&date=${selectedDate.toISOString()}`, {
				headers: {
					'x-telegram-init-data': webApp.initData
				}
			})
			
			if (duplicateCheck.ok) {
				const { exists } = await duplicateCheck.json()
				if (exists) {
					toast({
						title: 'Error',
						description: 'This teacher already has a schedule at this time',
						variant: 'destructive'
					})
					return
				}
			}
		} catch (error) {
			// Continue with creation if duplicate check fails
			console.warn('Could not check for duplicate schedules:', error)
		}

		setLoading(true)
		try {
			const response = await fetch('/api/schedules', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-telegram-init-data': webApp.initData
				},
				body: JSON.stringify({
					teacher_id: parseInt(scheduleForm.teacher_id),
					course_id: scheduleForm.course_id ? parseInt(scheduleForm.course_id) : null,
					section_id: scheduleForm.section_id ? parseInt(scheduleForm.section_id) : null,
					date: selectedDate.toISOString()
				})
			})

			const result = await response.json()

			if (response.ok) {
				const teacherName = teachers.find(t => t.id === parseInt(scheduleForm.teacher_id))?.name || 'Teacher'
				const courseName = scheduleForm.course_id ? courses.find(c => c.id === parseInt(scheduleForm.course_id))?.course_name : 'General'
				const sectionName = scheduleForm.section_id ? sections.find(s => s.id === parseInt(scheduleForm.section_id))?.section_name : 'Main'
				
				toast({
					title: 'Schedule Created',
					description: `${teacherName} assigned to ${courseName} in ${sectionName} on ${format(selectedDate, 'PPP')} at ${scheduleForm.time}`,
					duration: 5000
				})
				
				setScheduleForm({ teacher_id: '', course_id: '', section_id: '', date: undefined, time: '09:00' })
				setShowDatePicker(false)
				setMobilePickerOpen(false)
			} else {
				throw new Error(result.error || 'Failed to add schedule')
			}
		} catch (error) {
			console.error('Schedule submission error:', error)
			toast({
				title: 'Error',
				description: error instanceof Error ? error.message : 'Failed to add schedule',
				variant: 'destructive'
			})
		} finally {
			setLoading(false)
		}
	}

	if (loadingData) {
		return (
			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center justify-center">
						<Loader2 className="h-8 w-8 animate-spin text-blue-500" />
						<span className="ml-2">Loading data...</span>
					</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>New Schedule</CardTitle>
				<CardDescription>Assign a teacher to a course/section at a time</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleScheduleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label>Teacher</Label>
						<Select value={scheduleForm.teacher_id} onValueChange={(value) => setScheduleForm(prev => ({ ...prev, teacher_id: value }))}>
							<SelectTrigger>
								<SelectValue placeholder="Select a teacher" />
							</SelectTrigger>
							<SelectContent>
								{teachers.map((teacher) => (
									<SelectItem key={teacher.id} value={teacher.id.toString()}>
										{teacher.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>Course (Optional)</Label>
						<Select value={scheduleForm.course_id} onValueChange={(value) => setScheduleForm(prev => ({ ...prev, course_id: value }))}>
							<SelectTrigger>
								<SelectValue placeholder="Select a course" />
							</SelectTrigger>
							<SelectContent>
								{courses.map((course) => (
									<SelectItem key={course.id} value={course.id.toString()}>
										{course.course_name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>Section (Optional)</Label>
						<Select value={scheduleForm.section_id} onValueChange={(value) => setScheduleForm(prev => ({ ...prev, section_id: value }))}>
							<SelectTrigger>
								<SelectValue placeholder="Select a section" />
							</SelectTrigger>
							<SelectContent>
								{sections.map((section) => (
									<SelectItem key={section.id} value={section.id.toString()}>
										{section.section_name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{!isMobile ? (
						!showDatePicker ? (
							<div className="space-y-2">
								<Label>Schedule Date & Time</Label>
								<Button
									type="button"
									variant="outline"
									className="w-full justify-start text-left font-normal text-muted-foreground"
									onClick={() => setShowDatePicker(true)}
								>
									<CalendarIcon className="mr-2 h-4 w-4" />
									Add Date & Time
								</Button>
							</div>
						) : (
							<div className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label>Date</Label>
										<Popover>
											<PopoverTrigger asChild>
												<Button
													variant="outline"
													className={cn(
														"w-full justify-start text-left font-normal",
														!scheduleForm.date && "text-muted-foreground"
													)}
												>
													<CalendarIcon className="mr-2 h-4 w-4" />
													{scheduleForm.date ? format(scheduleForm.date, "PPP") : "Pick a date"}
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0" align="start">
												<Calendar
													mode="single"
													selected={scheduleForm.date}
													onSelect={(date) => setScheduleForm(prev => ({ ...prev, date }))}
													disabled={(date) => date < addDays(new Date(), -1)}
													initialFocus
												/>
											</PopoverContent>
										</Popover>
									</div>
									
									<div className="space-y-2">
										<Label htmlFor="schedule-time">Time</Label>
										<Input
											id="schedule-time"
											type="time"
											value={scheduleForm.time}
											onChange={(e) => setScheduleForm(prev => ({ ...prev, time: e.target.value }))}
											required
										/>
									</div>
								</div>
							</div>
						)
					) : (
						<div className="space-y-2">
							<Label>Schedule Date & Time</Label>
							<Button
								type="button"
								variant="outline"
								className="w-full justify-start text-left font-normal"
								onClick={() => setMobilePickerOpen(true)}
							>
								<CalendarIcon className="mr-2 h-4 w-4" />
								{scheduleForm.date ? `${format(scheduleForm.date, 'PPP')} at ${scheduleForm.time}` : 'Pick a date & time'}
							</Button>
							<Drawer open={mobilePickerOpen} onOpenChange={setMobilePickerOpen}>
								<DrawerContent>
									<DrawerHeader>
										<DrawerTitle>Pick date & time</DrawerTitle>
									</DrawerHeader>
									<div className="p-4 space-y-4">
										<Calendar
											mode="single"
											selected={scheduleForm.date}
											onSelect={(date) => setScheduleForm(prev => ({ ...prev, date }))}
											disabled={(date) => date < addDays(new Date(), -1)}
										/>
										<div className="space-y-2">
											<Label htmlFor="mobile-schedule-time">Time</Label>
											<Input
												id="mobile-schedule-time"
												type="time"
												value={scheduleForm.time}
												onChange={(e) => setScheduleForm(prev => ({ ...prev, time: e.target.value }))}
												required
											/>
										</div>
									</div>
									<DrawerFooter>
										<DrawerClose asChild>
											<Button className="w-full">Done</Button>
										</DrawerClose>
									</DrawerFooter>
								</DrawerContent>
							</Drawer>
						</div>
					)}

					<Button type="submit" disabled={loading} className="w-full">
						{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
						Add Schedule
					</Button>
				</form>
			</CardContent>
		</Card>
	)
}
