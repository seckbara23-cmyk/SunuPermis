# Appointment Architecture

SunuPermis has **two distinct booking systems** that serve different purposes. This document clarifies both, their lifecycles, and the long-term consolidation plan.

---

## System 1 — `appointments` (Government Approval Workflow)

### Purpose

Tracks a student's request for a government-administered driving exam appointment. The school submits the request on the student's behalf; a super_admin (government official) reviews and confirms a date.

### Actors

| Actor | Action |
|---|---|
| `school_admin` | Creates the appointment request |
| `super_admin` | Approves (sets date) or rejects |

### Lifecycle

```
[school_admin creates] → pending
    → [super_admin approves + sets date] → confirmed
    → [super_admin rejects + reason]     → rejected
    → [super_admin cancels]              → cancelled
```

### Key Fields

- `status`: `pending | confirmed | rejected | cancelled`
- `scheduled_at`: the confirmed exam date/time (set by super_admin)
- `rejection_reason`: free-text reason (set on rejection)
- `confirmed_by / confirmed_at`: who/when confirmed
- `approved_by / approved_at`: alias for confirmed (legacy naming)
- `rejected_by / rejected_at`: who/when rejected
- `requested_by`: profile ID of the school_admin who created it

### Eligibility Guard

A student must have `training_status = 'ready_for_exam'` to be booked. Only one active (`pending | confirmed`) appointment per student is allowed.

### Files

- `services/appointments.ts` — all mutations and queries
- `app/admin/appointments/` — super_admin review UI
- `app/dashboard/appointments/` — school_admin view

---

## System 2 — `exam_bookings` (Exam Session Slot Booking)

### Purpose

Manages slot reservations within a specific `exam_session` (a scheduled batch exam with a fixed capacity). Schools book seats for eligible students; the admin approves or rejects each booking.

### Actors

| Actor | Action |
|---|---|
| `school_admin` | Requests a booking for a student in a session |
| `super_admin` | Approves or rejects each booking |

### Lifecycle

```
[school_admin requests] → pending
    → [super_admin approves] → approved
    → [super_admin rejects]  → rejected
```

### Capacity Enforcement

Capacity is enforced at two layers:

1. **Application layer** (`booking-actions.ts`): counts active (`pending | approved`) bookings before inserting; returns a French error if full.
2. **Database layer** (migration `008_capacity_enforcement.sql`): a `BEFORE INSERT OR UPDATE` trigger on `exam_bookings` acquires a `FOR UPDATE` lock on the `exam_sessions` row to serialize concurrent requests and raises `CAPACITY_EXCEEDED` if slots are exhausted.

Only `pending` and `approved` bookings count toward capacity. `rejected` bookings free their slot.

### Files

- `app/dashboard/exams/booking-actions.ts` — school_admin booking request
- `app/admin/exam-bookings/actions.ts` — super_admin approve/reject
- `supabase/migrations/008_capacity_enforcement.sql` — DB trigger

---

## Naming Clarification

The two systems use similar but distinct terminology:

| Concept | `appointments` | `exam_bookings` |
|---|---|---|
| What is booked | A 1-on-1 government exam slot | A seat in a group exam session |
| Confirmed by | super_admin (picks a date) | super_admin (approves request) |
| Capacity model | No capacity limit | Fixed `available_slots` per session |
| Student eligibility | `ready_for_exam` | `ready_for_exam` |

---

## Future Consolidation

The dual-system approach reflects the current regulatory reality: schools separately request government appointments **and** book exam session seats. These may converge once the government integrates its scheduling directly into SunuPermis.

Consolidation candidates:
- Merge `appointments` into `exam_bookings` if the government adopts session-based scheduling.
- Alternatively, deprecate `exam_bookings` if the government provides direct slot allocation via the `appointments` flow.

Until then, keep both systems separate and clearly labeled in the UI.
