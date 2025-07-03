import React, { useRef, useEffect, useState } from 'react';

const INITIAL_CENTER = { x: 0, y: 0 };
const INITIAL_SCALE = 2;

const MandelbrotComponent: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
    const [center, setCenter] = useState(INITIAL_CENTER);
    const [scale, setScale] = useState(INITIAL_SCALE);

    const [progress, setProgress] = useState(0);
    const [isRendering, setIsRendering] = useState(false);

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
        let cancelled = false;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width, height } = dimensions;
        canvas.width = width;
        canvas.height = height;
        const maxIter = 1000;

        setIsRendering(true);
        setProgress(0);

        // Create ImageData for faster pixel manipulation
        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;

        const chunkSize = Math.max(1, Math.floor(height / 10));
        let currentRow = 0;

        const renderChunk = () => {
            if (cancelled) return;

            const endRow = Math.min(currentRow + chunkSize, height);

            for (let y = currentRow; y < endRow; y++) {
                for (let x = 0; x < width; x++) {
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

                    let r, g, b;
                    if (iter === maxIter) {
                        r = g = b = 0;
                    } else {
                        const t = Math.min(1, Math.max(0, iter / 255));
                        r = Math.floor(9 * (1 - t) * t * t * t * 255);
                        g = Math.floor(15 * (1 - t) * (1 - t) * t * t * 255);
                        b = Math.floor(8.5 * (1 - t) * (1 - t) * (1 - t) * t * 255);
                    }

                    // Set pixel in ImageData
                    const pixelIndex = (y * width + x) * 4;
                    data[pixelIndex] = r;     // Red
                    data[pixelIndex + 1] = g; // Green
                    data[pixelIndex + 2] = b; // Blue
                    data[pixelIndex + 3] = 255; // Alpha
                }
            }

            // Update progress and display the rendered chunk immediately
            setProgress(Math.round((endRow / height) * 100));

            // Display the chunk that was just rendered
            const chunkImageData = ctx.createImageData(width, chunkSize);
            const chunkData = chunkImageData.data;

            // Copy the rendered chunk from the main imageData
            for (let y = 0; y < chunkSize && (currentRow + y) < height; y++) {
                for (let x = 0; x < width; x++) {
                    const srcIndex = ((currentRow + y) * width + x) * 4;
                    const destIndex = (y * width + x) * 4;
                    chunkData[destIndex] = data[srcIndex];
                    chunkData[destIndex + 1] = data[srcIndex + 1];
                    chunkData[destIndex + 2] = data[srcIndex + 2];
                    chunkData[destIndex + 3] = data[srcIndex + 3];
                }
            }

            // Draw the chunk to the canvas
            ctx.putImageData(chunkImageData, 0, currentRow);

            currentRow = endRow;

            if (currentRow < height) {
                // Use requestAnimationFrame for smooth progress updates
                requestAnimationFrame(renderChunk);
            } else {
                setIsRendering(false);
            }
        };

        renderChunk();

        return () => { cancelled = true; };
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
        <>
            {isRendering && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: 6,
                    background: 'rgba(30,30,30,0.5)',
                    zIndex: 1000
                }}>
                    <div style={{
                        width: `${progress}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #00f, #fff)',
                        transition: 'width 0.1s'
                    }} />
                </div>
            )}
            <canvas
                ref={canvasRef}
                width={dimensions.width}
                height={dimensions.height}
                style={{ display: 'block', position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
                onClick={handleCanvasClick}
                onContextMenu={handleCanvasContextMenu}
            />
        </>
    );
};

export default MandelbrotComponent;