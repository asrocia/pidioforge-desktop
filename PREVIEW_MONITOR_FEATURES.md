# Preview & Monitor Features - Implementation Guide

## Overview
Komponen-komponen baru untuk meningkatkan kemampuan preview dan monitoring di PidioForge Desktop.

## 🎯 Komponen yang Diimplementasikan

### 1. **Performance Monitor** (`PerformanceMonitor.tsx`)

Komponen real-time monitoring untuk performa sistem dan rendering.

**Features:**
- **Real-time Metrics:** CPU, Memory, Active Renders, Queue Size
- **Historical Graphs:** 60-second rolling history untuk CPU dan Memory
- **Status Indicators:** Color-coded status (normal/warning/critical)
- **Auto-refresh:** Live updates setiap 1 detik
- **Expandable View:** Compact dan detailed view modes
- **Additional Metrics:** Encoding speed, Preview FPS

**Props:**
```typescript
{
  className?: string;
}
```

**Usage:**
```tsx
import { PerformanceMonitor } from '../ui/PerformanceMonitor';

<PerformanceMonitor className="mb-4" />
```

**API Integration:**
Memerlukan backend endpoint:
```javascript
GET /api/performance/status
Response: {
  metrics: {
    cpu: number,
    memory: number,
    activeRenders: number,
    queueSize: number,
    diskUsage?: number,
    networkUsage?: number,
    fps?: number,
    encodingSpeed?: string
  }
}
```

**Visual Features:**
- Mini graphs dengan SVG untuk CPU/Memory history
- Color-coded metric cards
- Live/Paused toggle
- Expandable details panel

---

### 2. **Render Progress Card** (`RenderProgressCard.tsx`)

Komponen untuk menampilkan progress rendering dengan detail lengkap.

**Features:**
- **Status Indicators:** Visual status untuk rendering/done/failed/cancelled
- **Progress Bar:** Real-time progress dengan percentage
- **Time Tracking:** Elapsed time, ETA, rendered duration
- **Speed Display:** Encoding speed (e.g., "2.5x")
- **Error Display:** Error messages untuk failed renders
- **Output Info:** File size dan output path
- **Quick Actions:** Cancel button, Open folder button

**Props:**
```typescript
{
  job: Job;
  onCancel?: (id: string) => void;
  onReveal?: (path: string) => void;
  className?: string;
}
```

**Usage:**
```tsx
import { RenderProgressCard, RenderProgressList } from '../ui/RenderProgressCard';

// Single card
<RenderProgressCard 
  job={currentJob}
  onCancel={handleCancel}
  onReveal={handleReveal}
/>

// List of jobs
<RenderProgressList
  jobs={allJobs}
  onCancel={handleCancel}
  onReveal={handleReveal}
/>
```

**Status Types:**
- `rendering` - Active render dengan progress bar
- `done` - Completed dengan output info
- `failed` - Error state dengan error message
- `cancelled` - User cancelled
- `standby` - Waiting in queue

---

### 3. **Timeline Viewer** (`TimelineViewer.tsx`)

Komponen timeline interaktif untuk preview dan navigasi video.

**Features:**
- **Interactive Seeking:** Click atau drag untuk seek ke posisi tertentu
- **Time Markers:** Visual markers untuk beats, lyrics, sections
- **Progress Indicator:** Current playback position
- **Hover Preview:** Hover untuk melihat timecode
- **Time Grid:** Grid lines untuk orientasi waktu
- **Marker Legend:** Legend untuk berbagai tipe markers
- **Timecode Display:** Current time, hover time, total duration

**Props:**
```typescript
{
  duration: number;
  currentTime?: number;
  markers?: TimelineMarker[];
  onSeek?: (time: number) => void;
  height?: number;
  showTimecode?: boolean;
  className?: string;
}

type TimelineMarker = {
  time: number;
  label: string;
  type: 'beat' | 'lyric' | 'section' | 'custom';
  color?: string;
};
```

**Usage:**
```tsx
import { TimelineViewer, TimelineMarkerLegend } from '../ui/TimelineViewer';

const markers = [
  { time: 5.2, label: 'Intro', type: 'section' },
  { time: 15.8, label: 'Verse 1', type: 'lyric' },
  { time: 30.5, label: 'Chorus', type: 'section' },
  // ... beat markers from audio analysis
];

<TimelineViewer
  duration={180}
  currentTime={currentTime}
  markers={markers}
  onSeek={handleSeek}
  height={60}
  showTimecode={true}
/>

<TimelineMarkerLegend markers={markers} />
```

**Marker Types:**
- `beat` - Audio beat detection (blue)
- `lyric` - Lyric timing (yellow)
- `section` - Song sections (green)
- `custom` - Custom markers (gray)

---

## 🎨 Integration Examples

### Preview Panel Integration

