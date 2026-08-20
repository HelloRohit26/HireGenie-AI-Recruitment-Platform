import React, { useEffect, useRef } from 'react';

interface VoiceCore3DProps {
  isSpeaking?: boolean;
  audioLevel?: number; // 0.0 to 1.0
  size?: number;
}

export const VoiceCore3D: React.FC<VoiceCore3DProps> = ({
  isSpeaking = false,
  audioLevel = 0.5,
  size = 320
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
    let startTime = performance.now();

    // Compile Vertex Shader
    const vsSource = `
      attribute vec3 aPosition;
      attribute vec3 aNormal;
      uniform mat4 uModelViewMatrix;
      uniform mat4 uProjectionMatrix;
      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        vNormal = aNormal;
        vPosition = aPosition;
        gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
      }
    `;

    // Compile Fragment Shader for Muted Brass Glow
    const fsSource = `
      precision mediump float;
      uniform float uTime;
      uniform float uAudioLevel;
      uniform vec3 uColor;
      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        vec3 normal = normalize(vNormal);
        float light = max(dot(normal, vec3(0.5, 0.7, 1.0)), 0.2);
        float pulse = 0.8 + 0.2 * sin(uTime * 3.0 + length(vPosition) * 4.0);
        vec3 color = uColor * light * pulse * (1.0 + uAudioLevel * 0.5);
        gl_FragColor = vec4(color, 0.85);
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

    // Build Icosahedron Wireframe Core Vertices
    const phi = (1 + Math.sqrt(5)) / 2;
    const rawVerts = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
    ];

    const vertices: number[] = [];
    rawVerts.forEach(v => {
      const len = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
      vertices.push((v[0]/len) * 0.75, (v[1]/len) * 0.75, (v[2]/len) * 0.75);
    });

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const aPositionLoc = gl.getAttribLocation(program, 'aPosition');
    const aNormalLoc = gl.getAttribLocation(program, 'aNormal');
    const uTimeLoc = gl.getUniformLocation(program, 'uTime');
    const uAudioLevelLoc = gl.getUniformLocation(program, 'uAudioLevel');
    const uColorLoc = gl.getUniformLocation(program, 'uColor');
    const uMVMatrixLoc = gl.getUniformLocation(program, 'uModelViewMatrix');
    const uProjMatrixLoc = gl.getUniformLocation(program, 'uProjectionMatrix');

    // Matrix Helper
    const perspective = (fovy: number, aspect: number, near: number, far: number) => {
      const f = 1.0 / Math.tan(fovy / 2);
      const nf = 1 / (near - far);
      return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, (2 * far * near) * nf, 0
      ]);
    };

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Render Loop
    const render = () => {
      if (!canvas) return;
      const width = canvas.width;
      const height = canvas.height;
      gl.viewport(0, 0, width, height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const currentTime = (performance.now() - startTime) * 0.001;
      const projMatrix = perspective(Math.PI / 4, width / height, 0.1, 100.0);

      // Model View Matrix with Rotation
      const rotY = currentTime * 0.5;
      const rotX = currentTime * 0.3;
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);

      const mvMatrix = new Float32Array([
        cosY, sinX * sinY, -cosX * sinY, 0,
        0, cosX, sinX, 0,
        sinY, -sinX * cosY, cosX * cosY, 0,
        0, 0, -3.5, 1
      ]);

      gl.useProgram(program);
      gl.uniform1f(uTimeLoc, currentTime);
      gl.uniform1f(uAudioLevelLoc, isSpeaking ? audioLevel : 0.2);
      gl.uniform3f(uColorLoc, 0.84, 0.66, 0.37); // Muted Brass #D6A85F

      gl.uniformMatrix4fv(uProjMatrixLoc, false, projMatrix);
      gl.uniformMatrix4fv(uMVMatrixLoc, false, mvMatrix);

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(aPositionLoc, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(aPositionLoc);

      gl.vertexAttribPointer(aNormalLoc, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(aNormalLoc);

      gl.drawArrays(gl.LINE_LOOP, 0, 12);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isSpeaking, audioLevel]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Native WebGL Canvas */}
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* Ambient Pulsing Rings Backing */}
      <div className="absolute inset-0 rounded-full border border-[#D6A85F]/20 animate-ping opacity-20 pointer-events-none" />
      <div className="absolute inset-4 rounded-full border border-[#79A89A]/30 animate-pulse opacity-30 pointer-events-none" />
    </div>
  );
};
