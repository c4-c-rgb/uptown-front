import React, { useState, useEffect } from 'react';
import './FloatingBackground.scss';

/**
 * Reusable floating background component with animated shapes
 * Add this component to any page for consistent background styling
 */
const FloatingBackground = ({ shapeCount = 15 }) => {
    const [shapes, setShapes] = useState([]);

    useEffect(() => {
        const newShapes = [];
        for (let i = 0; i < shapeCount; i++) {
            newShapes.push({
                id: i,
                size: Math.random() * 20 + 10,
                x: Math.random() * 100,
                y: Math.random() * 100,
                duration: Math.random() * 15 + 10,
                delay: Math.random() * 5
            });
        }
        setShapes(newShapes);
    }, [shapeCount]);

    return (
        <div className="dashboard-background">
            <div className="floating-shapes">
                {shapes.map((shape) => (
                    <div
                        key={shape.id}
                        className="floating-shape"
                        style={{
                            '--size': `${shape.size}px`,
                            '--x': `${shape.x}%`,
                            '--y': `${shape.y}%`,
                            '--duration': `${shape.duration}s`,
                            '--delay': `${shape.delay}s`
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default FloatingBackground;
