# SunuPermis — System Design

## 1. Product Overview

SunuPermis is a centralized government platform for the driving license ecosystem in Senegal.

It connects three parties: the government (which owns the platform), driving schools (auto-écoles) that prepare candidates, and students who are preparing for their license.

The platform handles:
- Registration and approval of auto-écoles by the government
- Student registration and training management by approved auto-écoles
- Written test appointment booking, managed through the platform
- Theory preparation and mock exams for students
- Government-level monitoring of the ecosystem

SunuPermis is not just a tool for driving schools. It is the official digital layer through which auto-écoles operate, students are tracked, and appointments are managed.

---

## 2. User Roles and Permissions

### 2.1 Government Admin

The platform owner. Represents the government authority responsible for driving licenses.

Can:
- Approve or reject auto-école registration requests
- Deactivate approved auto-écoles
- Manage exam content (questions, categories)
- Create exam session slots (date, location, capacity)
- View all appointment requests from all auto-écoles
- Confirm an appointment request (assigns session and scheduled date/time)
- Edit an appointment (change session, date, or time after confirming)
- Reject an appointment request with a written reason
- Cancel a confirmed appointment
- View platform-wide statistics and reports
- Manage government admin accounts

Cannot:
- Register students directly (done by auto-écoles)
- Assign instructors (done by auto-école admin)

---

### 2.2 Auto-École Admin

The administrator of one approved driving school.

Can:
- Register and manage students enrolled in their school
- Manage instructors attached to their school
- Schedule driving lessons for students
- Submit written test appointment requests for eligible students
- Track appointment request status (pending / confirmed / rejected)
- Track student training progress and payments
- View their school's dashboard

Cannot:
- Access data from other auto-écoles
- Approve their own registration
- Confirm their own appointment requests (government only)
- Create exam session slots (government only)

---

### 2.3 Student / Candidate

A person enrolled in a driving school.

Can:
- View their training progress
- See their scheduled driving lessons
- View their appointment and its current status (pending, confirmed, or rejected)
- See full appointment details only when status is confirmed
- Take mock theory exams
- View their mock exam history and scores
- View their payment status

Cannot:
- Request their own appointment (done by auto-école admin)
- Modify their own training status

---

### 2.4 Instructor

A driving instructor attached to one auto-école.

Can:
- View their scheduled lessons
- Add notes to completed lessons
- View their assigned students

Cannot:
- Register students
- Book appointments
- Access financial data

---

## 3. Core Workflows

### 3.1 Auto-École Registration and Approval

```
Auto-école submits registration request
    ↓
Government Admin reviews request
    ↓
Approved → auto-école gets access, can register students
Rejected → auto-école receives rejection reason, can reapply
```

An auto-école cannot register students or book appointments until approved.

---

### 3.2 Student Registration and Training

```
Auto-école Admin registers student
    ↓
Student receives login credentials
    ↓
Student starts theory preparation (mock exams)
    ↓
Auto-école Admin schedules practical lessons
    ↓
Student completes required lessons
    ↓
Auto-école Admin marks student as ready for exam
    ↓
Auto-école Admin books written test appointment
```

---

### 3.3 Written Test Appointment Workflow

```
Auto-École Admin submits appointment request for a student
    ↓ status: pending
Government Admin reviews the request
    ↓
    ├── Confirm → assigns session and scheduled_at → status: confirmed
    │       ↓
    │   Government Admin can still edit (session / date / time)
    │       ↓
    │   Student sees confirmed appointment with full details
    │
    ├── Reject → writes rejection_reason → status: rejected
    │       ↓
    │   Auto-école sees rejection reason, can submit a new request
    │
    └── Cancel (after confirming) → status: cancelled
            ↓
        Auto-école and student see appointment as cancelled
```

Rules:
- Only students with `training_status = ready_for_exam` can have an appointment requested.
- A student can only have one active appointment (pending or confirmed) at a time.
- The auto-école cannot modify or confirm their own request once submitted.
- If rejected or cancelled, the auto-école may submit a new request.

---

### 3.4 Student Mock Exam Flow

