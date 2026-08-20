import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface AgentNode {
  id: string;
  name: string;
  stage: string;
  xRatio: number;
  yRatio: number;
  colorDark: string;
  colorLight: string;
}

const AGENT_NODES: AgentNode[] = [
  { id: 'parser', name: 'Resume Parser', stage: 'Stage 1: Document Extraction', xRatio: 0.12, yRatio: 0.5, colorDark: '#C7A86B', colorLight: '#9A7738' },
  { id: 'matcher', name: 'Skill Matcher', stage: 'Stage 2: Vector Embedding', xRatio: 0.32, yRatio: 0.35, colorDark: '#82977B', colorLight: '#627B67' },
  { id: 'ranker', name: 'Candidate Ranker', stage: 'Stage 3: Multi-Criteria Ranking', xRatio: 0.52, yRatio: 0.65, colorDark: '#71849A', colorLight: '#5D7185' },
  { id: 'voice', name: 'Voice Interviewer', stage: 'Stage 4: Autonomous WebRTC', xRatio: 0.72, yRatio: 0.35, colorDark: '#C7A86B', colorLight: '#9A7738' },
  { id: 'evaluator', name: 'Evaluation Agent', stage: 'Stage 5: Shortlist Dossier', xRatio: 0.90, yRatio: 0.5, colorDark: '#7D9B78', colorLight: '#4D7B48' }
];

interface CandidatePacket {
  id: string;
  candidateName: string;
  score: number;
  progress: number; // 0 to 1 along the 5-agent pipeline path
  speed: number;
  currentAgentIndex: number;
}

const CANDIDATE_NAMES = [
  'Priya Sharma', 'Alex Chen', 'Aisha Patel', 'Marcus Vance',
  'Elena Rostova', 'David Kim', 'Sophia Martinez', 'Liam O\'Connor'
];

interface HireGenieIntelligenceSceneProps {
  parallaxX?: number;
  parallaxY?: number;
  onHoverAgent?: (agentId: string | null) => void;
}

