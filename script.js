document.addEventListener('DOMContentLoaded', function() {
  if (typeof frag === 'undefined' || typeof vert === 'undefined') {
    console.error('Shader variables not found! Make sure shader.js is loaded before script.js');
    document.querySelector('#message').innerHTML = 'Error: Shader not loaded correctly';
    document.querySelector('#message').style.display = 'block';
    return;
  }

  const HUD = document.querySelectorAll('.hud');
  var fade = " ";
  var ENHANCE = true;
  var PLAY = true;
  const video = document.querySelector('video');
  let enhanceButton = document.getElementById("enhance");
  // Initialize the enhance button as active with glow effect
  enhanceButton.classList.add("active");
  enhanceButton.addEventListener('click', () => {
      ENHANCE = !ENHANCE;
      if (ENHANCE) {
          enhanceButton.classList.add("active");
      } else {
          enhanceButton.classList.remove("active");
      }
  });
  let playButton = document.getElementById("play");
  const playIcon = playButton.querySelector('.play-icon');
  const pauseIcon = playButton.querySelector('.pause-icon');
  
  // Set initial state of play/pause button
  updatePlayPauseButton();
  
  playButton.addEventListener('click', () => {
      PLAY = !PLAY;
      if (PLAY) {
          video.play();
      } else {
          video.pause();
      }
      updatePlayPauseButton();
  });
  
  // Function to update play/pause button appearance
  function updatePlayPauseButton() {
      if (PLAY) {
          playIcon.style.display = 'none';
          pauseIcon.style.display = 'block';
      } else {
          playIcon.style.display = 'block';
          pauseIcon.style.display = 'none';
      }
  }

  let videoFiles = [];
  let currentVideoIndex = 0;
  let currentVideoElement = document.getElementById("current-video");
  let fileInfoElement = document.getElementById("file-info");

  let nextButton = document.getElementById("next");
  if (nextButton) {
    nextButton.addEventListener('click', () => {
        if (videoFiles.length > 1) {
            currentVideoIndex = (currentVideoIndex + 1) % videoFiles.length;
            loadVideo(videoFiles[currentVideoIndex]);
        }
    });
  }

  let prevButton = document.getElementById("prev");
  if (prevButton) {
    prevButton.addEventListener('click', () => {
        if (videoFiles.length > 1) {
            currentVideoIndex = (currentVideoIndex - 1 + videoFiles.length) % videoFiles.length;
            loadVideo(videoFiles[currentVideoIndex]);
        }
    });
  }

  let fullscreenButton = document.getElementById("fullscreen");
  let parentElement = document.getElementById("parent");
  if (fullscreenButton) {
    fullscreenButton.addEventListener('click', () => {
        toggleFullScreen(parentElement);
    });
  }

  function toggleFullScreen(element) {
      if (!document.fullscreenElement) {
          if (element.requestFullscreen) {
              element.requestFullscreen();
          } else if (element.webkitRequestFullscreen) {
              element.webkitRequestFullscreen();
          } else if (element.msRequestFullscreen) {
              element.msRequestFullscreen();
          }
      } else {
          if (document.exitFullscreen) {
              document.exitFullscreen();
          } else if (document.webkitExitFullscreen) {
              document.webkitExitFullscreen();
          } else if (document.msExitFullscreen) {
              document.msExitFullscreen();
          }
      }
  }

  let fadeTimeout;
  let isSettingOpacity = false;

  function startFadeTimeout() {
      clearTimeout(fadeTimeout);
      fadeTimeout = setTimeout(function() {
          var fadeEffect = setInterval(function () {
              let stillFading = false;
              HUD.forEach((node) => {
                  // Allow all HUD elements to fade, including description
                  if (parseFloat(node.style.opacity) > 0) {
                      node.style.opacity = Math.max(0, parseFloat(node.style.opacity) - 0.02).toString();
                      stillFading = true;
                  }
              });
              if (!stillFading) {
                  clearInterval(fadeEffect);
              }
          }, 100);
      }, 3000);
  }

  startFadeTimeout();

  let placeholderCanvas = document.createElement('canvas');
  placeholderCanvas.width = 2;
  placeholderCanvas.height = 2;
  let placeholderCtx = placeholderCanvas.getContext('2d');
  placeholderCtx.fillStyle = 'black';
  placeholderCtx.fillRect(0, 0, 2, 2);
  let placeholderImage = placeholderCanvas;

  let fallbackImage = null;
  let camTexture = null;
  let videoReady = false;
  let videoLoadError = false;
  let webgl = null;

  const canvas = document.getElementById('canvas');
  webgl = new WebGLUtils(canvas, {
    preserveDrawingBuffer: true,
    alpha: false
  });

  webgl.createProgram(vert, frag);
  webgl.useProgram();

  webgl.createBuffer('position', [1, 1, -1, 1, 1, -1, -1, -1], 2);

  window.addEventListener('resize', () => {
    webgl.resize();
    updateVideoAspectRatio();
  });

  webgl.resize();

  function loadVideo(file) {
      if (!file) return;

      const videoNode = document.querySelector('video');

      if (camTexture) {
          const gl = webgl.gl;
          gl.deleteTexture(camTexture);
          camTexture = null;
      }

      const gl = webgl.gl;
      camTexture = webgl.createTexture(0);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, placeholderImage);
      webgl.setActiveTexture(0, camTexture);
      webgl.setInt('camTexture', 0);

      const fileURL = URL.createObjectURL(file);
      videoNode.src = fileURL;

      if (currentVideoElement) {
        currentVideoElement.textContent = file.name;
      }

      document.querySelector("#seekbar_span").style.width = "0%";

      if (videoNode.paused) {
          PLAY = true;
          videoNode.play();
      }

      updateVideoAspectRatio();
  }

  const fpsElem = document.getElementById("fps");
  if (fpsElem) {
    fpsElem.style.display = "block";
  }

  // FPS counter with frame time averaging for stability
  let frameTimeHistory = [];
  const MAX_FRAME_SAMPLES = 30; // Larger for more stable average
  
  let then = 0;
  function loop(time) {
      loop.isRunning = true;

      // Calculate FPS with smoothing
      const now = performance.now();
      const frameTime = now - then;
      then = now;
      
      // Only add valid frame times and avoid division by zero
      if (frameTime > 0) {
          frameTimeHistory.push(frameTime);
          // Limit the array length to prevent memory growth and maintain recent average
          if (frameTimeHistory.length > MAX_FRAME_SAMPLES) {
              frameTimeHistory.shift();
          }
      }
      
      // Calculate average FPS from frame time history
      if (frameTimeHistory.length > 0) {
          const avgFrameTime = frameTimeHistory.reduce((a, b) => a + b, 0) / frameTimeHistory.length;
          const fps = 1000 / avgFrameTime; // Convert ms to frames per second
          if (fpsElem) {
              fpsElem.textContent = `FPS: ${fps.toFixed(1)}`;
          }
      }

      time *= 0.001;

      const gl = webgl.gl;

      if (video && !video.paused && camTexture &&
          video.readyState >= 3 &&
          video.videoWidth > 0 && video.videoHeight > 0) {

          try {
              webgl.setActiveTexture(0, camTexture);
              gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, video);
              videoReady = true;
          } catch (e) {
              console.error("Error updating texture:", e);
          }
      }

      webgl.clear();
      webgl.setFloat('width', webgl.width);
      webgl.setFloat('height', webgl.height);

      if (video && video.videoWidth > 0 && video.videoHeight > 0) {
          webgl.setFloat('texWidth', video.videoWidth);
          webgl.setFloat('texHeight', video.videoHeight);
      } else {
          webgl.setFloat('texWidth', webgl.width);
          webgl.setFloat('texHeight', webgl.height);
      }

      webgl.setBool('ENHANCE', ENHANCE && videoReady);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      requestAnimationFrame(loop);
  }

  function loadImage(url) {
      return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.src = url;
          img.onload = () => {
              resolve(img);
          };
          img.onerror = () => {
              reject(img);
          };
      });
  }

  function takeScreenshot() {
      const canvas = webgl.canvas;
      const anchor = document.createElement('a');
      anchor.setAttribute('download', 'screenshot.jpg');
      anchor.setAttribute('href', canvas.toDataURL('image/jpeg', 0.92));
      anchor.click();
  }

  async function setup() {
      let video = document.querySelector('video');
      const gl = webgl.gl;

      videoReady = false;
      videoLoadError = false;

      // Event listener for video metadata loading - Important for getting dimensions
      video.addEventListener("loadedmetadata", function() {
          console.log("Video metadata loaded. Dimensions:", video.videoWidth, "x", video.videoHeight);
          updateVideoInfo(video);
          prepareTexture();
          updateVideoAspectRatio();
      });

      video.addEventListener("error", function(e) {
          console.error("Video error:", e);
          document.querySelector('#message').innerHTML = "Error loading video: " + (e.message || "Unknown error");
          document.querySelector('#message').className = "error";
          document.querySelector('#message').style.display = "block";
          videoLoadError = true;
      });

      video.addEventListener("canplay", function() {
          console.log("Video can play, preparing texture");
          prepareTexture();
      }, { once: true });

      video.addEventListener("canplaythrough", function() {
          console.log("Video can play through, updating texture");
          if (!camTexture || videoLoadError) {
              prepareTexture();
          }
      }, { once: true });

      function prepareTexture() {
          if (video.videoWidth <= 0 || video.videoHeight <= 0) {
              console.log("Video dimensions not available yet, waiting...");
              return;
          }

          console.log("Setting up texture with dimensions:", video.videoWidth, "x", video.videoHeight);

          if (camTexture) {
              gl.deleteTexture(camTexture);
          }

          camTexture = webgl.createTexture(0);
          try {
              gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
                           video.readyState >= 2 ? video : placeholderImage);
              webgl.setActiveTexture(0, camTexture);
              webgl.setInt('camTexture', 0);
          } catch (e) {
              console.error("Error setting up initial texture:", e);
              gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, placeholderImage);
          }

          if (!loop.isRunning) {
              loop.isRunning = true;
              loop(0);
          }

          updateVideoAspectRatio();
      }

      video.addEventListener("playing", function() {
          console.log("Video is playing");
          if (video.videoWidth > 0 && video.videoHeight > 0) {
              prepareTexture();
          }

          video.ontimeupdate = function() {
              let percentage = (video.currentTime / video.duration) * 100;
              document.querySelector("#seekbar_span").style.width = percentage + "%";
          };
      });

      if (!video) {
          try {
              fallbackImage = await loadImage('./error.gif');
          } catch (ex) {
              console.error(ex.message);
              return false;
          }
      }

      try {
          console.log("Attempting to play video");
          let playPromise = video.play();

          if (playPromise !== undefined) {
              playPromise.then(_ => {
                  console.log("Video playback started successfully");
              })
              .catch(error => {
                  console.error("Video playback failed:", error);
                  document.querySelector('#message').innerHTML = "Playback error: " + error.message;
                  document.querySelector('#message').style.display = "block";

                  setTimeout(() => {
                      document.querySelector('#message').style.display = "none";
                  }, 5000);
              });
          }
      } catch (e) {
          console.error("Exception during video.play():", e);
      }
  }

  // Function to update video info display
  function updateVideoInfo(video) {
      if (!video || !fileInfoElement) return;
      
      // Get video MIME type
      const videoType = video.src ? 
          (video.src.startsWith('blob:') ? 'video/mp4' : video.src.split('.').pop()) : 
          'unknown';
          
      // Format video dimensions and runtime
      const dimensions = (video.videoWidth && video.videoHeight) ? 
          `${video.videoWidth}x${video.videoHeight}` : 
          'Loading dimensions...';
      
      const runtime = !isNaN(video.duration) ? 
          formatRuntime(video.duration) : 
          '0:00:00';
      
      // Update the file info display
      fileInfoElement.textContent = `Dimensions: ${dimensions}, Codec: ${videoType}, Runtime: ${runtime}`;
      
      // Continue updating runtime if not yet available
      if (isNaN(video.duration) || video.duration === 0) {
          setTimeout(() => updateVideoInfo(video), 500);
      }
  }

  function setOpacityMenu() {
      if (isSettingOpacity) return;

      isSettingOpacity = true;

      HUD.forEach((node) => {
          // Show all HUD elements, including description
          node.style.opacity = "1.0";
      });

      startFadeTimeout();

      isSettingOpacity = false;
  }

  document.addEventListener('mousemove', (event) => {setOpacityMenu();})
  document.addEventListener('mousedown', (event) => {setOpacityMenu();})
  document.addEventListener('mouseup', (event) => {setOpacityMenu();})
  var seekbar = document.querySelector("#seekbar");
  seekbar.addEventListener('click', (event) => {setVideoPos(event);})

  function setVideoPos(event) {
      var offset = event.offsetX;
      var totalWidth = seekbar.offsetWidth;
      var percentage = ( offset / totalWidth );
      var vidTime = video.duration * percentage;
      video.currentTime = vidTime;
  }

  (function localFileVideoPlayer() {
      'use strict'
      var URL = window.URL || window.webkitURL
      var displayMessage = function (message, isError) {
          var element = document.querySelector('#message')
          element.innerHTML = message
          element.className = isError ? 'error' : 'info'
          element.style.display = "block";
      }

      var handleFileSelection = function (event) {
          if (this.files && this.files.length > 0) {
              videoFiles = Array.from(this.files);

              currentVideoIndex = 0;

              var file = videoFiles[0];
              var type = file.type;
              var videoNode = document.querySelector('video');
              var canPlay = videoNode.canPlayType(type);
              if (canPlay === '') canPlay = 'no';
              var message = 'Playlist loaded with ' + videoFiles.length + ' video(s). Can play type "' + type + '": ' + canPlay;
              var isError = canPlay === 'no';
              displayMessage(message, isError);
              console.log(message);

              if (isError) {
                  return;
              }

              if (videoFiles.length > 1 && prevButton && nextButton) {
                  prevButton.style.display = 'block';
                  nextButton.style.display = 'block';
              } else if (prevButton && nextButton) {
                  prevButton.style.display = 'none';
                  nextButton.style.display = 'none';
              }

              loadVideo(videoFiles[0]);

              setTimeout(() => {
                  document.querySelector('#message').style.display = "none";
              }, 3000);

              setup();
          } else {
              console.log("No files selected");
              displayMessage("No files selected", true);

              setTimeout(() => {
                  document.querySelector('#message').style.display = "none";
              }, 3000);
          }
      }

      var inputNode = document.querySelector('input');
      inputNode.addEventListener('change', handleFileSelection, false);
  })()

  function playIntentFile(file) {
      file = file.substring(1, file.length);
      var type = file.type;
      var videoNode = document.querySelector('video');
      var canPlay = videoNode.canPlayType(type);
      if (canPlay === '') canPlay = 'no';
      var message = 'Can play type "' + type + '": ' + canPlay;
      var isError = canPlay === 'no';

      document.querySelector('#message').innerHTML = message;
      document.querySelector('#message').style.display = "block";

      setTimeout(() => {
          document.querySelector('#message').style.display = "none";
      }, 3000);

      if (isError) {
          return;
      }

      videoFiles = [file];
      currentVideoIndex = 0;

      if (prevButton && nextButton) {
          prevButton.style.display = 'none';
          nextButton.style.display = 'none';
      }

      var fileURL = URL.createObjectURL(file);
      videoNode.src = fileURL;
      if (currentVideoElement) {
          currentVideoElement.textContent = file.name || "External Video";
      }
      setup();
  }

  function updateVideoAspectRatio() {
      const video = document.querySelector('video');
      const canvas = document.getElementById('canvas');
      const gl = webgl.gl;

      if (video.videoWidth > 0 && video.videoHeight > 0) {
          const videoAspect = video.videoWidth / video.videoHeight;
          const canvasAspect = canvas.width / canvas.height;

          let width, height, x, y;

          if (videoAspect > canvasAspect) {
              // Video is wider than the canvas, fit to height
              height = canvas.height;
              width = height * videoAspect;
              x = (canvas.width - width) / 2;
              y = 0;
          } else {
              // Video is taller than the canvas, fit to width
              width = canvas.width;
              height = width / videoAspect;
              x = 0;
              y = (canvas.height - height) / 2;
          }

          // Set the viewport to fit the video within the canvas
          gl.viewport(x, y, width, height);
      } else {
          gl.viewport(0, 0, canvas.width, canvas.height);
      }
  }

  function formatRuntime(seconds) {
      if (isNaN(seconds) || seconds === Infinity) return "0:00:00";
      
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
});