```
Student logs in
    ↓
Student starts a mock exam (random questions drawn from question bank)
    ↓
Student answers all questions
    ↓
System grades the exam server-side
    ↓
Student sees score, pass/fail, and incorrect answers
    ↓
Student can retake as many times as needed
```

---

## 4. MVP Features

### Priority 1 — Foundation

- Email/password authentication
- Role-based access control (government_admin, school_admin, instructor, student)
- Protected dashboards per role

---

### Priority 2 — Auto-École Management

Government Admin:
- Create auto-école accounts (or review self-submitted requests)
- Approve / reject / deactivate auto-écoles
- View all auto-écoles and their status

Auto-École fields:
- Name
- Address
- Phone
- Email
- Approval status: `pending` / `approved` / `rejected`
- Rejection reason (optional)
- Approved at (timestamp)

---

### Priority 3 — Student and Instructor Management

Auto-École Admin:
- Register students (name, phone, email, date of birth, license category)
- Manage instructors (name, phone, email, status)
- Update student training status
- Track payment status per student

---

### Priority 4 — Lesson Scheduling

Auto-École Admin:
- Schedule driving lessons (student, instructor, date, start/end time)
- Update lesson status (scheduled, completed, cancelled, missed)

Instructor:
- View their lessons
- Add notes to completed lessons

---

### Priority 5 — Mock Exam System

Students can take mock theory exams:
- 10 random questions per session drawn from the question bank
- Multiple choice format
- Graded server-side (correct answers never sent to client)
- Score, pass/fail, and per-question feedback shown after submission
- Full history of past attempts

Government Admin manages the question bank:
- Question text, options, correct answer, explanation, category, difficulty

---

### Priority 6 — Appointment Request and Approval

**Auto-École Admin:**
- Submit an appointment request for a student whose `training_status` is `ready_for_exam`
- View all appointment requests for their school with current status
- See rejection reason if request was rejected
- Submit a new request if the previous one was rejected or cancelled

**Government Admin:**
- View all pending appointment requests across all schools
- Confirm a request: assign it to an exam session and set the scheduled date/time
- Edit a confirmed appointment (change session, date, or time)
- Reject a request with a written reason
- Cancel a confirmed appointment

**Student:**
- See their appointment and its status at all times
- View full date, time, and location details only when status is `confirmed`

---

### Priority 7 — Dashboards

Government Admin Dashboard:
- Total auto-écoles (pending / approved / rejected)
- Total students registered across all schools
- Upcoming appointments
- Appointment completion rate

Auto-École Dashboard:
- Total students and breakdown by training status
- Students ready for exam
- Upcoming lessons
- Payment summary

Student Dashboard:
- Training status
- Next lesson
- Next appointment (if booked)
- Last mock exam score
- Payment status

---

### Priority 8 — Payment Tracking

Manual payment recording by auto-école admin:
- Amount, method (cash / Wave / Orange Money / bank transfer), date, status
- Status: pending / partial / paid / overdue

Online payment integration is out of scope for MVP.

---

## 5. Database Model

### Current Tables (already implemented)

| Table | Purpose |
|---|---|
| `profiles` | User accounts with role and school link |
| `driving_schools` | Auto-école records |
| `students` | Student profiles |
| `instructors` | Instructor profiles |
| `lessons` | Driving lesson bookings |
| `exam_questions` | Theory question bank |
| `mock_exams` | Mock exam attempts |
| `mock_exam_answers` | Per-question answers for each attempt |
| `payments` | Manual payment records |

---

### Changes Needed to Existing Tables

#### `profiles` — rename role enum value

```sql
-- Rename super_admin to government_admin
ALTER TYPE user_role RENAME VALUE 'super_admin' TO 'government_admin';
```

> All application code using `'super_admin'` must be updated to `'government_admin'`.

#### `driving_schools` — add approval fields

```sql
ALTER TABLE public.driving_schools
  ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN rejection_reason TEXT,
  ADD COLUMN approved_at TIMESTAMPTZ,
  ADD COLUMN approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
```

#### `instructors` — add status column

