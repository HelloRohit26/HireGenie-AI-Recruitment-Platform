import React, { useEffect, useRef } from 'react';

interface TalentConstellationProps {
  opacity?: number;
  interactive?: boolean;
  theme?: 'dark' | 'light';
  parallaxX?: number;
  parallaxY?: number;
}

export const TalentConstellation: React.FC<TalentConstellationProps> = ({ 
  opacity = 0.35,
  interactive = false,
  theme = 'dark',
  parallaxX = 0,
  parallaxY = 0
}) => {
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

    const vs = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Dynamic color uniforms: dark Warm Graphite vs light Soft Pearl
    const isDark = theme === 'dark';
    const bgR = isDark ? 0.09 : 0.93;
    const bgG = isDark ? 0.09 : 0.93;
    const bgB = isDark ? 0.08 : 0.91;

    const accentR = isDark ? 0.78 : 0.71;
    const accentG = isDark ? 0.66 : 0.58;
    const accentB = isDark ? 0.42 : 0.33;

    const fs = `
      precision highp float;
      varying vec2 v_texCoord;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_parallax;

      void main() {
        vec2 uv = v_texCoord + u_parallax * 0.015;
        vec2 p = (uv - 0.5) * (u_resolution.y / u_resolution.x);
        float t = u_time * 0.12;
        
        float col = 0.0;
        for(float i = 1.0; i < 4.0; i++) {
          vec2 q = p * (i * 2.2);
          q += vec2(sin(t + i), cos(t * 0.7 + i));
          float d = length(q);
          col += 0.0025 / (d + 0.04) * sin(t + i * 1.8);
        }

        vec3 bgColor = vec3(${bgR}, ${bgG}, ${bgB});
        vec3 accentColor = vec3(${accentR}, ${accentG}, ${accentB});

        vec3 finalColor = mix(bgColor, accentColor, clamp(col * 0.45, 0.0, 1.0));
        gl_FragColor = vec4(finalColor, ${opacity.toFixed(2)});
      }
    `;

    function createShader(glCtx: WebGLRenderingContext, type: number, source: string) {
      const shader = glCtx.createShader(type);
      if (!shader) return null;
      glCtx.shaderSource(shader, source);
      glCtx.compileShader(shader);
      return shader;
    }

    const vertShader = createShader(gl, gl.VERTEX_SHADER, vs);
    const fragShader = createShader(gl, gl.FRAGMENT_SHADER, fs);
    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,  1, -1, -1,  1,
      -1,  1,  1, -1,  1,  1,
    ]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const timeLoc = gl.getUniformLocation(program, "u_time");
    const resLoc = gl.getUniformLocation(program, "u_resolution");
    const parallaxLoc = gl.getUniformLocation(program, "u_parallax");

    function render(time: number) {
      if (!canvas || !gl) return;
      
      const width = canvas.clientWidth || window.innerWidth;
      const height = canvas.clientHeight || window.innerHeight;
      
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }

      gl.uniform1f(timeLoc, time * 0.001);
      gl.uniform2f(resLoc, width, height);
      gl.uniform2f(parallaxLoc, parallaxX, parallaxY);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameId = requestAnimationFrame(render);
    }

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [opacity, theme, parallaxX, parallaxY]);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block opacity-50 transition-opacity duration-700" 
      />
    </div>
  );
};
