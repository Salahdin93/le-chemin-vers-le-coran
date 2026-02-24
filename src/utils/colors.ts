/**
 * Converts a hex color code to an rgba string.
 */
export const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    if (isNaN(r) || isNaN(g) || isNaN(b)) {
        return `rgba(46, 125, 50, ${alpha})`; // Fallback color
    }

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};