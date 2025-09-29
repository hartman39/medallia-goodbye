import React, { useEffect, useRef, useState } from 'react';
import { Connection } from '../../utils/csvParser';

interface ConnectionGalaxyProps {
  connections: Connection[];
}

interface Star {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hue: number;
  brightness: number;
  pulsePhase: number;
  connection: Connection;
  department: string;
}

const ConnectionGalaxy: React.FC<ConnectionGalaxyProps> = ({ connections }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const starsRef = useRef<Star[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [hoveredStar, setHoveredStar] = useState<Star | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  // Color palette for departments
  const departmentColors = {
    'engineering': 60,    // Cyan/Blue
    'product': 280,       // Purple
    'design': 320,        // Pink
    'sales': 120,         // Green
    'marketing': 30,      // Orange
    'data': 200,          // Blue
    'customer success': 180, // Light Blue
    'operations': 45,     // Yellow
    'hr': 300,           // Magenta
    'finance': 150,      // Teal
    'other': 0           // Red
  };

  const getDepartment = (connection: Connection): string => {
    return connection.department || 'other';
  };

  const initializeStars = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width;
    const height = canvas.height;

    starsRef.current = connections.map(connection => {
      const department = getDepartment(connection);
      const hue = departmentColors[department as keyof typeof departmentColors] || 0;

      // Create clusters for departments
      const clusterAngle = (hue / 360) * 2 * Math.PI;
      const clusterRadius = Math.min(width, height) * 0.3;
      const clusterX = width / 2 + Math.cos(clusterAngle) * clusterRadius * (0.5 + Math.random() * 0.5);
      const clusterY = height / 2 + Math.sin(clusterAngle) * clusterRadius * (0.5 + Math.random() * 0.5);

      // Add some randomness around cluster center
      const offsetX = (Math.random() - 0.5) * 200;
      const offsetY = (Math.random() - 0.5) * 200;

      return {
        id: connection.id,
        x: Math.max(50, Math.min(width - 50, clusterX + offsetX)),
        y: Math.max(50, Math.min(height - 50, clusterY + offsetY)),
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: 2 + Math.random() * 3,
        hue,
        brightness: 70 + Math.random() * 30,
        pulsePhase: Math.random() * Math.PI * 2,
        connection,
        department
      };
    });
  };

  const drawStar = (ctx: CanvasRenderingContext2D, star: Star, time: number) => {
    const pulse = Math.sin(time * 0.003 + star.pulsePhase) * 0.3 + 0.7;
    const size = star.size * pulse;
    const brightness = star.brightness * pulse;

    // Filter by department
    if (selectedDepartment !== 'all' && star.department !== selectedDepartment) {
      ctx.globalAlpha = 0.1;
    } else {
      ctx.globalAlpha = 0.8;
    }

    // Glow effect
    const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, size * 3);
    gradient.addColorStop(0, `hsla(${star.hue}, 100%, ${brightness}%, 0.8)`);
    gradient.addColorStop(0.3, `hsla(${star.hue}, 100%, ${brightness * 0.7}%, 0.4)`);
    gradient.addColorStop(1, `hsla(${star.hue}, 100%, ${brightness * 0.5}%, 0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(star.x, star.y, size * 3, 0, Math.PI * 2);
    ctx.fill();

    // Core star
    ctx.fillStyle = `hsl(${star.hue}, 100%, ${Math.min(100, brightness + 20)}%)`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, size, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
  };

  const drawConnections = (ctx: CanvasRenderingContext2D) => {
    // Draw constellation lines between nearby stars of same department
    for (let i = 0; i < starsRef.current.length; i++) {
      const star1 = starsRef.current[i];
      if (selectedDepartment !== 'all' && star1.department !== selectedDepartment) continue;

      for (let j = i + 1; j < starsRef.current.length; j++) {
        const star2 = starsRef.current[j];
        if (star1.department !== star2.department) continue;
        if (selectedDepartment !== 'all' && star2.department !== selectedDepartment) continue;

        const dx = star2.x - star1.x;
        const dy = star2.y - star1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 150) {
          const opacity = (150 - distance) / 150 * 0.3;
          ctx.strokeStyle = `hsla(${star1.hue}, 50%, 70%, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(star1.x, star1.y);
          ctx.lineTo(star2.x, star2.y);
          ctx.stroke();
        }
      }
    }
  };

  const animate = (time: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas with fade effect
    ctx.fillStyle = 'rgba(10, 15, 35, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw stars
    starsRef.current.forEach(star => {
      // Gentle movement
      star.x += star.vx;
      star.y += star.vy;

      // Bounce off edges
      if (star.x < 0 || star.x > canvas.width) star.vx *= -1;
      if (star.y < 0 || star.y > canvas.height) star.vy *= -1;

      // Mouse attraction/repulsion
      const dx = mouseRef.current.x - star.x;
      const dy = mouseRef.current.y - star.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 100) {
        const force = (100 - distance) / 100 * 0.02;
        star.vx += dx * force * 0.01;
        star.vy += dy * force * 0.01;
      }

      // Damping
      star.vx *= 0.999;
      star.vy *= 0.999;
    });

    // Draw constellation lines first
    drawConnections(ctx);

    // Draw stars
    starsRef.current.forEach(star => {
      drawStar(ctx, star, time);
    });

    animationRef.current = requestAnimationFrame(animate);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    mouseRef.current = { x, y };

    // Find hovered star
    const hoveredStar = starsRef.current.find(star => {
      const dx = x - star.x;
      const dy = y - star.y;
      return Math.sqrt(dx * dx + dy * dy) < star.size * 3;
    });

    setHoveredStar(hoveredStar || null);
  };

  const getDepartmentCounts = () => {
    const counts: Record<string, number> = {};
    connections.forEach(conn => {
      const dept = getDepartment(conn);
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return counts;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initializeStars();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initial background
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgb(10, 15, 35)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [connections, selectedDepartment]);

  const departmentCounts = getDepartmentCounts();

  return (
    <div className="fixed inset-0 bg-gray-900 overflow-hidden">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-black bg-opacity-50 backdrop-blur-sm rounded-lg p-4 text-white">
          <h3 className="text-lg font-semibold mb-3">Connection Galaxy</h3>
          <div className="space-y-2">
            <button
              onClick={() => setSelectedDepartment('all')}
              className={`block w-full text-left px-3 py-1 rounded ${
                selectedDepartment === 'all' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
              }`}
            >
              All Departments ({connections.length})
            </button>
            {Object.entries(departmentCounts)
              .sort(([,a], [,b]) => b - a)
              .map(([dept, count]) => (
              <button
                key={dept}
                onClick={() => setSelectedDepartment(dept)}
                className={`block w-full text-left px-3 py-1 rounded ${
                  selectedDepartment === dept ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <span
                  className="inline-block w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: `hsl(${departmentColors[dept as keyof typeof departmentColors] || 0}, 70%, 60%)` }}
                ></span>
                {dept} ({count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredStar && (
        <div
          className="absolute z-20 bg-black bg-opacity-80 text-white p-3 rounded-lg pointer-events-none"
          style={{
            left: mouseRef.current.x + 10,
            top: mouseRef.current.y - 10,
            transform: 'translate(0, -100%)'
          }}
        >
          <div className="font-semibold">
            {hoveredStar.connection.firstName} {hoveredStar.connection.lastName}
          </div>
          <div className="text-sm text-gray-300">{hoveredStar.connection.position}</div>
          <div className="text-sm text-gray-400">{hoveredStar.connection.company}</div>
          <div className="text-xs text-gray-500 mt-1">
            {hoveredStar.connection.connectedDate.toLocaleDateString()}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="bg-black bg-opacity-50 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
          <div>🖱️ Move mouse to interact with stars</div>
          <div>✨ Each star represents a Medallia colleague</div>
          <div>🌈 Colors represent departments</div>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onMouseMove={handleMouseMove}
      />
    </div>
  );
};

export default ConnectionGalaxy;