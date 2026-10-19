# CampusFlow — Faculty Productivity & Lesson Planning

CampusFlow is a specialized faculty lesson planning and academic productivity web application designed specifically for college lecturers and university professors.

**Plan smarter. Teach on track.**

---

## Technology Stack

- **Framework**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS (Lucide Icons, clean modern UI)
- **PDF Generation & Parsing**: jsPDF, html2canvas, PDF.js
- **Testing**: Vitest
- **Timezone**: Locked to `Asia/Kolkata` for college timetable accuracy
- **Persistence**: Supabase / Isolated Local Data Store with row-level account separation

---

## Quick Start (macOS / Linux)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
Copy `.env.example` to `.env` if connecting to a hosted Supabase project:
```bash
cp .env.example .env
```
*(By default, CampusFlow operates out-of-the-box with isolated persistent local storage).*

### 3. Run Development Server
```bash
npm run dev
```
Open your browser to `http://localhost:5173/`.

### 4. Build for Production
```bash
npm run build
```

---

## Testing

Run the automated Vitest test suite:

```bash
npm test
```

---

## Key Features

1. **Login-First Faculty Authentication**: Secure credentials entry or 1-click dev demo login (`prof.sharma@college.edu`).
2. **Fixed 8-Period Timetable**:
   - Predefined college timings: Period 1 (08:30–09:20), Period 2 (09:20–10:10), Morning Break (10:10–10:20), Period 3 (10:20–11:10), Period 4 (11:10–12:00), Lunch Break (12:00–12:40), Period 5 (12:40–13:30), Period 6 (13:30–14:20), Period 7 (14:20–15:05), Period 8 (15:05–15:50).
   - Weekday setup editor with class dropdowns and free period support.
   - Non-teaching break and lunch visual separators.
3. **Reactive Live Class Reminders**:
   - `Asia/Kolkata` timezone accuracy.
   - Shows active class with period # and room, free periods with next class countdown, break/lunch status, and holiday/weekend banners.
4. **Independent Class & Syllabus Tracking**:
   - Multi-class isolation (e.g. Physics for CSE-A vs. Physics for ECE-B).
   - Heuristic PDF syllabus parser extracting units and topics.
   - 1-click topic completion checkboxes updating syllabus completion percentage.
5. **Academic Calendar**:
   - Monday-first monthly calendar with leap year handling and 2026 official holiday schedule.
6. **PDF Lesson Plan Export**:
   - Formatted A4 PDF reports built using jsPDF.
