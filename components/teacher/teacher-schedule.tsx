"use client"
import { BookOpen, Clock, MapPin, Calendar, Download, CheckCircle, FileText } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

export function LessonDetails() {
  const { toast } = useToast()
  const [lessons, setLessons] = useState([])
  const [verseTexts, setVerseTexts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString()
  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const fetchLessonDetails = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/schedules')
      const data = await response.json()
      console.log('API Response:', data) // Debug: Log full response
      if (response.ok) {
        setLessons(data.schedules || [])
      } else {
        setError(data.error || 'Failed to load lesson details')
      }
    } catch (error) {
      console.error('Error fetching lesson details:', error)
      setError('Failed to load lesson details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLessonDetails()
  }, [])

  useEffect(() => {
    if (lessons.length > 0) {
      const fetchVerses = async () => {
        const promises = lessons.map(async (lesson: any, index: number) => {
          if (lesson.verse && !verseTexts[index]) {
            try {
              const res = await fetch(`https://bible-api.com/${lesson.verse}?translation=niv`)
              if (!res.ok) throw new Error('Failed to fetch verse')
              const data = await res.json()
              setVerseTexts(prev => ({ ...prev, [index]: data.text.trim() }))
            } catch (err) {
              setVerseTexts(prev => ({ ...prev, [index]: lesson.verse }))
            }
          }
        })
        await Promise.all(promises)
      }
      fetchVerses()
    }
  }, [lessons])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin border-4 border-sky-600 border-t-transparent rounded-full"></div>
        </CardContent>
      </Card>
    )
  }

  if (error || lessons.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'No schedule details available'}</p>
            <Button onClick={fetchLessonDetails}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-12">
      {lessons.map((lesson: any, index: number) => (
        <div key={index} className="space-y-6">
          <Card className="bg-gradient-to-br from-sky-50 to-white">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <Badge className="mb-2 bg-sky-100 text-sky-700 hover:bg-sky-100">
                    {new Date(lesson.schedule_date) >= new Date() ? 'Upcoming Lesson' : 'Past Lesson'}
                  </Badge>
                  <CardTitle className="text-xl">{lesson.course.course_description || 'Untitled Lesson'}</CardTitle>
                  <CardDescription>{lesson.course.course_description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => toast({ title: "Success", description: "Lesson marked as prepared." })}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark Prepared
                  </Button>
                  <Button variant="outline" onClick={() => toast({ title: "Success", description: "Lesson downloaded." })}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-sky-600" />
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p className="text-sm text-muted-foreground">{formatDate(lesson.schedule_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-sky-600" />
                  <div>
                    <p className="text-sm font-medium">Time</p>
                    <p className="text-sm text-muted-foreground">{formatTime(lesson.schedule_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-sky-600" />
                  <div>
                    <p className="text-sm font-medium">Verse</p>
                    <p className="text-sm text-muted-foreground">{lesson.verse || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-sky-600" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{lesson.section || 'N/A'}</p>
                  </div>
                </div>
              </div>
              <p className="text-sm mb-4">{lesson.description || 'No description available'}</p>
            </CardContent>
          </Card>
          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Lesson Details</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Learning Objectives</CardTitle>
                  <CardDescription>What students should learn from this lesson</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {lesson.course.objectives.map((objective: any, objIndex: number) => (
                      <li key={objIndex} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <span>{objective.objective}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Bible Passage</CardTitle>
                  <CardDescription>{lesson.verse || 'N/A'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
                    <p className="italic">
                      "{verseTexts[index] || lesson.verse || 'No verse text available'}"
                    </p>
                    <p className="text-right text-sm text-muted-foreground mt-2">- {lesson.verse || 'N/A'} (NIV)</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Discussion Questions</h4>
                      <ul className="space-y-2 text-sm">
                        <li>1. What does it mean to "{(lesson.course.course_description || 'faith').toLowerCase()}"?</li>
                        <li>2. How can we {(lesson.course.course_description || 'faith').toLowerCase()} at school?</li>
                        <li>3. What are some "good deeds" we can do this week?</li>
                        <li>4. Why does God want us to do good things where others can see?</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Key Points</h4>
                      <ul className="space-y-2 text-sm">
                        <li>• Jesus calls us to {(lesson.course.course_description || 'faith').toLowerCase()} in a dark world</li>
                        <li>• Our actions can show God's love to others</li>
                        <li>• We don't hide our faith, but let others see it</li>
                        <li>• The purpose is to glorify God, not ourselves</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="materials" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Required Materials</CardTitle>
                  <CardDescription>Items needed for this lesson</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(lesson.materials || ['Bible', 'Notebook', 'Pens']).map((material: string, matIndex: number) => (
                      <li key={matIndex} className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-sky-500" />
                        <span>{material}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Craft Instructions</CardTitle>
                  <CardDescription>Paper Lantern - "{lesson.course.course_description || 'Faith'}"</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="rounded-lg border border-slate-200 overflow-hidden">
                      <div className="bg-slate-100 h-40 flex items-center justify-center">
                        <FileText className="h-12 w-12 text-slate-400" />
                      </div>
                      <div className="p-3">
                        <h4 className="font-medium">Craft Preview</h4>
                        <p className="text-sm text-muted-foreground">Paper lantern with verse</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Instructions</h4>
                      <ol className="space-y-2 text-sm list-decimal pl-4">
                        <li>Fold a piece of construction paper in half lengthwise.</li>
                        <li>Cut slits from the folded edge, stopping about 1 inch from the open edge.</li>
                        <li>Open the paper and form it into a cylinder, gluing or taping the ends together.</li>
                        <li>Attach a handle by gluing a strip of paper to opposite sides of the top opening.</li>
                        <li>Decorate the lantern with markers, writing the verse on one side.</li>
                        <li>Place a battery-operated tea light inside the lantern.</li>
                      </ol>
                    </div>
                    <Button variant="outline" className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Download Craft Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="schedule" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Lesson Schedule</CardTitle>
                  <CardDescription>Timing for each activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200" />
                    <div className="space-y-6 pl-10 relative">
                      {(lesson.schedule || [
                        { time: '9:00 AM', activity: 'Welcome and Opening Prayer' },
                        { time: '9:05 AM', activity: "Review Last Week's Lesson" },
                        { time: '9:10 AM', activity: 'Bible Story and Discussion' },
                        { time: '9:25 AM', activity: 'Memory Verse Activity' },
                        { time: '9:35 AM', activity: 'Craft: Paper Lanterns' },
                        { time: '9:55 AM', activity: 'Closing Prayer' }
                      ]).map((item: any, schIndex: number) => (
                        <div key={schIndex} className="relative">
                          <div className="absolute -left-10 mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-sky-700 ring-4 ring-white">
                            <Clock className="h-3 w-3" />
                          </div>
                          <div>
                            <h4 className="font-medium">{item.time}</h4>
                            <p className="text-sm text-muted-foreground">{item.activity}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Activity Details</CardTitle>
                  <CardDescription>Instructions for each part of the lesson</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Welcome and Opening Prayer (5 min)</h4>
                      <p className="text-sm">
                        Greet each student as they arrive. Begin with a short prayer asking God to help everyone learn and
                        understand today's lesson.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Review Last Week's Lesson (5 min)</h4>
                      <p className="text-sm">
                        Ask students what they remember from last week's lesson. Have them share one way they applied what
                        they learned during the week.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Bible Story and Discussion (15 min)</h4>
                      <p className="text-sm">
                        Read the Bible passage from {lesson.verse || 'Matthew 5:16'}. Explain
                        what it means to {(lesson.course.course_description || 'faith').toLowerCase()}. Use a flashlight in a darkened
                        room as a demonstration if possible. Lead the discussion using the questions provided.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Memory Verse Activity (10 min)</h4>
                      <p className="text-sm">
                        Practice the verse together several times. Then play a game where students take turns saying one
                        word of the verse at a time, going around in a circle.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Craft: Paper Lanterns (20 min)</h4>
                      <p className="text-sm">
                        Follow the craft instructions to help students create their paper lanterns. As they work, remind
                        them how their lanterns represent {(lesson.course.course_description || 'faith').toLowerCase()}.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Closing Prayer (5 min)</h4>
                      <p className="text-sm">
                        Gather students in a circle with their completed lanterns. Turn on the tea lights and dim the room
                        if possible. Close with a prayer asking God to help everyone {(lesson.course.course_description || 'faith').toLowerCase()} this week.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ))}
    </div>
  )
}
