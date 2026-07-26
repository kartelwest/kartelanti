# Scheduling Engine

`src/services/scheduler/engine.ts`

The scheduler is deterministic and pure. It accepts a `ScheduleRequest` and returns `ScheduleResult`.

## Process

1. Normalize dates and durations.
2. Place fixed events as locked blocks.
3. Generate free intervals with required breaks.
4. Score flexible tasks by deadline, priority, energy match, preferred time, dependencies, and non-negotiable status.
5. Place non-splittable tasks first, then splittable tasks in chunks respecting minimum chunk size.
6. Detect tasks that cannot fit.
7. Generate human-readable explanations.
8. Calculate daily confidence.

## Scoring factors

- Deadline urgency
- Priority
- Energy match
- Preferred time of day
- Context continuity (reserved for future refinement)
- Dependency readiness
- Non-negotiable boost

## Scoring weights

Weights are currently inline constants. Future versions can move them to a configuration module.

## Recovery Mode

When `recoveryMode: true` is set, the scheduler skips past days, preserves completed and fixed blocks, and reschedules only unfinished flexible work.

## Explanations

Each scheduled block includes an `explanation` string derived from the actual decision (energy match, deadline, context, or fallback).

## Confidence

Confidence is calculated from:

- Number of unscheduled tasks
- Warnings
- Utilization ratio
- Tight transitions
- Deadline risk

## Tests

See `src/services/scheduler/engine.test.ts`.
