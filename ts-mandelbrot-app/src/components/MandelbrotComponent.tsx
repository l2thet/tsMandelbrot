import React, { useRef, useEffect, useState } from 'react';

const INITIAL_CENTER = { x: 0, y: 0 };
const INITIAL_SCALE = 2;

const MandelbrotComponent: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
    const [center, setCenter] = useState(INITIAL_CENTER);
    const [scale, setScale] = useState(INITIAL_SCALE);

    useEffect(() => {
        const handleResize = () => {
            setDimensions({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setCenter(INITIAL_CENTER);
                setScale(INITIAL_SCALE);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width, height } = dimensions;
        canvas.width = width;
        canvas.height = height;
        const maxIter = 1000;

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const cx = center.x + (x - width / 2) * (scale * 2) / width;
                const cy = center.y + (y - height / 2) * (scale * 2) / width;
                let zx = 0, zy = 0;
                let iter = 0;

                while (zx * zx + zy * zy < 4 && iter < maxIter) {
                    const xtemp = zx * zx - zy * zy + cx;
                    zy = 2 * zx * zy + cy;
                    zx = xtemp;
                    iter++;
                }

                let color: string;
                if (iter === maxIter) {
                    color = 'rgb(0,0,0)';
                } else {
                    const t = Math.min(1, Math.max(0, iter / 255));

                    const r = Math.floor(9 * (1 - t) * t * t * t * 255);
                    const g = Math.floor(15 * (1 - t) * (1 - t) * t * t * 255);
                    const b = Math.floor(8.5 * (1 - t) * (1 - t) * (1 - t) * t * 255);

                    color = `rgb(${r},${g},${b})`;
                }
                ctx.fillStyle = color;
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }, [dimensions, center, scale]);

    // Left click: zoom in, right click: zoom out
    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        const { width, height } = dimensions;
        const newX = center.x + (clickX - width / 2) * (scale * 2) / width;
        const newY = center.y + (clickY - height / 2) * (scale * 2) / width;

        if (e.button === 0) {
            // Left click: zoom in
            setCenter({ x: newX, y: newY });
            setScale(scale * 0.5);
        }
    };

    const handleCanvasContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        const { width, height } = dimensions;
        const newX = center.x + (clickX - width / 2) * (scale * 2) / width;
        const newY = center.y + (clickY - height / 2) * (scale * 2) / width;

        // Right click: zoom out
        setCenter({ x: newX, y: newY });
        setScale(scale * 2);
    };

    return (
        <canvas
            ref={canvasRef}
            width={dimensions.width}
            height={dimensions.height}
            style={{ display: 'block', position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
            onClick={handleCanvasClick}
            onContextMenu={handleCanvasContextMenu}
        />
    );
};

export default MandelbrotComponent;