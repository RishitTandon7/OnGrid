'use client';

import React from 'react';

interface Point {
  lat: number;
  lng: number;
}

interface GeofencePreviewProps {
  polygon: Point[];
  className?: string;
}

export default function GeofencePreview({ polygon, className = '' }: GeofencePreviewProps) {
  if (!polygon || polygon.length < 3) {
    return (
      <div className={`flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 text-xs p-4 h-32 ${className}`}>
        <span>No layout preview available</span>
      </div>
    );
  }

  // Calculate bounding box
  const lats = polygon.map((p) => p.lat);
  const lngs = polygon.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  // Size of the preview box
  const viewBoxWidth = 240;
  const viewBoxHeight = 140;
  const padding = 20;

  // Ranges
  const latRange = maxLat - minLat;
  const lngRange = maxLng - minLng;

  // Coordinate scaling to SVG coordinates
  const scale = (point: Point) => {
    // If range is zero, center the point
    const x =
      lngRange === 0
        ? viewBoxWidth / 2
        : padding + ((point.lng - minLng) / lngRange) * (viewBoxWidth - padding * 2);
    
    // SVG y-axis is inverted relative to Latitude (Latitude goes up, SVG goes down)
    const y =
      latRange === 0
        ? viewBoxHeight / 2
        : viewBoxHeight - (padding + ((point.lat - minLat) / latRange) * (viewBoxHeight - padding * 2));
    
    return { x, y };
  };

  const svgPoints = polygon.map(scale);
  const polygonPointsString = svgPoints.map((p) => `${p.x},${p.y}`).join(' ');

  // Compute centroid
  const centroidX = svgPoints.reduce((sum, p) => sum + p.x, 0) / svgPoints.length;
  const centroidY = svgPoints.reduce((sum, p) => sum + p.y, 0) / svgPoints.length;

  return (
    <div className={`relative bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/50 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-inner ${className}`}>
      {/* Grid Pattern Backdrop */}
      <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.08]" style={{
        backgroundImage: 'radial-gradient(var(--foreground) 1px, transparent 0)',
        backgroundSize: '16px 16px'
      }}></div>

      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full h-full relative z-10"
      >
        <defs>
          <radialGradient id="beaconGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Centroid Signal Radar Wave */}
        <circle
          cx={centroidX}
          cy={centroidY}
          r="25"
          fill="url(#beaconGlow)"
          className="animate-pulse-glow"
        />

        {/* Geofence Fill & Polygon Border */}
        <polygon
          points={polygonPointsString}
          className="fill-indigo-500/10 dark:fill-indigo-500/20 stroke-indigo-600 dark:stroke-indigo-400 stroke-2"
          strokeLinejoin="round"
        />

        {/* Vertices / Boundary Coordinates */}
        {svgPoints.map((p, idx) => (
          <g key={idx}>
            <circle
              cx={p.x}
              cy={p.y}
              r="4"
              className="fill-indigo-600 dark:fill-indigo-400 shadow-sm"
            />
            <circle
              cx={p.x}
              cy={p.y}
              r="7"
              className="stroke-indigo-400 dark:stroke-indigo-300 stroke-[1.5] fill-none opacity-50"
            />
          </g>
        ))}

        {/* Centroid Point Beacon */}
        <circle
          cx={centroidX}
          cy={centroidY}
          r="4.5"
          className="fill-violet-600 dark:fill-violet-400"
        />
      </svg>
      
      {/* Visual Labels Overlay */}
      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold z-20 pointer-events-none">
        <span>GEOFENCE PREVIEW</span>
        <span>{polygon.length} VERTICES</span>
      </div>
    </div>
  );
}
