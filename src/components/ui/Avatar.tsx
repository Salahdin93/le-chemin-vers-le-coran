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

            {gender === 'male_beard' && (
                <g filter="url(#shadow)">
                    {/* Corps adulte */}
                    <path d="M 20 100 C 20 70, 80 70, 80 100 Z" fill="currentColor" opacity="0.9" />
                    {/* Tête */}
                    <circle cx="50" cy="40" r="19" fill={skinTone} />
                    {/* Barbe pleine, bien marquée */}
                    <path
                        d="M 33 43 Q 50 86 67 43 Q 65 68 50 80 Q 35 68 33 43 Z"
                        fill="#111827"
                    />
                    {/* Kufi */}
                    <path d="M 31 36 C 31 22, 69 22, 69 36 Z" fill="currentColor" opacity="0.95" />
                </g>
            )}

            {gender === 'female_hijab' && (
                <g filter="url(#shadow)">
                    {/* Hijab adulte */}
                    <path d="M 15 100 C 15 60, 30 20, 50 20 C 70 20, 85 60, 85 100 Z" fill="currentColor" opacity="0.9" />
                    {/* Visage */}
                    <circle cx="50" cy="46" r="17" fill={skinTone} />
                    {/* Liseré intérieur */}
                    <path d="M 33 46 C 33 30, 67 30, 67 46 C 67 68, 50 74, 50 74 C 50 74, 33 68, 33 46 Z" fill="transparent" stroke="currentColor" strokeWidth="4" opacity="0.9" />
                </g>
            )}

            {gender === 'boy' && (
                <g filter="url(#shadow)">
                    {/* Corps enfant garçon */}
                    <path d="M 25 100 C 25 75, 75 75, 75 100 Z" fill="currentColor" opacity="0.9" />
                    {/* Tête légèrement plus petite */}
                    <circle cx="50" cy="42" r="17" fill={skinTone} />
                    {/* Cheveux / calotte simple */}
                    <path d="M 34 38 C 34 26, 66 26, 66 38 Z" fill="#111827" opacity="0.9" />
                </g>
            )}

            {gender === 'girl' && (
                <g filter="url(#shadow)">
                    {/* Hijab enfant fille */}
                    <path d="M 18 100 C 18 62, 32 26, 50 26 C 68 26, 82 62, 82 100 Z" fill="currentColor" opacity="0.9" />
                    {/* Visage */}
                    <circle cx="50" cy="48" r="15" fill={skinTone} />
                    {/* Liseré plus doux */}
                    <path d="M 35 48 C 35 34, 65 34, 65 48 C 65 66, 50 72, 50 72 C 50 72, 35 66, 35 48 Z" fill="transparent" stroke="currentColor" strokeWidth="3" opacity="0.9" />
                </g>
            )}
        </svg>
    );
};

export default Avatar;
