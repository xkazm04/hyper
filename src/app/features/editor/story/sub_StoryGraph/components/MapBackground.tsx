import React from 'react'
import { Background, BackgroundVariant } from 'reactflow'

/**
 * MapBackground - Theme-aware background for the story graph
 *
 * Features:
 * - Hexagonal grid pattern reminiscent of game maps
 * - Subtle dot grid overlay
 * - Vignette effect for depth
 * - Uses CSS variables for theme compatibility
 *
 * @deprecated Integrated directly into StoryGraph component for better control
 */
export function MapBackground() {
    return (
        <>
            {/* Base gradient using theme variables */}
            <div className="absolute inset-0 pointer-events-none z-0 bg-gradient-to-br from-muted/30 via-background to-muted/50" />

            {/* Hexagonal grid pattern */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="mapHexGrid" width="60" height="52" patternUnits="userSpaceOnUse">
                        <path
                            d="M30 0 L60 15 L60 37 L30 52 L0 37 L0 15 Z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                            className="text-foreground"
                        />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#mapHexGrid)" />
            </svg>

            {/* React Flow dots background */}
            <Background
                variant={BackgroundVariant.Dots}
                color="hsl(var(--muted-foreground))"
                gap={24}
                size={1}
                className="opacity-30"
            />

            {/* Vignette shadow effect */}
            <div className="absolute inset-0 pointer-events-none z-0 shadow-[inset_0_0_150px_hsl(var(--muted)/0.5)]" />
        </>
    )
}