export const HireGenieIntelligenceScene: React.FC<HireGenieIntelligenceSceneProps> = ({
  parallaxX = 0,
  parallaxY = 0,
  onHoverAgent
}) => {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredNode, setHoveredNode] = useState<AgentNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    // Continuous candidate packet pool
    const packets: CandidatePacket[] = Array.from({ length: 7 }, (_, i) => ({
      id: `packet-${i}`,
      candidateName: CANDIDATE_NAMES[i % CANDIDATE_NAMES.length],
      score: 85 + Math.floor(Math.random() * 12),
      progress: (i / 7), // stagger positions
      speed: 0.0015 + Math.random() * 0.001,
      currentAgentIndex: Math.floor((i / 7) * 4)
    }));

    let pulseTime = 0;

    const render = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      pulseTime += 0.03;
      ctx.clearRect(0, 0, width, height);

      // Compute agent screen coordinates with parallax tilt offset
      const agentCoords = AGENT_NODES.map(agent => ({
        ...agent,
        cx: agent.xRatio * width + parallaxX * (agent.xRatio - 0.5) * 1.5,
        cy: agent.yRatio * height + parallaxY * (agent.yRatio - 0.5) * 1.5
      }));

      const isDark = theme === 'dark';

      // 1. DRAW ANIMATED PIPELINE BEZIER CONNECTORS
      for (let i = 0; i < agentCoords.length - 1; i++) {
        const start = agentCoords[i];
        const end = agentCoords[i + 1];

        const cp1x = start.cx + (end.cx - start.cx) * 0.5;
        const cp1y = start.cy;
        const cp2x = start.cx + (end.cx - start.cx) * 0.5;
        const cp2y = end.cy;

        // Base pipeline path line
        ctx.beginPath();
        ctx.moveTo(start.cx, start.cy);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, end.cx, end.cy);
        ctx.strokeStyle = isDark ? 'rgba(220, 214, 190, 0.15)' : 'rgba(35, 37, 31, 0.12)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Moving pulse flow line along Bezier
        ctx.beginPath();
        ctx.setLineDash([8, 16]);
        ctx.lineDashOffset = -pulseTime * 20;
        ctx.moveTo(start.cx, start.cy);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, end.cx, end.cy);
        ctx.strokeStyle = isDark ? '#C7A86B' : '#9A7738';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]); // reset dash
      }

      // 2. ANIMATE CANDIDATE DATA PACKETS ALONG PATH
      packets.forEach(p => {
        p.progress += p.speed;
        if (p.progress >= 1) {
          p.progress = 0;
          p.score = 85 + Math.floor(Math.random() * 12);
        }

        // Calculate point on multi-segment Bezier curve
        const segmentCount = agentCoords.length - 1;
        const totalScaled = p.progress * segmentCount;
        const segIndex = Math.min(Math.floor(totalScaled), segmentCount - 1);
        const segT = totalScaled - segIndex;

        const p0 = agentCoords[segIndex];
        const p3 = agentCoords[segIndex + 1];
        const p1 = { x: p0.cx + (p3.cx - p0.cx) * 0.5, y: p0.cy };
        const p2 = { x: p0.cx + (p3.cx - p0.cx) * 0.5, y: p3.cy };

        // Cubic Bezier formula: (1-t)^3 p0 + 3(1-t)^2 t p1 + 3(1-t) t^2 p2 + t^3 p3
        const oneMinusT = 1 - segT;
        const px = Math.pow(oneMinusT, 3) * p0.cx +
                   3 * Math.pow(oneMinusT, 2) * segT * p1.x +
                   3 * oneMinusT * Math.pow(segT, 2) * p2.x +
                   Math.pow(segT, 3) * p3.cx;
        const py = Math.pow(oneMinusT, 3) * p0.cy +
                   3 * Math.pow(oneMinusT, 2) * segT * p1.y +
                   3 * oneMinusT * Math.pow(segT, 2) * p2.y +
                   Math.pow(segT, 3) * p3.cy;

        // Draw glowing candidate packet node
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? '#82977B' : '#627B67';
        ctx.shadowColor = isDark ? '#82977B' : '#627B67';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0; // reset

        // Candidate Label Badge floating next to node
        ctx.font = '10px monospace';
        ctx.fillStyle = isDark ? 'rgba(232, 229, 218, 0.85)' : 'rgba(37, 39, 32, 0.85)';
        ctx.fillText(`${p.candidateName} (${p.score}%)`, px + 8, py - 6);
      });

      // 3. DRAW AGENT NODES & PULSING RINGS
      agentCoords.forEach(agent => {
        const isHovered = hoveredNode?.id === agent.id;
        const nodeColor = isDark ? agent.colorDark : agent.colorLight;

        // Outer pulsing ring
        const ringRadius = 18 + Math.sin(pulseTime * 2 + agent.xRatio * 10) * 4;
        ctx.beginPath();
        ctx.arc(agent.cx, agent.cy, isHovered ? ringRadius + 6 : ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = nodeColor;
        ctx.lineWidth = isHovered ? 2 : 1;
        ctx.globalAlpha = isHovered ? 0.8 : 0.35;
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // Core Solid Node
        ctx.beginPath();
        ctx.arc(agent.cx, agent.cy, isHovered ? 12 : 9, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor;
        ctx.shadowColor = nodeColor;
        ctx.shadowBlur = isHovered ? 18 : 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Inner Core Dot
        ctx.beginPath();
        ctx.arc(agent.cx, agent.cy, 3, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? '#171815' : '#FFFFFF';
        ctx.fill();

        // Agent Name Label
        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = isDark ? '#E8E5DA' : '#252720';
        ctx.textAlign = 'center';
        ctx.fillText(agent.name, agent.cx, agent.cy + (agent.yRatio > 0.5 ? 28 : -22));
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme, parallaxX, parallaxY, hoveredNode]);

  // Handle canvas mousemove for node hover detection
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    const hovered = AGENT_NODES.find(agent => {
      const cx = agent.xRatio * width + parallaxX * (agent.xRatio - 0.5) * 1.5;
      const cy = agent.yRatio * height + parallaxY * (agent.yRatio - 0.5) * 1.5;
      const dist = Math.hypot(mx - cx, my - cy);
      return dist < 24;
    });

    if (hovered) {
      setHoveredNode(hovered);
      setTooltipPos({ x: mx, y: my });
      onHoverAgent?.(hovered.id);
    } else {
      setHoveredNode(null);
      setTooltipPos(null);
      onHoverAgent?.(null);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[380px] sm:min-h-[460px]">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { setHoveredNode(null); setTooltipPos(null); onHoverAgent?.(null); }}
        className="w-full h-full block cursor-pointer transition-opacity duration-500"
      />

      {/* Floating Glass Tooltip on Node Hover */}
      {hoveredNode && tooltipPos && (
        <div
          className="absolute z-30 pointer-events-none p-3.5 rounded-xl bg-[var(--surface-elevated)]/95 border border-[var(--accent-primary)] shadow-2xl backdrop-blur-md text-xs space-y-1 transform -translate-x-1/2 -translate-y-full transition-all duration-150"
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y - 12}px` }}
        >
          <div className="font-bold text-[var(--accent-primary)] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
            {hoveredNode.name}
          </div>
          <div className="text-[10px] text-[var(--text-secondary)] font-mono">{hoveredNode.stage}</div>
          <div className="text-[9px] text-[var(--status-success)] font-mono pt-1 border-t border-[var(--border)]">
            ● Active • Processing live candidate stream
          </div>
        </div>
      )}
    </div>
  );
};
