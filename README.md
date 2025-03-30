# FSR Enhanced Video Player 🎬✨

<div align="center">
  
![FSR Enhanced Video Player](https://img.shields.io/badge/FSR-Enhanced_Video_Player-blue?style=for-the-badge)
![WebGL](https://img.shields.io/badge/WebGL-Powered-red?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

</div>

A high-quality web-based video player that implements AMD's FidelityFX Super Resolution (FSR) technology in WebGL to upscale and enhance video playback in real-time. This implementation allows you to view local video files with advanced upscaling and sharpening techniques previously only available in desktop applications.

## ✨ Features

- **Real-time FSR Upscaling**: Enhance video quality using AMD's FSR algorithms
- **Local Video Playback**: Play videos directly from your device with no uploading required
- **Playlist Support**: Load multiple videos and navigate between them
- **Aspect Ratio Preservation**: Videos display correctly regardless of dimensions
- **Dynamic Controls**: Intuitive UI that fades when not in use
- **Fullscreen Mode**: Immersive viewing experience
- **CMAA2-inspired Edge Detection**: Improved edge detection for better visual quality
- **Intuitive UI**: Media controls inspired by classic media players

## 🖥️ Demo

Try the online demo: [FSR Enhanced Video Player Demo](https://htmlpreview.github.io/?https://github.com/Benjamin-Wegener/VideoPlayerFSR/blob/master/index.html)



## 💻 Browser Support

| Browser | Video Support | Notes |
|---------|---------------|-------|
| Chrome  | ✅            | Full support for all features |
| Firefox | ✅            | Full support for all features |
| Edge    | ✅            | Includes H.265/HEVC support |
| Safari  | ✅            | Includes H.265/HEVC support |
| Opera   | ✅            | Based on Chromium, full support |

## 🚀 Getting Started

### Prerequisites

- A modern web browser
- Local video files to play

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/BenjaminWegener/AMD-fidelityFX-SuperResolution-webGL.git
   ```

2. Navigate to the project directory:
   ```bash
   cd AMD-fidelityFX-SuperResolution-webGL
   ```

3. Open `index.html` in your preferred browser or serve it with a local web server.

### Usage

1. Click the eject (⏏) button to select video file(s) from your device
2. Use the playback controls to play/pause and navigate between videos
3. Toggle the enhance button (✨) to enable/disable FSR enhancement
4. Use the fullscreen button for a more immersive experience

## ⚙️ Technology

- **WebGL**: Hardware-accelerated graphics rendering
- **AMD FSR 1.0.2**: High-quality upscaling algorithm
- **JavaScript**: Dynamic UI and playback control
- **HTML5 Video API**: For video playback capabilities
- **CMAA2-inspired Edge Detection**: For improved visual quality

## 🧩 How It Works

The player uses the following shader-based pipeline to enhance video:

1. **Edge Detection**: Identifies edges in the video frame
2. **Upscaling**: Uses FSR EASU (Edge-Adaptive Spatial Upsampling) to intelligently upscale content
3. **Sharpening**: Applies dynamic sharpening with configurable intensity
4. **Color Processing**: Maintains proper color space transformations

Controls allow you to toggle the enhancement effects to compare the original and enhanced video quality in real-time.

## 🛠️ Customization

You can adjust several parameters in the `shader.js` file:

```javascript
// Parameter tuning
#define SHARPENING 2.0    // Sharpening intensity (0.0 to 2.0 recommended)
#define CONTRAST 2.0      // High contrast adaptation range
#define EDGE_THRESHOLD 0.15 // Threshold for edge detection
#define EDGE_WEIGHT 1.2   // Weight applied to detected edges
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/BenjaminWegener/AMD-fidelityFX-SuperResolution-webGL/issues).

To contribute:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

```
MIT License

Copyright (c) 2023 Benjamin Wegener

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 👨‍💻 Author

**Benjamin Wegener**

- GitHub: [@BenjaminWegener](https://github.com/BenjaminWegener)

## 🙏 Acknowledgments

- AMD for the FidelityFX Super Resolution technology
- [agyild](https://gist.github.com/agyild) for the initial mpv port
- [goingdigital](https://www.shadertoy.com/view/stXSWB) for the WebGL port
- All contributors who have helped improve this project

---

<div align="center">
  
Made with ❤️ by Benjamin Wegener

</div>