```tsx
import { PerformanceMonitor } from '../ui/PerformanceMonitor';
import { RenderProgressList } from '../ui/RenderProgressCard';
import { TimelineViewer } from '../ui/TimelineViewer';

export function PreviewPane({ jobs, config }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [markers, setMarkers] = useState([]);

  // Load markers from audio analysis
  useEffect(() => {
    async function loadMarkers() {
      const analysis = await api('/api/audio/analyze', {
        method: 'POST',
        body: JSON.stringify({ file: config.input.audio })
      });
      
      const beatMarkers = analysis.beats.map((beat, i) => ({
        time: beat.time,
        label: `Beat ${i + 1}`,
        type: 'beat' as const
      }));
      
      setMarkers(beatMarkers);
    }
    loadMarkers();
  }, [config.input.audio]);

  return (
    <div className="space-y-4">
      {/* Performance Monitor */}
      <PerformanceMonitor />

      {/* Timeline */}
      <TimelineViewer
        duration={config.target.duration || 180}
        currentTime={currentTime}
        markers={markers}
        onSeek={setCurrentTime}
      />

      {/* Render Progress */}
      <RenderProgressList
        jobs={jobs}
        onCancel={handleCancel}
        onReveal={handleReveal}
      />
    </div>
  );
}
```

### Audio Panel Integration

```tsx
import { TimelineViewer } from '../ui/TimelineViewer';

export function AudioMixingPanel({ config, analysis }) {
  const markers = [
    ...analysis.beats.map(b => ({
      time: b.time,
      label: 'Beat',
      type: 'beat' as const
    })),
    // Add lyric markers if available
  ];

  return (
    <div>
      {/* ... other audio controls ... */}
      
      <TimelineViewer
        duration={analysis.info.duration}
        markers={markers}
        height={40}
      />
    </div>
  );
}
```

---

## 🔧 Backend Requirements

### Performance Monitoring Endpoint

```javascript
// backend/routes.mjs
if (req.method === 'GET' && url.pathname === '/api/performance/status') {
  const metrics = {
    cpu: await getCpuUsage(),
    memory: await getMemoryUsage(),
    activeRenders: processes.size,
    queueSize: state.jobs.filter(j => j.status === 'standby').length,
    encodingSpeed: getAverageEncodingSpeed(),
    fps: getPreviewFps()
  };
  return json(res, 200, { metrics });
}
```

### Helper Functions

```javascript
async function getCpuUsage() {
  // Platform-specific CPU usage
  if (process.platform === 'win32') {
    const result = await runCmd('wmic cpu get loadpercentage');
    return parseInt(result.match(/\d+/)?.[0] || '0');
  }
  // Linux/Mac implementation
  return 0;
}

async function getMemoryUsage() {
  const used = process.memoryUsage();
  const total = os.totalmem();
  return Math.round((used.heapUsed / total) * 100);
}
```

---

## 📊 Visual Design

### Color Scheme

**Status Colors:**
- Normal: `var(--accent-success)` - Green
- Warning: `var(--accent-warning)` - Yellow
- Critical: `var(--accent-danger)` - Red
- Primary: `var(--accent-primary)` - Blue

**Marker Colors:**
- Beats: `var(--accent-primary)` - Blue
- Lyrics: `var(--accent-warning)` - Yellow
- Sections: `var(--accent-success)` - Green
- Custom: `var(--text-muted)` - Gray

### Responsive Behavior

All components are fully responsive:
- Performance Monitor: Collapses to compact view on small screens
- Render Progress: Stacks vertically on mobile
- Timeline: Scales horizontally, maintains touch support

---

## 🎯 Use Cases

### 1. Real-time Monitoring
```tsx
// Monitor system performance during batch rendering
<PerformanceMonitor />
```

### 2. Render Queue Management
```tsx
// Track multiple renders with progress
<RenderProgressList
  jobs={queueJobs}
  onCancel={cancelJob}
  onReveal={openOutputFolder}
/>
```

### 3. Audio Synchronization
```tsx
// Visualize beat timing for spectrum sync
<TimelineViewer
  duration={audioLength}
  markers={beatMarkers}
  onSeek={previewAtTime}
/>
```

### 4. Lyric Timing
```tsx
// Edit lyric timing visually
<TimelineViewer
  duration={songLength}
  markers={lyricMarkers}
  onSeek={updateLyricTime}
/>
```

---

## 🚀 Future Enhancements

### Performance Monitor
- [ ] GPU usage tracking
- [ ] Disk I/O monitoring
- [ ] Network bandwidth tracking
- [ ] Temperature monitoring
- [ ] Export performance logs

### Render Progress
- [ ] Thumbnail preview during render
- [ ] Pause/Resume functionality
- [ ] Priority queue management
- [ ] Batch operations (cancel all, retry failed)
- [ ] Render history with statistics

### Timeline Viewer
- [ ] Zoom in/out functionality
- [ ] Multi-track timeline (video, audio, lyrics)
- [ ] Waveform overlay
- [ ] Keyframe markers
- [ ] Region selection for partial renders
- [ ] Snap-to-beat functionality

---

## 📝 Testing Checklist

- [x] TypeScript compilation passes
- [x] Components render without errors
- [x] Responsive design works on all screen sizes
- [ ] Performance monitoring updates in real-time
- [ ] Render progress updates correctly
- [ ] Timeline seeking works smoothly
- [ ] Marker tooltips display correctly
- [ ] Color coding is consistent
- [ ] Accessibility (keyboard navigation, screen readers)

---

## 🔗 Related Files

```
frontend/src/components/
├── ui/
│   ├── PerformanceMonitor.tsx      # System performance monitoring
│   ├── RenderProgressCard.tsx      # Render progress tracking
│   └── TimelineViewer.tsx          # Interactive timeline
└── panels/
    └── PreviewPane.tsx             # Main preview panel (integration point)
```

---

**Last Updated:** 2026-07-14  
**Version:** 1.0.0  
**Status:** Ready for Integration
