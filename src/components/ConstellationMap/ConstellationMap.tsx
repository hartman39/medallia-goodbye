import React, { useEffect, useRef, useState } from 'react';
import { Connection } from '../../utils/csvParser';

interface ConstellationMapProps {
  connections: Connection[];
}

interface ConnectionNode {
  id: string;
  x: number;
  y: number;
  connection: Connection;
  department: string;
  year: number;
  radius: number;
  opacity: number;
  targetOpacity: number;
}

const ConstellationMap: React.FC<ConstellationMapProps> = ({ connections }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const nodesRef = useRef<ConnectionNode[]>([]);
  const [hoveredNode, setHoveredNode] = useState<ConnectionNode | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  // Department colors with better palette
  const departmentColors = {
    'engineering': '#3B82F6',     // Blue
    'product': '#8B5CF6',         // Purple
    'design': '#EC4899',          // Pink
    'sales': '#10B981',           // Green
    'marketing': '#F59E0B',       // Orange
    'data': '#06B6D4',           // Cyan
    'customer success': '#84CC16', // Lime
    'operations': '#F97316',      // Orange-red
    'hr': '#A855F7',             // Violet
    'finance': '#059669',        // Emerald
    'other': '#6B7280'           // Gray
  };

  const getDepartment = (connection: Connection): string => {
    return connection.department || 'other';
  };

  const getConnectionYear = (connection: Connection): number => {
    return connection.connectedDate.getFullYear();
  };

  const initializeNodes = () => {
    const canvas = canvasRef.current;
    if (!canvas || connections.length === 0) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 80;

    // Group by year and department for better positioning
    const yearGroups: Record<number, Connection[]> = {};
    connections.forEach(conn => {
      const year = getConnectionYear(conn);
      if (!yearGroups[year]) yearGroups[year] = [];
      yearGroups[year].push(conn);
    });

    const years = Object.keys(yearGroups).map(Number).sort();
    const yearSpacing = (width - padding * 2) / Math.max(1, years.length - 1);

    const nodes: ConnectionNode[] = [];

    years.forEach((year, yearIndex) => {
      const yearConnections = yearGroups[year];

      // Group by department within each year
      const deptGroups: Record<string, Connection[]> = {};
      yearConnections.forEach(conn => {
        const dept = getDepartment(conn);
        if (!deptGroups[dept]) deptGroups[dept] = [];
        deptGroups[dept].push(conn);
      });

      const departments = Object.keys(deptGroups);
      const baseX = padding + yearIndex * yearSpacing;

      departments.forEach((dept, deptIndex) => {
        const deptConnections = deptGroups[dept];
        const deptHeight = height - padding * 2;
        const deptSpacing = deptHeight / Math.max(1, departments.length);
        const baseY = padding + deptIndex * deptSpacing;

        deptConnections.forEach((conn, connIndex) => {
          // Arrange connections in a small cluster within department area
          const clusterSize = Math.min(120, deptSpacing * 0.8);
          const cols = Math.ceil(Math.sqrt(deptConnections.length));
          const rows = Math.ceil(deptConnections.length / cols);

          const col = connIndex % cols;
          const row = Math.floor(connIndex / cols);

          const offsetX = (col - (cols - 1) / 2) * (clusterSize / cols);
          const offsetY = (row - (rows - 1) / 2) * (clusterSize / rows);

          // Add some randomness for organic feel
          const jitterX = (Math.random() - 0.5) * 20;
          const jitterY = (Math.random() - 0.5) * 20;

          nodes.push({
            id: conn.id,
            x: baseX + offsetX + jitterX,
            y: baseY + offsetY + jitterY,
            connection: conn,
            department: dept,
            year,
            radius: 3,
            opacity: 0.8,
            targetOpacity: 0.8
          });
        });
      });
    });

    nodesRef.current = nodes;
  };

  const updateNodeVisibility = () => {
    nodesRef.current.forEach(node => {
      let visible = true;

      if (selectedYear !== 'all' && node.year !== selectedYear) {
        visible = false;
      }

      if (selectedDepartment !== 'all' && node.department !== selectedDepartment) {
        visible = false;
      }

      node.targetOpacity = visible ? 0.8 : 0.1;
    });
  };

  const drawTimeline = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const years = Array.from(new Set(connections.map(getConnectionYear))).sort();
    const padding = 80;
    const yearSpacing = (canvas.width - padding * 2) / Math.max(1, years.length - 1);

    // Draw year labels and vertical guides
    ctx.font = '14px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';

    years.forEach((year, index) => {
      const x = padding + index * yearSpacing;

      // Vertical guide line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, canvas.height - padding);
      ctx.stroke();

      // Year label
      ctx.fillStyle = selectedYear === year ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)';
      ctx.fillText(year.toString(), x, canvas.height - 20);
    });
  };

  const drawDepartmentLegend = (ctx: CanvasRenderingContext2D) => {
    const departments = Array.from(new Set(connections.map(getDepartment)));
    const legendX = 20;
    let legendY = 100;

    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';

    departments.forEach(dept => {
      const count = connections.filter(c => getDepartment(c) === dept).length;
      const color = departmentColors[dept as keyof typeof departmentColors] || departmentColors.other;

      // Department dot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(legendX + 8, legendY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Department label
      const isSelected = selectedDepartment === dept;
      ctx.fillStyle = isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(`${dept} (${count})`, legendX + 20, legendY + 4);

      legendY += 25;
    });
  };

  const drawConnections = (ctx: CanvasRenderingContext2D) => {
    // Draw subtle connections between nearby nodes of same department
    for (let i = 0; i < nodesRef.current.length; i++) {
      const node1 = nodesRef.current[i];
      if (node1.opacity < 0.3) continue;

      for (let j = i + 1; j < nodesRef.current.length; j++) {
        const node2 = nodesRef.current[j];
        if (node2.opacity < 0.3 || node1.department !== node2.department) continue;

        const dx = node2.x - node1.x;
        const dy = node2.y - node1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 80) {
          const color = departmentColors[node1.department as keyof typeof departmentColors] || departmentColors.other;
          const opacity = (80 - distance) / 80 * 0.2 * Math.min(node1.opacity, node2.opacity);

          ctx.strokeStyle = color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(node1.x, node1.y);
          ctx.lineTo(node2.x, node2.y);
          ctx.stroke();
        }
      }
    }
  };

  const drawNodes = (ctx: CanvasRenderingContext2D) => {
    nodesRef.current.forEach(node => {
      // Animate opacity
      const diff = node.targetOpacity - node.opacity;
      node.opacity += diff * 0.1;

      if (node.opacity < 0.05) return;

      const color = departmentColors[node.department as keyof typeof departmentColors] || departmentColors.other;
      const isHovered = hoveredNode?.id === node.id;
      const radius = isHovered ? node.radius * 1.5 : node.radius;

      // Glow effect for hovered node
      if (isHovered) {
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius * 3);
        gradient.addColorStop(0, color + '80');
        gradient.addColorStop(1, color + '00');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Main node
      ctx.fillStyle = color + Math.floor(node.opacity * 255).toString(16).padStart(2, '0');
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Highlight ring for hovered
      if (isHovered) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  };

  const animate = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear with dark background
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawTimeline(ctx);
    drawConnections(ctx);
    drawNodes(ctx);
    drawDepartmentLegend(ctx);

    animationRef.current = requestAnimationFrame(animate);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const hoveredNode = nodesRef.current.find(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) < node.radius * 2 && node.opacity > 0.3;
    });

    setHoveredNode(hoveredNode || null);
  };

  const handleYearClick = (year: number | 'all') => {
    setSelectedYear(year);
  };

  const handleDepartmentClick = (dept: string) => {
    setSelectedDepartment(selectedDepartment === dept ? 'all' : dept);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initializeNodes();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [connections]);

  useEffect(() => {
    updateNodeVisibility();
  }, [selectedYear, selectedDepartment]);

  const years = Array.from(new Set(connections.map(getConnectionYear))).sort();
  const departments = Array.from(new Set(connections.map(getDepartment)));

  return (
    <div className="fixed inset-0 bg-slate-900 overflow-hidden">
      {/* Top Controls */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-black bg-opacity-50 backdrop-blur-sm rounded-lg p-4 text-white">
          <h3 className="text-lg font-semibold mb-3 text-center">Connection Constellation</h3>
          <div className="flex gap-2 flex-wrap justify-center">
            <button
              onClick={() => handleYearClick('all')}
              className={`px-3 py-1 rounded text-sm ${
                selectedYear === 'all' ? 'bg-white bg-opacity-20' : 'bg-white bg-opacity-10 hover:bg-opacity-15'
              }`}
            >
              All Years
            </button>
            {years.map(year => (
              <button
                key={year}
                onClick={() => handleYearClick(year)}
                className={`px-3 py-1 rounded text-sm ${
                  selectedYear === year ? 'bg-white bg-opacity-20' : 'bg-white bg-opacity-10 hover:bg-opacity-15'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Department Legend - Clickable */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-black bg-opacity-50 backdrop-blur-sm rounded-lg p-4 text-white max-h-96 overflow-y-auto">
          <h4 className="text-sm font-semibold mb-3">Departments</h4>
          <div className="space-y-2">
            <button
              onClick={() => setSelectedDepartment('all')}
              className={`block w-full text-left px-2 py-1 rounded text-sm ${
                selectedDepartment === 'all' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
              }`}
            >
              All ({connections.length})
            </button>
            {departments.map(dept => {
              const count = connections.filter(c => getDepartment(c) === dept).length;
              const color = departmentColors[dept as keyof typeof departmentColors] || departmentColors.other;
              return (
                <button
                  key={dept}
                  onClick={() => handleDepartmentClick(dept)}
                  className={`block w-full text-left px-2 py-1 rounded text-sm ${
                    selectedDepartment === dept ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  <span
                    className="inline-block w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: color }}
                  ></span>
                  {dept} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredNode && (
        <div className="absolute z-20 bg-black bg-opacity-90 text-white p-3 rounded-lg pointer-events-none max-w-xs">
          <div className="font-semibold">
            {hoveredNode.connection.firstName} {hoveredNode.connection.lastName}
          </div>
          <div className="text-sm text-gray-300">{hoveredNode.connection.position}</div>
          <div className="text-sm text-gray-400">{hoveredNode.connection.company}</div>
          <div className="text-xs text-gray-500 mt-1">
            Connected: {hoveredNode.connection.connectedDate.toLocaleDateString()}
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onMouseMove={handleMouseMove}
      />
    </div>
  );
};

export default ConstellationMap;