```sql
ALTER TABLE public.instructors
  ADD COLUMN status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive'));
```

---

### New Tables Needed

#### `exam_sessions`

Government-created slots for written tests.

```sql
CREATE TABLE public.exam_sessions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  location     TEXT        NOT NULL,
  session_date DATE        NOT NULL,
  start_time   TIME        NOT NULL,
  capacity     INTEGER     NOT NULL CHECK (capacity > 0),
  notes        TEXT,
  created_by   UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `appointments`

Written test appointment requests, managed through a government approval workflow.

```sql
CREATE TABLE public.appointments (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  driving_school_id UUID        NOT NULL REFERENCES public.driving_schools(id) ON DELETE CASCADE,
  requested_by      UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Assigned by government admin when confirming; null while pending
  exam_session_id   UUID        REFERENCES public.exam_sessions(id) ON DELETE SET NULL,
  scheduled_at      TIMESTAMPTZ,

  status            TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled')),

  rejection_reason  TEXT,
  confirmed_by      UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  confirmed_at      TIMESTAMPTZ,

  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Notes:
- `exam_session_id` and `scheduled_at` are null until the government confirms the request.
- `rejection_reason` is required when status is set to `rejected` (enforced at application level).
- A student should not have more than one active appointment (pending or confirmed) at a time — enforce this at application level in the server action.
- Use a DB trigger or application logic to keep `updated_at` current.

---

## 6. Access Control Rules

| Resource | government_admin | school_admin | instructor | student |
|---|---|---|---|---|
| All driving schools | read/write | own only (read) | none | none |
| Approve/reject schools | yes | no | no | no |
| Students | all | own school | assigned | own profile |
| Instructors | all | own school | own profile | none |
| Lessons | all | own school | own lessons | own lessons |
| Mock exams | manage questions | view results | none | own |
| Exam sessions | create/manage | view available | none | none |
| Appointment requests | view all, confirm, edit, reject, cancel | request + view own school's | none | view own |
| Payments | all | own school | none | own |

Key appointment rules enforced at application and RLS level:
- Auto-école can **create** and **read** appointments for their school only.
- Auto-école **cannot update** status — only government admin can.
- Government admin can update any appointment.
- Student can read their own appointment; status `confirmed` unlocks full details.

---

## 7. Build Priority

Build in this order. Each step should be fully working before moving to the next.

```
Step 1   Authentication + roles

Step 2   Auto-École Approval Workflow
         - Government admin views pending auto-école registrations
         - Government admin approves or rejects with reason
         - Approved auto-écoles unlock access to all school features

Step 3   Auto-École admin: student management
Step 4   Auto-École admin: instructor management
Step 5   Auto-École admin: lesson scheduling

Step 6   Appointment Request System
         - Auto-école submits appointment request for a student
         - Request stored with status: pending
         - Auto-école can view all requests and their statuses

Step 7   Government Appointment Approval Dashboard
         - Government admin views all pending requests
         - Government admin confirms (assigns session + scheduled_at)
         - Government admin rejects (writes rejection reason)
         - Government admin can edit or cancel confirmed appointments

Step 8   Student Appointment View
         - Student sees their appointment and status
         - Full details (date, time, location) shown only when confirmed

Step 9   Student: mock exam system and study module

Step 10  Dashboards (government + school + student)
Step 11  Payment tracking
```

---

## 8. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Auth | Supabase Auth with `@supabase/ssr` (cookie-based sessions) |
| Deployment | Vercel (frontend) + Supabase (backend) |

---

## 9. Design Principles

- French-first UI
- Mobile-friendly layout
- Role-based views — each user sees only what they need
- No feature flags or admin toggles in MVP
- Server Components for data, Client Components for interactivity
- Server Actions for all mutations
- RLS as the security layer — never rely on UI alone

---

## 10. Out of Scope for MVP

- Online payment processing
- SMS or WhatsApp notifications
- Practical exam booking (written test only for now)
- Points-based license system
- Video lessons
- Mobile app
- Government API integration (ANASER or similar)
- Digital certificate generation
