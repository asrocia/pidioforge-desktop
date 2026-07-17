# Real-Time Preview Implementation

## Overview

Successfully implemented real-time preview streaming for PidioForge Desktop, enabling fast preview generation with configurable quality settings.

## Backend Implementation

### New Module: `backend/preview-stream.mjs`

**Functions:**
- `generateLivePreview()` - Fast preview with lower quality for real-time playback
- `generateFullPreview()` - Full quality preview with all effects
- `cleanupPreviews()` - Automatic cleanup of old preview files

**Features:**
- Optimized FFmpeg encoding (ultrafast preset)
- Configurable resolution, FPS, and quality
- Progress tracking with callbacks
- Automatic file cleanup

### New API Endpoints

Added to `backend/routes.mjs`:

```javascript
POST /api/preview/live
POST /api/preview/full
POST /api/preview/cleanup
```

**Live Preview Parameters:**
- `startAt` - Start time in seconds
- `duration` - Preview duration (1-60s)
- `quality` - draft/medium/high
- `fps` - Frame rate (15/24/30/60)
- `width` x `height` - Resolution

**Response:**
```json
{
  "id": "live-xxx",
  "url": "/api/preview/file?path=...",
  "output": "C:/path/to/preview.mp4",
  "duration": 10,
  "startAt": 0,
  "resolution": "640x360",
  "fps": 15,
  "quality": "draft",
  "elapsed": 2500,
  "speed": "4.00x",
  "size": 1048576,
  "logs": ["..."],
  "progress": {
    "progress": 100,
    "currentTime": 10,
    "duration": 10,
    "elapsed": 2500
  }
}
```

## Frontend Implementation

### New Hook: `usePreviewStream.ts`

**Functions:**
- `generatePreview()` - Generate preview with options
- `cancelPreview()` - Cancel ongoing generation
- `cleanupPreviews()` - Cleanup old previews
- `usePreviewPolling()` - Poll for preview availability

**Usage:**
```typescript
const {
  isGenerating,
  progress,
  result,
  error,
  generatePreview,
  cancelPreview
} = usePreviewStream();

await generatePreview(config, {
  startAt: 0,
  duration: 10,
  quality: 'draft',
  fps: 15,
  width: 640,
  height: 360,
  mode: 'live'
});
```

### New Component: `RealTimePreview.tsx`

**Features:**
- Video player with playback controls
- Real-time generation progress
- Configurable preview settings
- Quality/resolution/FPS selection
- Fullscreen support
- Download preview
- Cancel generation

**Settings Panel:**
- Start time (0-180s)
- Duration (1-60s)
- Quality (draft/medium/high)
- Mode (live/full)
- FPS (15/24/30/60)
- Resolution presets

### Integration: `PreviewPane.tsx`

Added new "Real-Time" tab to preview panel with full RealTimePreview component integration.

## Performance Characteristics

### Live Mode (Fast)
- **Speed:** 2-5x realtime
- **Quality:** Draft (CRF 28)
- **Use Case:** Quick previews, position testing
- **Resolution:** 640x360 @ 15fps (default)

### Full Mode (Accurate)
- **Speed:** 0.5-1.5x realtime
- **Quality:** Full pipeline with all effects
- **Use Case:** Final preview before render
- **Resolution:** Project resolution @ project fps

## Optimization Tips

1. **Fastest Preview:**
   - Mode: Live
   - Resolution: 480x270
   - FPS: 15
   - Quality: Draft
   - Expected: 4-6x realtime

2. **Balanced Preview:**
   - Mode: Live
   - Resolution: 640x360
   - FPS: 24
   - Quality: Medium
   - Expected: 2-3x realtime

3. **Accurate Preview:**
   - Mode: Full
   - Resolution: Project resolution
   - FPS: Project fps
   - Quality: High
   - Expected: 0.8-1.2x realtime

## File Management

**Preview Storage:**
- Location: `workspace/previews/live/` and `workspace/previews/full/`
- Naming: `live-{id}.mp4` or `preview-{id}.mp4`
- Auto-cleanup: Files older than 1 hour

**Cleanup:**
```javascript
await cleanupPreviews(3600000); // 1 hour
```

## Error Handling

**Common Errors:**
- Missing input files
- Invalid configuration
- FFmpeg encoding errors
- Disk space issues

**Error Display:**
- Real-time error messages in UI
- Detailed logs in preview panel
- Cancellation support

## Usage Examples

### Quick Position Test
```typescript
// Fast 5-second preview at intro
await generatePreview(config, {
  startAt: 0,
  duration: 5,
  quality: 'draft',
  fps: 15,
  width: 480,
  height: 270,
  mode: 'live'
});
```

### Full Quality Check
```typescript
// Full pipeline preview
await generatePreview(config, {
  startAt: 30,
  duration: 10,
  quality: 'high',
  mode: 'full'
});
```

### Multiple Sections
```typescript
// Check intro, middle, outro
for (const time of [0, 60, 120]) {
  await generatePreview(config, {
    startAt: time,
    duration: 5,
    mode: 'live'
  });
}
```

## Integration Status

✅ Backend streaming engine
✅ API endpoints
✅ Frontend hook
✅ UI component
✅ Preview panel integration
✅ Progress tracking
✅ Error handling
✅ File cleanup
✅ Documentation

## Next Steps (Optional Enhancements)

1. **WebSocket Streaming** - Real-time frame streaming
2. **Thumbnail Generation** - Quick frame previews
3. **Comparison View** - Side-by-side preview comparison
4. **Preset Management** - Save/load preview presets
5. **Batch Preview** - Generate multiple previews at once

## Technical Notes

- Uses FFmpeg `-preset ultrafast` for speed
- Implements `-movflags +faststart` for streaming
- Progress parsing from FFmpeg stderr
- Abort controller for cancellation
- Automatic cleanup on unmount
- Browser-compatible types (no NodeJS dependencies)

## Conclusion

Real-time preview feature is **fully implemented** and ready for use. Users can now generate fast previews with configurable settings, enabling rapid iteration on video projects.
