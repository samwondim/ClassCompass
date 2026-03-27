# Notification System Implementation Summary

## Overview
A complete notification system has been implemented for the Sunday School Management Telegram Mini App, featuring both Telegram bot notifications and in-app notification viewing.

## Features Implemented

### 1. Database Schema
- **New Model**: `Notification` table added to Prisma schema
  - Fields: id, user_id, title, message, type, is_read, created_at, link
  - Relation to User model
  - Supports notification types: info, warning, success, error

### 2. Notification Triggers

#### Schedule Change Notifications → Teachers
Triggers when Admin/Manager:
- **Adds** a new schedule
- **Updates** an existing schedule  
- **Deletes** a schedule

**Implementation**: 
- `app/api/schedules/route.ts` (POST)
- `app/api/schedules/[id]/route.ts` (PUT, DELETE)

**Notification includes**:
- Course name
- Schedule date and time
- Section name
- Who made the change
- Link to teacher's schedule page

#### Section Change Notifications → Managers
*(Ready for implementation when section update endpoints are created)*

**Function signature**:
```typescript
notifySectionChange(
  managerUserId: string,
  managerTgId: string,
  sectionName: string,
  changerName: string,
  changeDetails: string
)
```

#### Teacher Unavailability Notifications → Admin + Manager
*(Ready for implementation when unavailability submission is created)*

**Function signature**:
```typescript
notifyUnavailability(
  recipients: Array<{ userId: string; tgId: string }>,
  teacherName: string,
  reason: string,
  affectedClass: string,
  date: string
)
```

### 3. Notification Delivery

#### Telegram Bot Notifications
- Sent via Grammy bot to user's Telegram account
- Uses MarkdownV2 formatting
- Includes deep links back to mini app
- Handles errors gracefully

#### In-App Notifications
- Stored in database for persistent viewing
- Accessible via notification bell icon in app header
- Shows unread count badge
- Supports mark as read and delete actions

### 4. API Endpoints

**GET /api/notifications**
- Fetches user's notifications (last 50)
- Ordered by creation date (newest first)
- Requires authentication

**PATCH /api/notifications**
- Mark notification(s) as read
- Body: `{ notificationIds: string[] }`

**DELETE /api/notifications**
- Delete notification(s)
- Body: `{ notificationIds: string[] }`

### 5. UI Components

#### Notification Bell (App Layout)
- Located in top-right header
- Shows unread count badge
- Links to notifications page
- Dynamically fetches count on mount

#### Notifications Page
Created for all three roles:
- `/am/admin/notifications`
- `/am/manager/notifications`
- `/am/teacher/notifications`

**Features**:
- List view with color-coded notification types
- Unread notifications highlighted
- Mark individual or all as read
- Delete notifications
- Click through links to related pages
- Responsive design

### 6. Utility Functions

**File**: `utils/notifications.ts`

**Core Functions**:
- `sendTelegramNotification()` - Send Telegram message
- `notifyScheduleChange()` - Schedule notifications
- `notifySectionChange()` - Section notifications  
- `notifyUnavailability()` - Unavailability notifications
- `saveNotification()` - Persist to database

## Database Migration Required

To use the notification system, run:
```bash
npx prisma migrate dev --name add_notifications
```

This will create the `Notification` table in the database.

## Usage Examples

### Schedule Change Notification
```typescript
// In schedule API route
const { notifyScheduleChange } = await import('@/utils/notifications');
await notifyScheduleChange(
  teacherUserId,
  teacherTgId,
  'Added',
  courseName,
  changerName,
  `Date: ${scheduleDate}\nSection: ${sectionName}`
);
```

### Section Change Notification (when implemented)
```typescript
const { notifySectionChange } = await import('@/utils/notifications');
await notifySectionChange(
  managerUserId,
  managerTgId,
  sectionName,
  changerName,
  'Manager reassigned to new section'
);
```

## Environment Variables Required
- `BOT_TOKEN` - Telegram bot token
- `NEXT_PUBLIC_BASE_URL` - Mini app URL for deep links (e.g., your deployed app URL)

## Files Modified/Created

### Created:
- `utils/notifications.ts`
- `app/api/notifications/route.ts`
- `app/[locale]/(protected)/admin/notifications/page.tsx`
- `app/[locale]/(protected)/manager/notifications/page.tsx`
- `app/[locale]/(protected)/teacher/notifications/page.tsx`

### Modified:
- `prisma/schema.prisma` - Added Notification model
- `app/api/schedules/route.ts` - Added notification on create
- `app/api/schedules/[id]/route.ts` - Added notifications on update/delete
- `components/app-layout.tsx` - Added notification bell with unread count

## Next Steps

1. **Run Database Migration**: Execute the Prisma migration to create the Notification table
2. **Implement Section Notifications**: Add notification calls when sections are updated
3. **Implement Unavailability System**: Create teacher unavailability submission with notifications
4. **Test Notifications**: Verify Telegram messages are sent correctly
5. **Add Translations**: Translate notification UI text to Amharic

## Branch
All changes are committed to: `feature/course-management-enhancements`
