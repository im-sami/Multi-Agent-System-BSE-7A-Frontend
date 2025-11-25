# StudyTracker - Student Progress & Analytics Platform

A comprehensive student study tracking and analytics platform built with Next.js, TypeScript, Tailwind CSS, and Recharts. Features include session logging, progress dashboards, reminders, instructor analytics, and AI-powered insights.

## 🎯 Features

### Core Navigation
- **Persistent Sidebar**: Application-wide navigation with quick access to all features
- **Responsive Design**: Mobile-first, fully responsive UI (WCAG AA compliant)
- **Dual Dashboards**: Original agent-based dashboard + new student progress dashboard

### Main Dashboard (`/dashboard`)
- Original multi-agent system interface (unchanged)
- Agent discovery, chat, and history management

### Progress Dashboard (`/progress`)
- **Real-time Metrics**: Total study hours, weekly sessions, avg session duration, active reminders
- **Study Consistency Charts**: Line charts showing progress over time
- **Weekly Session Frequency**: Bar charts for daily session tracking
- **Course Distribution**: Pie charts showing time allocation across courses
- **Consistency Heatmap**: 28-day activity visualization

### Study Session Logging
- **Create/Edit/Delete Sessions**: Full CRUD interface for study sessions
- **Session Details**: Date, time, duration, course, and notes
- **Search & Filter**: Filter by course and search sessions
- **Calendar View**: Visual representation of study history

### Reminders & Notifications
- **Custom Reminders**: Set title, description, due date/time
- **Recurring Reminders**: Daily, weekly, or one-time options
- **Active/Inactive Management**: Toggle reminders on/off
- **Reminder History**: Track all past and upcoming reminders

### Instructor Analytics
- **Class-wide Statistics**: Total students, average study time, top performers
- **At-Risk Student Identification**: Automated detection of students with low activity
- **Class Consistency Trends**: Visual tracking of class-wide study patterns
- **Performance Distribution**: Student grouping by weekly study hours

### Personalized Insights
- **AI-Generated Feedback**: Smart analysis of study habits
- **Improvement Suggestions**: Actionable recommendations
- **Warnings & Alerts**: Proactive notifications about declining trends
- **Achievement Tracking**: Milestone celebrations

## 📁 Project Structure

```
app/
├── dashboard/page.tsx        # Original multi-agent dashboard (unchanged)
├── progress/page.tsx         # NEW: Student progress dashboard
├── sessions/page.tsx         # Study session logging
├── reminders/page.tsx        # Reminder management
├── analytics/page.tsx        # Instructor analytics
├── insights/page.tsx         # Personalized insights
├── settings/page.tsx         # User settings
├── layout.tsx                # Root layout with sidebar
└── providers.tsx             # Context providers

components/
├── app-sidebar.tsx           # Persistent navigation sidebar
├── metric-card.tsx           # Reusable metric display
├── charts/
│   ├── line-chart.tsx        # Line chart component
│   ├── bar-chart.tsx         # Bar chart component
│   ├── pie-chart.tsx         # Pie chart component
│   └── heatmap.tsx           # Activity heatmap
└── ui/                       # Shadcn UI components

context/
├── study-session-context.tsx # Study session state
├── reminder-context.tsx      # Reminder state
├── insights-context.tsx      # Insights state
├── agent-context.tsx         # Agent state (legacy)
├── history-context.tsx       # History state (legacy)
├── settings-context.tsx      # Settings state
└── user-context.tsx          # User authentication

lib/
├── api-service.ts            # Backend API wrapper
└── utils.ts                  # Utility functions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd Multi-Agent-System-BSE-7A-Frontend

# Install dependencies
pnpm install

# Set environment variables (optional)
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) - you'll see the main dashboard with the sidebar navigation.

### Build & Production

```bash
pnpm build
pnpm start
```

## 🧭 Navigation

The application uses a persistent sidebar with the following routes:

- **Main Dashboard** (`/dashboard`) - Original multi-agent system interface (agents, chat, history)
- **Progress Dashboard** (`/progress`) - **NEW:** Student progress overview with charts and metrics
- **Session Logging** (`/sessions`) - Create and manage study sessions
- **Reminders** (`/reminders`) - Set up and track reminders
- **Instructor Analytics** (`/analytics`) - Class-wide statistics (instructor view)
- **Insights** (`/insights`) - AI-generated personalized feedback
- **Settings** (`/settings`) - User preferences and account management

## 💾 Data Storage

All data is stored locally using browser `localStorage`:
- `study-sessions`: Study session records
- `reminders`: Reminder settings and history
- `insights`: AI-generated insights
- `app-settings`: User preferences

No backend required for core functionality (sessions, reminders, insights work offline).

## 🎨 Customization

### Theme
- Built with Tailwind CSS and Shadcn UI
- Supports dark/light mode (via `next-themes`)
- Customize colors in `globals.css`

### Charts
- Uses Recharts library
- All chart components are in `components/charts/`
- Easily customizable colors, axes, and tooltips

## 🧪 Testing

```bash
pnpm test
```

## 📊 Features Deep Dive

### Study Session Logging
- **CRUD Operations**: Full create, read, update, delete functionality
- **Data Fields**: Date, start time, duration (minutes), course name, notes
- **Filtering**: Search by course name, filter by course ID
- **Sorting**: Sessions sorted by date (newest first)

### Dashboard Metrics
- **Total Study Hours**: Sum of all session durations
- **Sessions This Week**: Count of sessions in last 7 days
- **Avg Session Duration**: Mean duration across all sessions
- **Active Reminders**: Count of enabled reminders

### Instructor Analytics
- **Mock Data**: Currently uses sample data (replace with real API)
- **At-Risk Detection**: Identifies students with <5 hours/week
- **Anonymized View**: Student identifiers are masked
- **Trend Analysis**: Weekly averages and participation rates

### Insights System
- **Types**: Feedback, Suggestion, Warning, Achievement
- **Priorities**: High, Medium, Low
- **Dismissible**: Users can dismiss insights
- **Persistent**: Stored in localStorage

## 🔧 Configuration

### Environment Variables
- `NEXT_PUBLIC_API_URL`: Backend API URL (optional, defaults to mock data)

### User Settings
Accessible via `/settings`:
- Push notifications toggle
- Email reminders
- Weekly progress reports
- Default session duration
- Auto-log sessions

## 🌐 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## License

MIT

## Docker (quick run instructions)

If you used the `docker-compose.yml` and populated the Docker volumes once, you do NOT need to repeat the full install+build every time.

- First time (populate volumes: installs deps and builds into Docker volumes):

```cmd
cd /d "D:\University\Semester 7\SPM\SPM_Project\Multi-Agent-System-BSE-7A-Frontend"
docker compose run --rm builder
```

- Start the web service (no rebuild needed unless you changed the Dockerfile, dependencies or want a fresh build):

```cmd
docker compose up web
```

- If you changed dependencies or want to rebuild the production artifacts, re-run the builder and then start web:

```cmd
docker compose run --rm builder && docker compose up --build web
```

- Quick cleanup (remove the named volumes and force a fresh populate):

```cmd
docker compose down
docker volume rm mas-node-modules mas-next
docker compose run --rm builder
docker compose up web
```

Notes:
- For local code edits you generally only need to run `docker compose up web` after the builder step — the source is bind-mounted so edits show immediately.
- Only re-run the builder when you change dependencies or need a new production build (`.next`).
- If you prefer development hot-reload, run the `dev` container (or `pnpm dev` on host). See `DOCKER.md` for more variants and `docker run` examples.
