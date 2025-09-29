import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Connection } from '../../utils/csvParser';

interface NetworkNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  department?: string;
  position: string;
  year: number;
  size: number;
  color: string;
  connection: Connection;
}

interface NetworkLink extends d3.SimulationLinkDatum<NetworkNode> {
  source: string | NetworkNode;
  target: string | NetworkNode;
  strength: number;
}

interface NetworkGraphProps {
  connections: Connection[];
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({ connections }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null);

  useEffect(() => {
    if (!connections.length || !svgRef.current) return;

    // Clear previous render
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 600;

    svg.attr("width", width).attr("height", height);

    // Create container for zoom/pan
    const container = svg.append("g");

    // Prepare data
    const nodes: NetworkNode[] = connections.map((connection, index) => ({
      id: connection.id,
      name: `${connection.firstName} ${connection.lastName}`,
      department: connection.department,
      position: connection.position,
      year: connection.connectedDate.getFullYear(),
      size: getDepartmentSize(connection.department),
      color: getDepartmentColor(connection.department),
      connection: connection,
      x: width / 2 + Math.random() * 100 - 50,
      y: height / 2 + Math.random() * 100 - 50
    }));

    // Create links based on shared departments/years
    const links: NetworkLink[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];

        let strength = 0;

        // Same department = stronger connection
        if (nodeA.department && nodeB.department && nodeA.department === nodeB.department) {
          strength += 0.8;
        }

        // Same year = weaker connection
        if (Math.abs(nodeA.year - nodeB.year) <= 1) {
          strength += 0.3;
        }

        // Only create link if there's some connection
        if (strength > 0) {
          links.push({
            source: nodeA.id,
            target: nodeB.id,
            strength: Math.min(strength, 1)
          });
        }
      }
    }

    // Create simulation
    const simulation = d3.forceSimulation<NetworkNode>(nodes)
      .force("link", d3.forceLink<NetworkNode, NetworkLink>(links)
        .id(d => d.id)
        .distance(d => 100 - (d.strength * 50))
        .strength(d => d.strength * 0.5))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(d => (d as NetworkNode).size + 5));

    // Create links
    const link = container.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", d => d.strength * 0.6)
      .attr("stroke-width", d => Math.sqrt(d.strength) * 2);

    // Create nodes
    const node = container.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter().append("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .call(d3.drag<SVGGElement, NetworkNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Add circles to nodes
    node.append("circle")
      .attr("r", d => d.size)
      .attr("fill", d => d.color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .on("mouseover", function(event, d) {
        setHoveredNode(d);
        d3.select(this).attr("stroke-width", 4);
      })
      .on("mouseout", function() {
        setHoveredNode(null);
        d3.select(this).attr("stroke-width", 2);
      })
      .on("click", function(event, d) {
        setSelectedNode(d);
      });

    // Add labels to nodes
    node.append("text")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .attr("fill", "#333")
      .attr("pointer-events", "none")
      .text(d => d.name.split(" ").map(n => n[0]).join(""));

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as NetworkNode).x!)
        .attr("y1", d => (d.source as NetworkNode).y!)
        .attr("x2", d => (d.target as NetworkNode).x!)
        .attr("y2", d => (d.target as NetworkNode).y!);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: d3.D3DragEvent<SVGGElement, NetworkNode, NetworkNode>) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, NetworkNode, NetworkNode>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, NetworkNode, NetworkNode>) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Cleanup
    return () => {
      simulation.stop();
    };

  }, [connections]);

  const getDepartmentColor = (department?: string): string => {
    const colors: Record<string, string> = {
      'engineering': '#3B82F6',
      'product': '#10B981',
      'design': '#F59E0B',
      'data': '#8B5CF6',
      'sales': '#EF4444',
      'marketing': '#F97316',
      'customer success': '#06B6D4',
      'operations': '#6B7280',
      'hr': '#EC4899',
      'finance': '#84CC16'
    };
    return colors[department || 'unknown'] || '#9CA3AF';
  };

  const getDepartmentSize = (department?: string): number => {
    const sizes: Record<string, number> = {
      'engineering': 15,
      'product': 12,
      'design': 12,
      'data': 14,
      'sales': 13,
      'marketing': 11,
      'customer success': 11,
      'operations': 10,
      'hr': 10,
      'finance': 10
    };
    return sizes[department || 'unknown'] || 8;
  };

  const departmentStats = connections.reduce((acc, conn) => {
    const dept = conn.department || 'Other';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Network Visualization</h2>
          <p className="text-gray-600">
            Explore connections between your Medallia colleagues. Node size and color represent departments,
            lines show shared teams or connection timing.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Legend */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Departments</h3>
              <div className="space-y-2">
                {Object.entries(departmentStats).map(([dept, count]) => (
                  <div key={dept} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: getDepartmentColor(dept === 'Other' ? undefined : dept) }}
                      ></div>
                      <span className="text-sm capitalize">{dept}</span>
                    </div>
                    <span className="text-xs text-gray-500">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Controls</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• Click and drag nodes to move them</p>
                <p>• Scroll to zoom in/out</p>
                <p>• Click on a node for details</p>
                <p>• Hover for quick info</p>
              </div>
            </div>
          </div>

          {/* Network Graph */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6">
              <svg ref={svgRef} className="w-full border border-gray-200 rounded"></svg>
            </div>

            {/* Node Details */}
            {(hoveredNode || selectedNode) && (
              <div className="mt-4 bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-semibold mb-2">
                  {(hoveredNode || selectedNode)?.name}
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Position:</span>
                    <p className="text-gray-600">{(hoveredNode || selectedNode)?.position}</p>
                  </div>
                  <div>
                    <span className="font-medium">Department:</span>
                    <p className="text-gray-600 capitalize">
                      {(hoveredNode || selectedNode)?.department || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Connected:</span>
                    <p className="text-gray-600">{(hoveredNode || selectedNode)?.year}</p>
                  </div>
                  <div>
                    <span className="font-medium">Email:</span>
                    <p className="text-gray-600">{(hoveredNode || selectedNode)?.connection.email || 'Not available'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkGraph;