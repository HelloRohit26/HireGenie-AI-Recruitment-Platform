import React, { useEffect, useRef } from 'react';

interface VoiceDepthShaderProps {
  opacity?: number;
  theme?: 'dark' | 'light';
}

export const VoiceDepthShader: React.FC<VoiceDepthShaderProps> = ({ opacity = 0.85, theme = 'dark' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return;

    let animationFrameId: number;
    let mouseX = 0, mouseY = 0;

    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const isDark = theme === 'dark';
    const bgR = isDark ? 0.09 : 0.93;
    const bgG = isDark ? 0.09 : 0.93;
    const bgB = isDark ? 0.08 : 0.91;

    const deepR = isDark ? 0.05 : 0.88;
    const deepG = isDark ? 0.05 : 0.87;
    const deepB = isDark ? 0.04 : 0.84;

    const accentR = isDark ? 0.78 : 0.71;
    const accentG = isDark ? 0.66 : 0.58;
    const accentB = isDark ? 0.42 : 0.33;

    // Fragment Shader matching Stitch export shader_3
    const fsSource = `
      precision highp float;
      varying vec2 v_texCoord;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;

      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }

      void main() {
        vec2 uv = v_texCoord;
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(uv, center);
        
        vec3 colorBg = vec3(${bgR}, ${bgG}, ${bgB});
        vec3 colorDeep = vec3(${deepR}, ${deepG}, ${deepB});
        
        // Volumetric noise depth
        float n = noise(uv * 2.0 + u_time * 0.05);
        n += noise(uv * 4.0 - u_time * 0.03) * 0.5;
        
        // Vignette & Depth
        float vignette = smoothstep(0.8, 0.2, dist);
        vec3 finalColor = mix(colorDeep, colorBg, vignette + n * 0.05);
        
        // Muted Brass Core Glow
        float glow = 0.025 / (dist + 0.08);
        vec3 accent = vec3(${accentR}, ${accentG}, ${accentB});
        finalColor += accent * glow * 0.25;
        
        // Mouse Parallax Glow
        vec2 mouse = u_mouse / u_resolution;
        float mouseDist = distance(uv, mouse);
        finalColor += accent * (0.015 / (mouseDist + 0.4)) * 0.12;
        
        gl_FragColor = vec4(finalColor, ${opacity.toFixed(2)});
      }
    `;

    const createShader = (glCtx: WebGLRenderingContext, type: number, source: string) => {
      const shader = glCtx.createShader(type);
      if (!shader) return null;
      glCtx.shaderSource(shader, source);
      glCtx.compileShader(shader);
      if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        glCtx.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const aPosLoc = gl.getAttribLocation(program, 'a_position');
    const uTimeLoc = gl.getUniformLocation(program, 'u_time');
    const uResLoc = gl.getUniformLocation(program, 'u_resolution');
    const uMouseLoc = gl.getUniformLocation(program, 'u_mouse');

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = rect.height - (e.clientY - rect.top);
    };

    window.addEventListener('mousemove', handleMouseMove);

    const startTime = performance.now();

    const render = () => {
      if (!canvas) return;
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);

      gl.uniform1f(uTimeLoc, (performance.now() - startTime) * 0.001);
      gl.uniform2f(uResLoc, canvas.width, canvas.height);
      gl.uniform2f(uMouseLoc, mouseX, mouseY);

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(aPosLoc);
      gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [opacity, theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 transition-opacity duration-700"
    />
  );
};
