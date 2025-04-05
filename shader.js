const glsl = x => x;
const frag = glsl`
// Copyright (c) 2021-2025 Advanced Micro Devices, Inc. All rights reserved.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//
// FidelityFX FSR v1.0.2 by AMD
// ported to mpv by agyild - https://gist.github.com/agyild/82219c545228d70c5604f865ce0b0ce5
// ported to WebGL by goingdigital - https://www.shadertoy.com/view/stXSWB
// ported to HTML5 video by @BenjaminWegener
// Enhanced with CMAA2 edge detection techniques

// Parameter tuning
#define SHARPENING 2.0 // Sharpening intensity: Adjusts sharpening intensity (1.0 is default. 0.0 to 2.0 recommended)
#define CONTRAST 2.0 // Adjusts the range the shader adapts to high contrast (Higher values = more high contrast sharpening. 0.0 to 2.0)
#define EDGE_THRESHOLD 0.15 // Threshold for edge detection (Inspired by CMAA2)
#define EDGE_WEIGHT 1.2 // Weight applied to detected edges (Inspired by CMAA2)

precision highp float;

uniform float width;
uniform float height;
uniform float texWidth;
uniform float texHeight;
uniform bool ENHANCE;
uniform sampler2D camTexture;
uniform float videoAspect; // Video's aspect ratio (width/height)
uniform float canvasAspect; // Canvas's aspect ratio (width/height)

// Used to convert from linear RGB to XYZ space
const mat3 RGB_2_XYZ = mat3(
    0.4124564, 0.2126729, 0.0193339,
    0.3575761, 0.7151522, 0.1191920,
    0.1804375, 0.0721750, 0.9503041
);

// Used to convert from XYZ to linear RGB space
const mat3 XYZ_2_RGB = mat3(
     3.2404542,-0.9692660, 0.0556434,
    -1.5371385, 1.8760108,-0.2040259,
    -0.4985314, 0.0415560, 1.0572252
);

// Converts a color from linear RGB to XYZ space
vec3 rgb_to_xyz(vec3 rgb) {
    return RGB_2_XYZ * rgb;
}

// Converts a color from XYZ to linear RGB space
vec3 xyz_to_rgb(vec3 xyz) {
    return XYZ_2_RGB * xyz;
}

vec3 FsrEasuCF(vec2 p) {
    vec2 uv = (p + .5) / vec2(texWidth, texHeight);
    vec4 color = texture2D(camTexture, uv);
    return rgb_to_xyz(color.rgb);
}

// CMAA2-inspired conservative edge detection
float detectEdge(vec3 a, vec3 b, vec3 c, vec3 d) {
    float lA = dot(a, vec3(0.2126, 0.7152, 0.0722));
    float lB = dot(b, vec3(0.2126, 0.7152, 0.0722));
    float lC = dot(c, vec3(0.2126, 0.7152, 0.0722));
    float lD = dot(d, vec3(0.2126, 0.7152, 0.0722));

    float gradH = abs(lA - lB) + abs(lC - lD);
    float gradV = abs(lA - lC) + abs(lB - lD);

    float maxGrad = max(gradH, gradV);

    return clamp((maxGrad - EDGE_THRESHOLD) / (EDGE_THRESHOLD * 2.0), 0.0, 1.0);
}

void FsrEasuCon(
    out vec4 con0,
    out vec4 con1,
    out vec4 con2,
    out vec4 con3,
    vec2 inputViewportInPixels,
    vec2 inputSizeInPixels,
    vec2 outputSizeInPixels
)
{
    con0 = vec4(
        inputViewportInPixels.x/outputSizeInPixels.x,
        inputViewportInPixels.y/outputSizeInPixels.y,
        .5*inputViewportInPixels.x/outputSizeInPixels.x-.5,
        .5*inputViewportInPixels.y/outputSizeInPixels.y-.5
    );
    con1 = vec4(1,1,1,-1)/inputSizeInPixels.xyxy;
    con2 = vec4(-1,2,1,2)/inputSizeInPixels.xyxy;
    con3 = vec4(0,4,0,0)/inputSizeInPixels.xyxy;
}

void FsrEasuTapF(
    inout vec3 aC,
    inout float aW,
    vec2 off,
    vec2 dir,
    vec2 len,
    float lob,
    float clp,
    vec3 c,
    float edgeStrength
)
{
    vec2 v = vec2(dot(off, dir), dot(off, vec2(-dir.y, dir.x)));
    v *= len;
    float d2 = min(dot(v,v), clp);
    float wB = .4 * d2 - 1.;
    float wA = lob * d2 - 1.;
    wB *= wB;
    wA *= wA;
    wB = 1.5625 * wB - .5625;
    float w = wB * wA;

    float edgeAdjustedWeight = 1.0 + edgeStrength * (EDGE_WEIGHT - 1.0);
    w *= edgeAdjustedWeight;

    aC += c * w;
    aW += w;
}

void FsrEasuSetF(
    inout vec2 dir,
    inout float len,
    float w,
    float lA, float lB, float lC, float lD, float lE,
    float edgeStrength
)
{
    float lenX = max(abs(lD - lC), abs(lC - lB));
    float dirX = lD - lB;

    float edgeWeight = 1.0 + edgeStrength * (EDGE_WEIGHT - 1.0);
    dir.x += dirX * w * edgeWeight;

    lenX = clamp(abs(dirX) / lenX, 0., 1.);
    lenX *= lenX;
    len += lenX * w * edgeWeight;

    float lenY = max(abs(lE - lC), abs(lC - lA));
    float dirY = lE - lA;
    dir.y += dirY * w * edgeWeight;
    lenY = clamp(abs(dirY) / lenY, 0., 1.);
    lenY *= lenY;
    len += lenY * w * edgeWeight;
}

void FsrEasuF(
    out vec3 pix,
    vec2 ip,
    vec4 con0,
    vec4 con1,
    vec4 con2,
    vec4 con3
)
{
    vec2 pp = ip * con0.xy + con0.zw;
    vec2 fp = floor(pp);
    pp -= fp;

    vec2 p0 = fp * con1.xy + con1.zw;
    vec2 p1 = p0 + con2.xy;
    vec2 p2 = p0 + con2.zw;
    vec2 p3 = p0 + con3.xy;

    vec4 off = vec4(-.5, .5, -.5, .5) * con1.xxyy;
    vec3 bC = FsrEasuCF(p0 + off.xw); float bL = bC.g + 0.5 * (bC.r + bC.b);
    vec3 cC = FsrEasuCF(p0 + off.yw); float cL = cC.g + 0.5 * (cC.r + cC.b);
    vec3 iC = FsrEasuCF(p1 + off.xw); float iL = iC.g + 0.5 * (iC.r + iC.b);
    vec3 jC = FsrEasuCF(p1 + off.yw); float jL = jC.g + 0.5 * (jC.r + jC.b);
    vec3 fC = FsrEasuCF(p1 + off.yz); float fL = fC.g + 0.5 * (fC.r + fC.b);
    vec3 eC = FsrEasuCF(p1 + off.xz); float eL = eC.g + 0.5 * (eC.r + eC.b);
    vec3 kC = FsrEasuCF(p2 + off.xw); float kL = kC.g + 0.5 * (kC.r + kC.b);
    vec3 lC = FsrEasuCF(p2 + off.yw); float lL = lC.g + 0.5 * (lC.r + lC.b);
    vec3 hC = FsrEasuCF(p2 + off.yz); float hL = hC.g + 0.5 * (hC.r + hC.b);
    vec3 gC = FsrEasuCF(p2 + off.xz); float gL = gC.g + 0.5 * (gC.r + gC.b);
    vec3 oC = FsrEasuCF(p3 + off.yz); float oL = oC.g + 0.5 * (oC.r + oC.b);
    vec3 nC = FsrEasuCF(p3 + off.xz); float nL = nC.g + 0.5 * (nC.r + nC.b);

    // Cache edge strength values
    float edgeTL = detectEdge(bC, cC, fC, gC);
    float edgeTR = detectEdge(cC, bC, gC, fC);
    float edgeBL = detectEdge(fC, gC, jC, kC);
    float edgeBR = detectEdge(gC, fC, kC, jC);

    vec2 dir = vec2(0);
    float len = 0.;

    FsrEasuSetF(dir, len, (1.-pp.x)*(1.-pp.y), bL, eL, fL, gL, jL, edgeTL);
    FsrEasuSetF(dir, len,    pp.x  *(1.-pp.y), cL, fL, gL, hL, kL, edgeTR);
    FsrEasuSetF(dir, len, (1.-pp.x)*  pp.y  , fL, iL, jL, kL, nL, edgeBL);
    FsrEasuSetF(dir, len,    pp.x  *  pp.y  , gL, jL, kL, lL, oL, edgeBR);

    vec2 dir2 = dir * dir;
    float dirR = dir2.x + dir2.y;
    bool zro = dirR < (1.0/32768.0);
    dirR = inversesqrt(dirR);

    if (zro) {
        vec4 w = vec4(0.0);
        w.x = (1.0 - pp.x) * (1.0 - pp.y);
        w.y =        pp.x  * (1.0 - pp.y);
        w.z = (1.0 - pp.x) *        pp.y;
        w.w =        pp.x  *        pp.y;
        pix.r = clamp(dot(w, vec4(fL, gL, jL, kL)), 0.0, 1.0);
        return;
    }

    dir *= vec2(dirR);
    len = len * 0.5;
    len *= len;
    float stretch = dot(dir,dir) / (max(abs(dir.x), abs(dir.y)));
    vec2 len2 = vec2(1. +(stretch-1.0)*len, 1. -.5 * len);
    float lob = .5 - .29 * len;
    float clp = 1./lob;

    vec3 aC = vec3(0);
    float aW = 0.;

    float centerEdgeStrength = (edgeTL + edgeTR + edgeBL + edgeBR) * 0.25;

    FsrEasuTapF(aC, aW, vec2( 0,-1)-pp, dir, len2, lob, clp, bC, edgeTL);
    FsrEasuTapF(aC, aW, vec2( 1,-1)-pp, dir, len2, lob, clp, cC, edgeTR);
    FsrEasuTapF(aC, aW, vec2(-1, 1)-pp, dir, len2, lob, clp, iC, edgeBL);
    FsrEasuTapF(aC, aW, vec2( 0, 1)-pp, dir, len2, lob, clp, jC, edgeBL);
    FsrEasuTapF(aC, aW, vec2( 0, 0)-pp, dir, len2, lob, clp, fC, centerEdgeStrength);
    FsrEasuTapF(aC, aW, vec2(-1, 0)-pp, dir, len2, lob, clp, eC, edgeTL);
    FsrEasuTapF(aC, aW, vec2( 1, 1)-pp, dir, len2, lob, clp, kC, edgeBR);
    FsrEasuTapF(aC, aW, vec2( 2, 1)-pp, dir, len2, lob, clp, lC, edgeBR);
    FsrEasuTapF(aC, aW, vec2( 2, 0)-pp, dir, len2, lob, clp, hC, edgeTR);
    FsrEasuTapF(aC, aW, vec2( 1, 0)-pp, dir, len2, lob, clp, gC, edgeTR);
    FsrEasuTapF(aC, aW, vec2( 1, 2)-pp, dir, len2, lob, clp, oC, edgeBR);
    FsrEasuTapF(aC, aW, vec2( 0, 2)-pp, dir, len2, lob, clp, nC, edgeBL);

    vec3 min4 = min(min(fC,gC),min(jC,kC));
    vec3 max4 = max(max(fC,gC),max(jC,kC));
    pix = min(max4, max(min4, aC/aW));
}

void EASU(out vec4 fragColor, in vec2 fragCoord)
{
    vec3 c;
    vec4 con0,con1,con2,con3;
    vec2 rendersize = vec2(texWidth, texHeight);
    FsrEasuCon(
        con0, con1, con2, con3, rendersize, rendersize, vec2(width, height)
    );
    FsrEasuF(c, fragCoord, con0, con1, con2, con3);
    fragColor = vec4(xyz_to_rgb(c.xyz), 1);
}

vec4 getPixel(vec2 pos) {
    // Convert from pixel coordinates to normalized (0-1) range
    vec2 coord = (pos + .5) / vec2(width, height);
    
    // Track if we're dealing with portrait or landscape video
    bool isPortraitVideo = videoAspect < 1.0;
    
    // Store original coordinates for determining letterboxing/pillarboxing
    vec2 originalCoord = coord;
    
    // Apply aspect ratio correction
    if (videoAspect > canvasAspect) {
        // Video is wider than canvas - add letterboxing (black bars on top/bottom)
        float scaledHeight = canvasAspect / videoAspect;
        // Scale y-coordinate around center point (0.5)
        coord.y = (coord.y - 0.5) * (1.0/scaledHeight) + 0.5;
    } else {
        // Video is taller than canvas - add pillarboxing (black bars on left/right)
        float scaledWidth = videoAspect / canvasAspect;
        // Scale x-coordinate around center point (0.5)
        coord.x = (coord.x - 0.5) * (1.0/scaledWidth) + 0.5;
    }
    
    // Flip y-coordinate as in original code
    coord.y = 1.0 - coord.y;
    
    // Determine if we're in the valid video area or in the letterbox/pillarbox
    bool inVideoArea = coord.x >= 0.0 && coord.x <= 1.0 && coord.y >= 0.0 && coord.y <= 1.0;
    
    if (inVideoArea) {
        // More aggressive edge correction
        // Use fixed offsets to ensure we're well away from the edges
        float xOffset = 2.0 / texWidth;
        float yOffset = 2.0 / texHeight;
        
        // For the dimension that matters most in the current orientation, use more aggressive correction
        if (videoAspect > canvasAspect) {
            // Letterboxed (top/bottom bars) - more aggressive y correction
            yOffset = 3.0 / texHeight;
        } else {
            // Pillarboxed (left/right bars) - more aggressive x correction
            xOffset = 3.0 / texWidth;
        }
        
        // Apply inset to stay away from edges
        coord.x = mix(xOffset, 1.0 - xOffset, coord.x);
        coord.y = mix(yOffset, 1.0 - yOffset, coord.y);
        
        // Return the texture sample with corrected coordinates
        return texture2D(camTexture, coord);
    } else {
        // Outside video area - return black
        return vec4(0.0, 0.0, 0.0, 1.0);
    }
}

void main() {
    vec4 e = getPixel(gl_FragCoord.xy);

    if (ENHANCE == true) {
        vec4 e_xyz = vec4(rgb_to_xyz(e.rgb), 1);
        EASU(e_xyz, (gl_FragCoord.xy + 0.5) / vec2(width, height));

        // Cache pixel values
        vec3 a = getPixel(gl_FragCoord.xy + vec2(-1.0,-1.0)).rgb;
        vec3 b = getPixel(gl_FragCoord.xy + vec2( 0.0,-1.0)).rgb;
        vec3 c = getPixel(gl_FragCoord.xy + vec2( 1.0,-1.0)).rgb;
        vec3 f = getPixel(gl_FragCoord.xy + vec2( 1.0, 0.0)).rgb;
        vec3 g = getPixel(gl_FragCoord.xy + vec2(-1.0, 1.0)).rgb;
        vec3 h = getPixel(gl_FragCoord.xy + vec2( 0.0, 1.0)).rgb;
        vec3 d = getPixel(gl_FragCoord.xy + vec2(-1.0, 0.0)).rgb;
        vec3 i = getPixel(gl_FragCoord.xy + vec2( 1.0, 1.0)).rgb;

        float edgeStrength = detectEdge(a, c, g, i);

        vec3 lumCoef = vec3(0.2126, 0.7152, 0.0722);
        float eLuma = dot(e.rgb, lumCoef);
        vec3 eChroma = e.rgb - vec3(eLuma);

        vec3 mnRGB = min(min(min(d, e.rgb), min(f, b)), h);
        vec3 mnRGB2 = min(mnRGB, min(min(a, c), min(g, i)));
        mnRGB += mnRGB2;

        vec3 mxRGB = max(max(max(d, e.rgb), max(f, b)), h);
        vec3 mxRGB2 = max(mxRGB, max(max(a, c), max(g, i)));
        mxRGB += mxRGB2;

        vec3 rcpMRGB = 1.0 / mxRGB;
        vec3 ampRGB = clamp(min(mnRGB, 2.0 - mxRGB) * rcpMRGB, 0.0, 1.0);

        ampRGB = inversesqrt(ampRGB);

        float peak = -3.0 * clamp(CONTRAST, 0.0, 1.0) + 8.0;

        float lumaWeight = -1.0 / (dot(ampRGB, lumCoef) * peak);
        lumaWeight *= mix(1.0, EDGE_WEIGHT, edgeStrength);

        float bLuma = dot(b, lumCoef);
        float dLuma = dot(d, lumCoef);
        float fLuma = dot(f, lumCoef);
        float hLuma = dot(h, lumCoef);

        float lumaWindow = bLuma + dLuma + fLuma + hLuma;
        float rcpLumaWeight = 1.0 / (4.0 * lumaWeight + 1.0);

        float sharpenedLuma = clamp((lumaWindow * lumaWeight + eLuma) * rcpLumaWeight, 0.0, 1.0);

        vec3 outColor = eChroma + vec3(sharpenedLuma);

        gl_FragColor = vec4(mix(e.rgb, outColor, SHARPENING), e.a);
    }
    else gl_FragColor = e;
}
`;

const vert = glsl`
precision mediump float;
attribute vec2 position;

void main () {
    gl_Position = vec4(position, 0, 1.0);
}
`;