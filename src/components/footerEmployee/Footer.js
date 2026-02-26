import React, { useEffect, useState } from 'react';
import './Footer.scss';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [shapes, setShapes] = useState([]);
  
  // Generate random floating shapes
  useEffect(() => {
    const newShapes = [];
    const shapeCount = 10; // Number of floating shapes
    
    for (let i = 0; i < shapeCount; i++) {
      newShapes.push({
        id: i,
        size: Math.random() * 20 + 10, // Random size between 10 and 30px
        x: Math.random() * 100, // Random x position (0-100%)
        y: Math.random() * 100, // Random y position (0-100%)
        duration: Math.random() * 10 + 10, // Random animation duration (10-20s)
        delay: Math.random() * -20 // Random delay (0-20s)
      });
    }
    
    setShapes(newShapes);
  }, []);
  
  return (
    <footer className="employee-footer">
      <div className="footer-background">
        <div className="floating-shapes">
          {shapes.map(shape => (
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
      
      <div className="footer-container">
        <div className="footer-content">
          <p className="footer-text">
            © {currentYear} Uptown Hair. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
