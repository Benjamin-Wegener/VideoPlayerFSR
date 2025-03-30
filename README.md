# FSR Enhanced Video Player

A WebGL implementation of AMD's FidelityFX Super Resolution (FSR) technology for video upscaling in the browser.

## Overview

This application lets you play local video files with real-time FSR upscaling applied through WebGL shaders. FSR improves the visual quality of videos by intelligently upscaling lower resolution content to your display resolution, preserving details and enhancing edges.

## Features

- Upload and play local video files (supports multiple formats)
- Toggle FSR enhancement on/off with visual indicator
- Video player controls (play/pause, seekbar)
- Multiple video playlist support with prev/next navigation
- Fullscreen mode
- Automatic UI fadeout when not in use

## Technical Implementation

The player uses:
- WebGL for GPU-accelerated rendering and FSR processing
- Custom shader implementation of AMD's FSR v1.0.2 algorithm
- Custom WebGL utilities for shader management
- Efficient texture handling for video frames

## FSR Parameters

The shader implementation includes configurable parameters:
- `SHARPENING` (default: 2.0) - Controls sharpening intensity
- `CONTRAST` (default: 2.0) - Adjusts how the shader handles high contrast areas
- `PERFORMANCE` (0 or 1) - Toggle between quality (0) and performance (1) modes

## Browser Compatibility

- Chrome/Edge/Firefox for general video playback
- Edge and Safari have additional support for x265 video codecs

## Usage

1. Open the application in your browser
2. Click the eject button (⏏) to select video file(s)
3. Use the controls to play/pause and navigate videos
4. Toggle FSR enhancement with the sparkle button (✨)
5. Click the fullscreen button (⦶) for a better viewing experience

## Credits

- FidelityFX FSR v1.0.2 by AMD
- WebGL port based on:
  - Initial mpv port by agyild - https://gist.github.com/agyild/82219c545228d70c5604f865ce0b0ce5
  - ShaderToy implementation by goingdigital - https://www.shadertoy.com/view/stXSWB
  - HTML5 video adaptation by @BenjaminWegener

## License

MIT License - See license text in shader.js for details.
