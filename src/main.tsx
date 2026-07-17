import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Monkey-patch DOM Node methods to prevent crashes from Google Translate, password managers or other extensions mutating the DOM behind React's back.
if (typeof Node !== 'undefined' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      if (typeof console !== 'undefined') {
        console.warn('Node.removeChild: parentNode mismatch, skipping to prevent React crash', this, child);
      }
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (typeof console !== 'undefined') {
        console.warn('Node.insertBefore: parentNode mismatch, fallback to appendChild', this, newNode, referenceNode);
      }
      return this.appendChild(newNode) as T;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
