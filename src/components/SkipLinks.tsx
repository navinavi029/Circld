/**
 * SkipLinks Component
 * 
 * Provides keyboard navigation shortcuts to bypass repetitive content.
 * Implements WCAG 2.1 Success Criterion 2.4.1 (Bypass Blocks).
 * 
 * Requirements: 22.1-22.7
 * - Skip links are the first focusable elements on the page
 * - Visually hidden until focused
 * - Display prominently with high contrast when focused
 * - Move focus to target element when activated
 * - Include links for main content, navigation, and search
 */

import { useCallback } from 'react';

interface SkipLink {
  id: string;
  label: string;
  targetId: string;
}

const skipLinks: SkipLink[] = [
  { id: 'skip-to-main', label: 'Skip to main content', targetId: 'main-content' },
  { id: 'skip-to-nav', label: 'Skip to navigation', targetId: 'main-navigation' },
];

export function SkipLinks() {
  const handleSkipClick = useCallback((event: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    event.preventDefault();
    
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      // Move focus to the target element
      targetElement.focus();
      
      // If the element is not naturally focusable, scroll it into view
      if (targetElement.tabIndex === -1) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, []);

  return (
    <div className="skip-links">
      {skipLinks.map((link) => (
        <a
          key={link.id}
          href={`#${link.targetId}`}
          className="skip-link"
          onClick={(e) => handleSkipClick(e, link.targetId)}
        >
          {link.label}
        </a>
      ))}
      
      <style>{`
        /* Skip links container */
        .skip-links {
          position: relative;
          z-index: 9999;
        }
        
        /* Skip link base styles - visually hidden until focused (Requirement 22.2) */
        .skip-link {
          position: absolute;
          top: -100vh;
          left: 0;
          padding: 1rem 1.5rem;
          background-color: #0f172a;
          color: #ffffff;
          text-decoration: none;
          font-weight: 600;
          font-size: 1rem;
          border-radius: 0 0 0.5rem 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          transition: top 0.2s ease-in-out;
          z-index: 10000;
          white-space: nowrap;
        }
        
        /* Display prominently when focused (Requirements 22.3, 22.6, 22.7) */
        .skip-link:focus {
          top: 0;
          outline: 3px solid #10b981;
          outline-offset: 2px;
        }
        
        /* Hover state for mouse users */
        .skip-link:hover {
          background-color: #1e293b;
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .skip-link {
            background-color: #f8fafc;
            color: #0f172a;
          }
          
          .skip-link:focus {
            outline-color: #34d399;
          }
          
          .skip-link:hover {
            background-color: #e2e8f0;
          }
        }
        
        /* High contrast mode support (Requirement 22.6) */
        @media (prefers-contrast: high) {
          .skip-link {
            border: 2px solid currentColor;
          }
          
          .skip-link:focus {
            outline-width: 4px;
          }
        }
        
        /* Ensure skip links appear above all content when focused (Requirement 22.7) */
        .skip-link:focus-visible {
          position: fixed;
          top: 0;
          left: 0;
        }
      `}</style>
    </div>
  );
}
