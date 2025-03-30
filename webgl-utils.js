/**
 * WebGL Utilities
 * A lightweight replacement for glea.js functionality
 */

class WebGLUtils {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    // Get WebGL context
    this.gl = canvas.getContext('webgl', {
      preserveDrawingBuffer: options.preserveDrawingBuffer || false,
      alpha: options.alpha !== undefined ? options.alpha : true,
      ...options
    });
    
    if (!this.gl) {
      this.gl = canvas.getContext('experimental-webgl', options);
      if (!this.gl) {
        throw new Error('WebGL is not supported');
      }
    }
    
    this.program = null;
    this.buffers = {};
    this.textures = [];
    this.devicePixelRatio = options.devicePixelRatio || 1;
  }
  
  // Create and compile a shader
  createShader(source, type) {
    const { gl } = this;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      throw new Error('Could not compile WebGL shader.\n\n' + info);
    }
    
    return shader;
  }
  
  // Create shader program from vertex and fragment shaders
  createProgram(vertexSource, fragmentSource) {
    const { gl } = this;
    const program = gl.createProgram();
    
    const vertexShader = this.createShader(vertexSource, gl.VERTEX_SHADER);
    const fragmentShader = this.createShader(fragmentSource, gl.FRAGMENT_SHADER);
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      throw new Error('Could not link WebGL program.\n\n' + info);
    }
    
    this.program = program;
    return program;
  }
  
  // Use the program
  useProgram() {
    this.gl.useProgram(this.program);
    return this;
  }
  
  // Create and bind a buffer
  createBuffer(name, data, size, usage = WebGLRenderingContext.STATIC_DRAW) {
    const { gl } = this;
    const loc = gl.getAttribLocation(this.program, name);
    
    if (loc === -1) {
      console.warn(`Attribute ${name} not found in shader`);
      return null;
    }
    
    gl.enableVertexAttribArray(loc);
    
    const buffer = gl.createBuffer();
    const bufferData = data instanceof Array ? new Float32Array(data) : data;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, bufferData, usage);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    
    this.buffers[name] = {
      id: buffer,
      name,
      data: bufferData,
      loc,
      size
    };
    
    return buffer;
  }
  
  // Create and set up a texture
  createTexture(textureIndex = 0, params = {}) {
    const { gl } = this;
    const texture = gl.createTexture();
    
    gl.activeTexture(gl.TEXTURE0 + textureIndex);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    // Set texture parameters with defaults
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, 
                     params.textureWrapS ? gl[params.textureWrapS.toUpperCase()] : gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, 
                     params.textureWrapT ? gl[params.textureWrapT.toUpperCase()] : gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, 
                     params.textureMinFilter ? gl[params.textureMinFilter.toUpperCase()] : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, 
                     params.textureMagFilter ? gl[params.textureMagFilter.toUpperCase()] : gl.LINEAR);
    
    this.textures.push(texture);
    return texture;
  }
  
  // Set active texture
  setActiveTexture(textureIndex, texture) {
    const { gl } = this;
    gl.activeTexture(gl.TEXTURE0 + textureIndex);
    gl.bindTexture(gl.TEXTURE_2D, texture);
  }
  
  // Resize canvas and WebGL viewport
  resize() {
    const { canvas, gl, devicePixelRatio } = this;
    if (canvas) {
      canvas.width = canvas.clientWidth * devicePixelRatio;
      canvas.height = canvas.clientHeight * devicePixelRatio;
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    }
  }
  
  // Clear the canvas
  clear(clearColor = null) {
    const { gl } = this;
    if (clearColor) {
      gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3] || 1.0);
    }
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }
  
  // Set uniform float
  setFloat(name, value) {
    const { gl } = this;
    const loc = gl.getUniformLocation(this.program, name);
    if (loc !== null) {
      gl.uniform1f(loc, value);
    }
    return loc;
  }
  
  // Set uniform integer
  setInt(name, value) {
    const { gl } = this;
    const loc = gl.getUniformLocation(this.program, name);
    if (loc !== null) {
      gl.uniform1i(loc, value);
    }
    return loc;
  }
  
  // Set uniform boolean (as float)
  setBool(name, value) {
    const { gl } = this;
    const loc = gl.getUniformLocation(this.program, name);
    if (loc !== null) {
      gl.uniform1f(loc, value ? 1.0 : 0.0);
    }
    return loc;
  }
  
  // Draw arrays
  drawArrays(mode, first = 0, count) {
    const { gl } = this;
    
    if (typeof count === 'undefined') {
      const attributes = Object.keys(this.buffers);
      if (attributes.length === 0) {
        return;
      }
      const firstAttributeName = attributes[0];
      const firstBuffer = this.buffers[firstAttributeName];
      const len = firstBuffer.data.length;
      count = len / firstBuffer.size;
    }
    
    gl.drawArrays(mode, first, count);
  }
  
  // Get canvas width
  get width() {
    return this.canvas ? this.canvas.width : 0;
  }
  
  // Get canvas height
  get height() {
    return this.canvas ? this.canvas.height : 0;
  }
}