import React from 'react';
import { AvatarConfig } from '@/types';

interface AvatarProps {
    config: AvatarConfig;
    className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ config, className = '' }) => {
    const { gender, skinTone } = config;

    return (
        <svg viewBox="0 0 100 100" className={`w-full h-full ${className}`} xmlns="http://www.w3.org/2000/svg">
            <defs>
                {/* Add a subtle drop shadow to make them stand out in premium UI */}
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.1" />
                </filter>
            </defs>

            {/* Circular background */}
            <circle cx="50" cy="50" r="50" fill="currentColor" opacity="0.1" />

            {gender === 'male_beard' ? (
                <g filter="url(#shadow)">
                    {/* Shoulders / Body */}
                    <path d="M 20 100 C 20 70, 80 70, 80 100 Z" fill="currentColor" opacity="0.8" />

                    {/* Head base (Skin tone) */}
                    <circle cx="50" cy="45" r="22" fill={skinTone} />

                    {/* Beard (Dark grey/black usually, we'll use a soft slightly transparent or complementary dark tone) */}
                    <path
                        d="M 28 45 Q 50 85 72 45 Q 75 65 50 78 Q 25 65 28 45 Z"
                        fill="#2d3748"
                    />

                    {/* Head covering like a Kufi (optional but classic) */}
                    <path d="M 29 40 C 29 20, 71 20, 71 40 Z" fill="currentColor" opacity="0.9" />
                </g>
            ) : (
                <g filter="url(#shadow)">
                    {/* Hijab Covering / Body */}
                    {/* Body shape sweeping down */}
                    <path d="M 15 100 C 15 65, 30 20, 50 20 C 70 20, 85 65, 85 100 Z" fill="currentColor" opacity="0.9" />

                    {/* Face cutout area showing skin tone */}
                    {/* The face shape underneath the hijab */}
                    <circle cx="50" cy="48" r="18" fill={skinTone} />

                    {/* Inner hijab wrap to frame the face */}
                    <path d="M 32 48 C 32 30, 68 30, 68 48 C 68 70, 50 75, 50 75 C 50 75, 32 70, 32 48 Z" fill="transparent" stroke="currentColor" strokeWidth="4" opacity="0.9" />
                </g>
            )}
        </svg>
    );
};

export default Avatar;
