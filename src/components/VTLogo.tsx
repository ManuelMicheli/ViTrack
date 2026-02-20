"use client";

interface VTLogoIconProps {
  className?: string;
  color?: string;
}

export default function VTLogoIcon({ className = "w-8 h-8", color = "#ffffff" }: VTLogoIconProps) {
  return (
    <svg className={className} viewBox="0 0 96 48" fill="none">
      <path d="M 4 8 L 24 40 L 44 8" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M 52 8 L 92 8" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M 72 8 L 72 40" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" />
    </svg>
  );
}
