import React, { useEffect, useRef, useState } from 'react';

interface ScreeningStageMetric {
  stage: string;
  count: number;
  percentage: number;
  agent: string;
  status: 'completed' | 'processing' | 'queued';
}

interface ScreeningFunnel3DProps {
  metrics?: ScreeningStageMetric[];
  onStageClick?: (stageName: string) => void;
  size?: number;
}

export const ScreeningFunnel3D: React.FC<ScreeningFunnel3DProps> = ({
  metrics,
  onStageClick,
  size = 360
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredStage, setHoveredStage] = useState<ScreeningStageMetric | null>(null);

  const defaultMetrics: ScreeningStageMetric[] = metrics || [
    { stage: '1. Applicants Received', count: 10000, percentage: 100, agent: 'Ingestion Engine', status: 'completed' },
    { stage: '2. Resume Vector Parsing', count: 7842, percentage: 78.4, agent: 'ResumeParserAgent', status: 'completed' },
    { stage: '3. Skill Cosine Matching', count: 2431, percentage: 24.3, agent: 'SkillMatcherAgent', status: 'completed' },
    { stage: '4. Deterministic Ranking', count: 420, percentage: 4.2, agent: 'CandidateRankerAgent', status: 'processing' },
    { stage: '5. Top-N Shortlist', count: 20, percentage: 0.2, agent: 'ShortlistSelector', status: 'queued' }
  ];

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return;

    let animationFrameId: number;
    const startTime = performance.now();

    const vsSource = `
      attribute vec3 aPosition;
      uniform mat4 uModelViewMatrix;
      uniform mat4 uProjectionMatrix;
      void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
        gl_PointSize = 4.0;
      }
    `;

    const fsSource = `
      precision mediump float;
      uniform float uTime;
      uniform vec3 uColor;
      void main() {
        gl_FragColor = vec4(uColor, 0.85);
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

    // Particle Vertices for Funnel
    const particleCount = 200;
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const progress = i / particleCount;
      const radius = (1.0 - progress * 0.8) * 1.5;
      const angle = progress * Math.PI * 8;
      const y = (0.5 - progress) * 3.0;

      particlePositions[i * 3] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius;
    }

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, particlePositions, gl.STATIC_DRAW);

    const aPosLoc = gl.getAttribLocation(program, 'aPosition');
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

    const render = () => {
      if (!canvas) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const currentTime = (performance.now() - startTime) * 0.001;
      const projMatrix = perspective(Math.PI / 4, canvas.width / canvas.height, 0.1, 100.0);

      const rotY = currentTime * 0.4;
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);

      const mvMatrix = new Float32Array([
        cosY, 0, -sinY, 0,
        0, 1, 0, 0,
        sinY, 0, cosY, 0,
        0, 0, -4.2, 1
      ]);

      gl.useProgram(program);
      gl.uniform1f(uTimeLoc, currentTime);
      gl.uniform3f(uColorLoc, 0.78, 0.66, 0.42); // Muted Brass #C7A86B

      gl.uniformMatrix4fv(uProjMatrixLoc, false, projMatrix);
      gl.uniformMatrix4fv(uMVMatrixLoc, false, mvMatrix);

      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
      gl.enableVertexAttribArray(aPosLoc);
      gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.POINTS, 0, particleCount);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [metrics]);

  return (
    <div className="relative flex items-center justify-center bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 overflow-hidden theme-transition" style={{ width: '100%', height: size }}>
      
      {/* 3D WebGL Funnel Canvas */}
      <canvas
        ref={canvasRef}
        width={360}
        height={320}
        className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-70"
      />

      {/* Interactive Overlay Stage Cards */}
      <div className="relative z-20 w-full max-w-md space-y-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-mono font-bold text-[var(--accent-primary)] uppercase tracking-wider">
            3D Autonomous Funnel Pipeline
          </span>
          <span className="text-[9px] font-mono text-[var(--accent-secondary)]">
            10,000 → 20 Shortlist
          </span>
        </div>

        {defaultMetrics.map((item) => (
          <div
            key={item.stage}
            onClick={() => onStageClick?.(item.stage)}
            onMouseEnter={() => setHoveredStage(item)}
            onMouseLeave={() => setHoveredStage(null)}
            className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between backdrop-blur-md ${
              hoveredStage?.stage === item.stage
                ? 'bg-[var(--surface-elevated)] border-[var(--accent-primary)] text-[var(--text-primary)] shadow-md shadow-[var(--accent-primary)]/10'
                : 'bg-[var(--surface)]/90 border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]'
            }`}
          >
            <div>
              <div className="text-xs font-bold font-mono text-[var(--text-primary)]">{item.stage}</div>
              <div className="text-[9px] text-[var(--text-secondary)] font-mono">{item.agent}</div>
            </div>

            <div className="text-right font-mono">
              <span className="text-xs font-bold text-[var(--accent-primary)] block">{item.count.toLocaleString()}</span>
              <span className="text-[9px] text-[var(--accent-secondary)]">{item.percentage}% yield</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
