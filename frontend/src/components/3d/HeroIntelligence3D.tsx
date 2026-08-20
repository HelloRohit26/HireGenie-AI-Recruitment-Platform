import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface HeroIntelligence3DProps {
  parallaxX?: number;
  parallaxY?: number;
}

export const HeroIntelligence3D: React.FC<HeroIntelligence3DProps> = ({
  parallaxX = 0,
  parallaxY = 0
}) => {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setWebglFailed(true);
      return;
    }

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    if (!gl) {
      setWebglFailed(true);
      return;
    }

    let animationFrameId: number;

    const vsSource = `
      attribute vec2 a_position;
      attribute vec3 a_color;
      attribute float a_size;
      uniform vec2 u_resolution;
      uniform vec2 u_parallax;
      varying vec3 v_color;

      void main() {
        vec2 pos = a_position + u_parallax * 0.05;
        vec2 zeroToOne = pos / u_resolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        gl_PointSize = a_size;
        v_color = v_color;
      }
    `;

    const fsSource = `
      precision mediump float;
      varying vec3 v_color;
      uniform float u_time;
      uniform float u_is_dark;

      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        if (dist > 0.5) discard;
        float alpha = (1.0 - smoothstep(0.2, 0.5, dist));
        vec3 finalColor = u_is_dark > 0.5 ? v_color : v_color * 0.75;
        gl_FragColor = vec4(finalColor, alpha * 0.85);
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
    if (!vertShader || !fragShader) {
      setWebglFailed(true);
      return;
    }

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionLoc = gl.getAttribLocation(program, 'a_position');
    const colorLoc = gl.getAttribLocation(program, 'a_color');
    const sizeLoc = gl.getAttribLocation(program, 'a_size');
    const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');
    const parallaxLoc = gl.getUniformLocation(program, 'u_parallax');
    const timeLoc = gl.getUniformLocation(program, 'u_time');
    const isDarkLoc = gl.getUniformLocation(program, 'u_is_dark');

    // Create 45 dynamic recruitment network nodes (Candidates, Skills, Agents)
    const nodeCount = 45;
    const nodes = Array.from({ length: nodeCount }, (_, i) => ({
      x: Math.random() * 800,
      y: Math.random() * 500,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      size: Math.random() * 6 + 4,
      type: i % 3 // 0: Candidate (Brass), 1: Skill (Sage), 2: Agent (Slate)
    }));

    const positionBuffer = gl.createBuffer();
    const colorBuffer = gl.createBuffer();
    const sizeBuffer = gl.createBuffer();

    const resize = () => {
      if (!canvas) return;
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
    };

    let startTime = Date.now();

    const render = () => {
      resize();
      const width = canvas.width || 800;
      const height = canvas.height || 500;
      const time = (Date.now() - startTime) * 0.001;

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      gl.useProgram(program);
      gl.uniform2f(resolutionLoc, width, height);
      gl.uniform2f(parallaxLoc, parallaxX, parallaxY);
      gl.uniform1f(timeLoc, time);
      gl.uniform1f(isDarkLoc, theme === 'dark' ? 1.0 : 0.0);

      // Update positions
      const positions: number[] = [];
      const colors: number[] = [];
      const sizes: number[] = [];

      nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        positions.push(node.x, node.y);
        sizes.push(node.size);

        if (theme === 'dark') {
          if (node.type === 0) colors.push(0.78, 0.66, 0.42); // Brass (#C7A86B)
          else if (node.type === 1) colors.push(0.51, 0.59, 0.48); // Sage (#82977B)
          else colors.push(0.44, 0.52, 0.60); // Slate (#71849A)
        } else {
          if (node.type === 0) colors.push(0.65, 0.48, 0.18);
          else if (node.type === 1) colors.push(0.32, 0.48, 0.30);
          else colors.push(0.28, 0.38, 0.50);
        }
      });

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(colorLoc);
      gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(sizeLoc);
      gl.vertexAttribPointer(sizeLoc, 1, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.POINTS, 0, nodeCount);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme, parallaxX, parallaxY]);

  if (webglFailed) {
    // 2D SVG / CSS Connected Intelligence Network Fallback
    return (
      <div className="absolute inset-0 pointer-events-none opacity-30 flex items-center justify-center">
        <svg className="w-full h-full" viewBox="0 0 800 500">
          <circle cx="200" cy="150" r="6" fill="#C7A86B" className="animate-pulse" />
          <circle cx="400" cy="250" r="8" fill="#82977B" />
          <circle cx="600" cy="180" r="7" fill="#71849A" className="animate-pulse" />
          <line x1="200" y1="150" x2="400" y2="250" stroke="#C7A86B" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="400" y1="250" x2="600" y2="180" stroke="#82977B" strokeWidth="1" strokeDasharray="4 4" />
        </svg>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 transition-opacity duration-700"
      style={{ opacity: theme === 'dark' ? 0.6 : 0.35 }}
    />
  );
};
