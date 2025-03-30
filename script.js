// Wait for shader.js to load before using frag and vert variables
document.addEventListener('DOMContentLoaded', function() {
  // Make sure we can access the shader variables
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
  enhanceButton.addEventListener('click', () => {
      ENHANCE = !ENHANCE;
      if (ENHANCE) {enhanceButton.style.border = "dashed";}
      else {enhanceButton.style.border = "none";}
  });
  let playButton = document.getElementById("play");
  playButton.addEventListener('click', () => {
      PLAY = !PLAY;
      if (PLAY) {video.play();}
      else {video.pause();}
  });

  // Video playlist functionality
  let videoFiles = [];
  let currentVideoIndex = 0;
  let currentVideoElement = document.getElementById("current-video");

  // Next video button
  let nextButton = document.getElementById("next");
  if (nextButton) {
    nextButton.addEventListener('click', () => {
        if (videoFiles.length > 1) {
            currentVideoIndex = (currentVideoIndex + 1) % videoFiles.length;
            loadVideo(videoFiles[currentVideoIndex]);
        }
    });
  }

  // Previous video button
  let prevButton = document.getElementById("prev");
  if (prevButton) {
    prevButton.addEventListener('click', () => {
        if (videoFiles.length > 1) {
            currentVideoIndex = (currentVideoIndex - 1 + videoFiles.length) % videoFiles.length;
            loadVideo(videoFiles[currentVideoIndex]);
        }
    });
  }

  // Fullscreen functionality
  let fullscreenButton = document.getElementById("fullscreen");
  let parentElement = document.getElementById("parent");
  if (fullscreenButton) {
    fullscreenButton.addEventListener('click', () => {
        toggleFullScreen(parentElement);
    });
  }

  function toggleFullScreen(element) {
      if (!document.fullscreenElement) {
          // Enter fullscreen
          if (element.requestFullscreen) {
              element.requestFullscreen();
          } else if (element.webkitRequestFullscreen) { /* Safari */
              element.webkitRequestFullscreen();
          } else if (element.msRequestFullscreen) { /* IE11 */
              element.msRequestFullscreen();
          }
      } else {
          // Exit fullscreen
          if (document.exitFullscreen) {
              document.exitFullscreen();
          } else if (document.webkitExitFullscreen) { /* Safari */
              document.webkitExitFullscreen();
          } else if (document.msExitFullscreen) { /* IE11 */
              document.msExitFullscreen();
          }
      }
  }

  // Fix for controls fading out automatically
  let fadeTimeout;
  let isSettingOpacity = false;

  function startFadeTimeout() {
      // Clear any existing timeout
      clearTimeout(fadeTimeout);
      
      // Start a new timeout for fading
      fadeTimeout = setTimeout(function() {
          var fadeEffect = setInterval(function () {
              let stillFading = false;
              HUD.forEach((node) => {
                  // Don't fade the description (which contains the video name)
                  if (node.id === "description") {
                      return;
                  }
                  if (parseFloat(node.style.opacity) > 0) {
                      node.style.opacity = Math.max(0, parseFloat(node.style.opacity) - 0.02).toString();
                      stillFading = true;
                  }
              });
              // If nothing is still fading, clear the interval
              if (!stillFading) {
                  clearInterval(fadeEffect);
              }
          }, 100);
      }, 3000); // Wait 3 seconds before starting to fade
  }

  // Initialize the fade timeout
  startFadeTimeout();

  // Create a placeholder texture image for loading state
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

  // Initialize WebGL with shaders from shader.js
  const canvas = document.getElementById('canvas');
  webgl = new WebGLUtils(canvas, {
    preserveDrawingBuffer: true,
    alpha: false
  });
  
  // Create shader program
  webgl.createProgram(vert, frag);
  webgl.useProgram();
  
  // Create position buffer with 2D coordinates for a full-screen quad
  webgl.createBuffer('position', [1, 1, -1, 1, 1, -1, -1, -1], 2);
  
  // Handle window resize
  window.addEventListener('resize', () => {
    webgl.resize();
  });
  
  // Initial resize
  webgl.resize();

  function loadVideo(file) {
      if (!file) return;
      
      const videoNode = document.querySelector('video');
      
      // Reset texture first
      if (camTexture) {
          const gl = webgl.gl;
          gl.deleteTexture(camTexture);
          camTexture = null;
      }
      
      // Create a placeholder texture while video loads
      const gl = webgl.gl;
      camTexture = webgl.createTexture(0);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, placeholderImage);
      webgl.setActiveTexture(0, camTexture);
      webgl.setInt('camTexture', 0);
      
      // Now load the video
      const fileURL = URL.createObjectURL(file);
      videoNode.src = fileURL;
      
      // Update the current video display
      if (currentVideoElement) {
        currentVideoElement.textContent = file.name;
      }
      
      // Reset the seekbar
      document.querySelector("#seekbar_span").style.width = "0%";
      
      // If video is paused, play it
      if (videoNode.paused) {
          PLAY = true;
          videoNode.play();
      }
  }

  // Hide the fps display
  const fpsElem = document.getElementById("fps");
  if (fpsElem) {
    fpsElem.style.display = "none";
  }

  let then = 0;
  function loop(time) {
      loop.isRunning = true;
      
      time *= 0.001;  // convert to seconds
   
      const gl = webgl.gl;
      
      // Only update texture if video is actually playing and has loaded enough data
      if (video && !video.paused && camTexture && 
          video.readyState >= 3 && // HAVE_FUTURE_DATA or better
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
      
      // Add safety checks for video dimensions
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
      // WebGL is already initialized
      let video = document.querySelector('video');
      const gl = webgl.gl;
      
      // Reset state
      videoReady = false;
      videoLoadError = false;
      
      // Add error handling for video loading
      video.addEventListener("error", function(e) {
          console.error("Video error:", e);
          document.querySelector('#message').innerHTML = "Error loading video: " + (e.message || "Unknown error");
          document.querySelector('#message').className = "error";
          document.querySelector('#message').style.display = "block";
          videoLoadError = true;
      });
      
      // Wait for enough data before creating texture
      video.addEventListener("canplay", function() {
          console.log("Video can play, preparing texture");
          prepareTexture();
      }, { once: true });
      
      // Make sure we have enough data for smooth playback
      video.addEventListener("canplaythrough", function() {
          console.log("Video can play through, updating texture");
          // Ensure we have a valid texture
          if (!camTexture || videoLoadError) {
              prepareTexture();
          }
      }, { once: true });
      
      function prepareTexture() {
          // Only create new texture if needed
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
              // Make sure the video is actually ready
              gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, 
                           video.readyState >= 2 ? video : placeholderImage);
              webgl.setActiveTexture(0, camTexture);
              webgl.setInt('camTexture', 0);
          } catch (e) {
              console.error("Error setting up initial texture:", e);
              // Fall back to placeholder
              gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, placeholderImage);
          }
          
          if (!loop.isRunning) {
              loop.isRunning = true;
              loop(0);
          }
      }
      
      video.addEventListener("playing", function() {
          console.log("Video is playing");
          // Video is definitely playing now, make sure we have a good texture
          if (video.videoWidth > 0 && video.videoHeight > 0) {
              prepareTexture();
          }
          
          // Update seekbar while playing
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
      
      // Try to play the video - add error handling
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
                  
                  // Hide error message after 5 seconds
                  setTimeout(() => {
                      document.querySelector('#message').style.display = "none";
                  }, 5000);
              });
          }
      } catch (e) {
          console.error("Exception during video.play():", e);
      }
  }

  function setOpacityMenu() {
      // Prevent recursion
      if (isSettingOpacity) return;
      
      isSettingOpacity = true;
      
      // Set all controls to visible except the description (which contains the video name)
      HUD.forEach((node) => {
          if (node.id !== "description") {
              node.style.opacity = "1.0";
          }
      });
      
      // Reset fade timeout
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

  // Set up file selection functionality
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
          console.log("File selection event triggered");
          
          // Store all selected files in the playlist
          if (this.files && this.files.length > 0) {
              videoFiles = Array.from(this.files);
              console.log("Selected files:", videoFiles.length);
              
              // Reset the current index
              currentVideoIndex = 0;
              
              // Check if the first file is playable
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
              
              // Show prev/next buttons if we have more than one file
              if (videoFiles.length > 1 && prevButton && nextButton) {
                  prevButton.style.display = 'block';
                  nextButton.style.display = 'block';
              } else if (prevButton && nextButton) {
                  prevButton.style.display = 'none';
                  nextButton.style.display = 'none';
              }
              
              // Load first video
              loadVideo(videoFiles[0]);
              
              // Hide message after 3 seconds
              setTimeout(() => {
                  document.querySelector('#message').style.display = "none";
              }, 3000);
              
              // Start setup process
              setup();
          } else {
              console.log("No files selected");
              displayMessage("No files selected", true);
              
              // Hide message after 3 seconds
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
      
      // Hide message after 3 seconds
      setTimeout(() => {
          document.querySelector('#message').style.display = "none";
      }, 3000);
      
      if (isError) {
          return;
      }

      // Reset playlist to just this file
      videoFiles = [file];
      currentVideoIndex = 0;
      
      // Hide prev/next buttons for single file
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
});