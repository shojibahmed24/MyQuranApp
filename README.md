# Echoes: Voice Confessions App

A production-ready mobile-first application for anonymous voice confessions with a dedicated moderation dashboard.

## Structure
- `app/`: Mobile-first React application for users to record and listen to confessions.
- `admin/`: Moderation dashboard for managing flagged content.
- `database.sql`: Supabase/PostgreSQL schema and RLS policies.

## Tech Stack
- **Frontend**: React, Tailwind CSS, Lucide Icons.
- **Audio**: WaveSurfer.js for visualization, MediaRecorder API.
- **Backend**: Supabase (Auth, Database, Storage).