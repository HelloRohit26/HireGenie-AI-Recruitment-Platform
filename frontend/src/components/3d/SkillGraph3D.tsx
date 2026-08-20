import React, { useEffect, useRef, useState } from 'react';
import { CandidateSkill } from '../../types';

interface SkillGraph3DProps {
  candidateName?: string;
  skills?: CandidateSkill[];
  size?: number;
}

export const SkillGraph3D: React.FC<SkillGraph3DProps> = ({
  candidateName = 'Candidate',
  skills = [],
  size = 360
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeHoverNode, setActiveHoverNode] = useState<string | null>(null);

  const displaySkills = skills.length > 0 ? skills : [
    { name: 'PyTorch', score: 95, matched: true },
    { name: 'Transformers', score: 92, matched: true },
    { name: 'Python', score: 98, matched: true },
    { name: 'MLOps', score: 85, matched: true },
    { name: 'Kubernetes', score: 60, matched: false }
  ];

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

    // Compile Fragment Shader
    const fsSource = `
      precision mediump float;
      uniform float uTime;
      uniform vec3 uColor;
      varying vec3 vNormal;

      void main() {
        vec3 normal = normalize(vNormal);
        float light = max(dot(normal, vec3(0.5, 0.7, 1.0)), 0.3);
        gl_FragColor = vec4(uColor * light, 0.9);
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

    // Sphere Mesh Buffer Generator
    const createSphere = (radius: number, segments: number) => {
      const verts: number[] = [];
      for (let i = 0; i <= segments; i++) {
        const lat = (Math.PI * i) / segments;
        for (let j = 0; j <= segments; j++) {
          const lon = (2 * Math.PI * j) / segments;
          const x = radius * Math.sin(lat) * Math.cos(lon);
          const y = radius * Math.cos(lat);
          const z = radius * Math.sin(lat) * Math.sin(lon);
          verts.push(x, y, z);
        }
      }
      return new Float32Array(verts);
    };

    const sphereVerts = createSphere(0.25, 12);
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, sphereVerts, gl.STATIC_DRAW);

    const aPositionLoc = gl.getAttribLocation(program, 'aPosition');
    const aNormalLoc = gl.getAttribLocation(program, 'aNormal');
    const uTimeLoc = gl.getUniformLocation(program, 'uTime');
    const uColorLoc = gl.getUniformLocation(program, 'uColor');
    const uMVMatrixLoc = gl.getUniformLocation(program, 'uModelViewMatrix');
    const uProjMatrixLoc = gl.getUniformLocation(program, 'uProjectionMatrix');

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

    const render = () => {
      if (!canvas) return;
      const width = canvas.width;
      const height = canvas.height;
      gl.viewport(0, 0, width, height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const currentTime = (performance.now() - startTime) * 0.001;
      const projMatrix = perspective(Math.PI / 4, width / height, 0.1, 100.0);

      // Model View Matrix with Orbital Rotation
      const rotY = currentTime * 0.3;
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);

      const mvMatrix = new Float32Array([
        cosY, 0, -sinY, 0,
        0, 1, 0, 0,
        sinY, 0, cosY, 0,
        0, 0, -4.5, 1
      ]);

      gl.useProgram(program);
      gl.uniform1f(uTimeLoc, currentTime);
      gl.uniform3f(uColorLoc, 0.78, 0.66, 0.42); // Muted Brass #C7A86B

      gl.uniformMatrix4fv(uProjMatrixLoc, false, projMatrix);
      gl.uniformMatrix4fv(uMVMatrixLoc, false, mvMatrix);

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(aPositionLoc, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(aPositionLoc);

      gl.vertexAttribPointer(aNormalLoc, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(aNormalLoc);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, sphereVerts.length / 3);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [skills]);

  return (
    <div className="relative flex items-center justify-center bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 overflow-hidden theme-transition" style={{ width: '100%', height: size }}>
      
      {/* Native WebGL Canvas */}
      <canvas
        ref={canvasRef}
        width={400}
        height={320}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* Central Node Badge */}
      <div className="relative z-20 w-16 h-16 rounded-full bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)] text-[var(--accent-primary)] flex flex-col items-center justify-center font-bold font-mono text-[10px] shadow-lg shadow-[var(--accent-primary)]/20">
        <span>CORE</span>
        <span className="text-[8px] opacity-80">AI VECTOR</span>
      </div>

      {/* Orbiting Satellite Skill Badges */}
      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
        {displaySkills.map((skill, idx) => {
          const angle = (idx / displaySkills.length) * Math.PI * 2;
          const radius = 110;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const isHovered = activeHoverNode === skill.name;

          return (
            <div
              key={skill.name}
              onMouseEnter={() => setActiveHoverNode(skill.name)}
              onMouseLeave={() => setActiveHoverNode(null)}
              style={{
                transform: `translate(${x}px, ${y}px)`
              }}
              className={`absolute px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border transition-all pointer-events-auto cursor-pointer ${
                skill.matched
                  ? isHovered
                    ? 'bg-[var(--accent-secondary)] text-[var(--bg-primary)] border-[var(--accent-secondary)] scale-110 shadow-md'
                    : 'bg-[var(--accent-secondary)]/20 text-[var(--accent-secondary)] border-[var(--accent-secondary)]/40 hover:bg-[var(--accent-secondary)]/40'
                  : 'bg-[var(--surface-elevated)] text-[var(--text-muted)] border-[var(--border)]'
              }`}
            >
              {skill.name} ({skill.score}%)
            </div>
          );
        })}
      </div>

      {/* Top Header Overlay */}
      <div className="absolute top-3 left-4 z-30 font-mono text-[10px] text-[var(--text-secondary)]">
        <span className="text-[var(--accent-primary)] font-bold">3D Skill Knowledge Graph</span> • {displaySkills.length} Competency Nodes
      </div>
    </div>
  );
};
