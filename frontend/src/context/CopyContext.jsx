// context/CopyContext.jsx
import React, { createContext, useContext, useEffect } from 'react';

const CopyContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useCopy = () => {
  const context = useContext(CopyContext);
  if (!context) {
    throw new Error('useCopy must be used within a CopyProvider');
  }
  return context;
};

export const CopyProvider = ({ children }) => {
  const isCopyDisabled = true; // Set to false to allow copying

  useEffect(() => {
    if (!isCopyDisabled) return;

    // ============================================
    // 1. DISABLE CONTEXT MENU (Right Click)
    // ============================================
    const handleContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // ============================================
    // 2. DISABLE KEYBOARD SHORTCUTS
    // ============================================
    const handleKeyDown = (e) => {
      // Ctrl+C, Ctrl+X, Ctrl+V
      if (e.ctrlKey && (e.key === 'c' || e.key === 'x' || e.key === 'v')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      // Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      // Ctrl+S (Save Page)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      // Ctrl+P (Print)
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      // Ctrl+A (Select All)
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      // F12 (Developer Tools)
      if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      // Ctrl+Shift+I (Developer Tools)
      if (e.ctrlKey && e.shiftKey && e.key === 'i') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      // Ctrl+Shift+J (Developer Tools Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'j') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      // Ctrl+Shift+C (Inspect Element)
      if (e.ctrlKey && e.shiftKey && e.key === 'c') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // ============================================
    // 3. DISABLE SELECTION
    // ============================================
    const handleSelectStart = (e) => {
      e.preventDefault();
      return false;
    };

    // ============================================
    // 4. DISABLE COPY EVENTS
    // ============================================
    const handleCopy = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const handleCut = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const handlePaste = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // ============================================
    // 5. DISABLE DRAG
    // ============================================
    const handleDragStart = (e) => {
      e.preventDefault();
      return false;
    };

    // ============================================
    // 6. ADD CSS TO PREVENT SELECTION
    // ============================================
    const style = document.createElement('style');
    style.innerHTML = `
      /* Prevent selection on all elements */
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
        -webkit-user-drag: none !important;
        -khtml-user-drag: none !important;
        -moz-user-drag: none !important;
        -o-user-drag: none !important;
        user-drag: none !important;
      }
      
      /* Allow selection in input fields and textareas */
      input, textarea, [contenteditable="true"] {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
      
      /* Prevent image dragging */
      img {
        -webkit-user-drag: none !important;
        -khtml-user-drag: none !important;
        -moz-user-drag: none !important;
        -o-user-drag: none !important;
        user-drag: none !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);

    // ============================================
    // 7. ADD EVENT LISTENERS
    // ============================================
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('dragstart', handleDragStart);

    // Also add to window for extra safety
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('selectstart', handleSelectStart);
    window.addEventListener('copy', handleCopy);
    window.addEventListener('cut', handleCut);
    window.addEventListener('paste', handlePaste);
    window.addEventListener('dragstart', handleDragStart);

    // ============================================
    // 8. CLEANUP
    // ============================================
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('dragstart', handleDragStart);

      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('selectstart', handleSelectStart);
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('cut', handleCut);
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('dragstart', handleDragStart);

      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, [isCopyDisabled]);

  const value = {
    isCopyDisabled,
  };

  return (
    <CopyContext.Provider value={value}>
      {children}
    </CopyContext.Provider>
  );
};

export default CopyContext;