import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HierarchyManager } from './HierarchyManager';
import './styles.css';

const App: React.FC = () => {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'error' | 'success';
    message: string;
  }>>([]);

  const addNotification = (type: 'error' | 'success', message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleError = (message: string) => {
    addNotification('error', message);
  };

  const handleSuccess = (message: string) => {
    addNotification('success', message);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="app">
      <div className="notifications">
        {notifications.map(notification => (
          <div 
            key={notification.id} 
            className={`notification ${notification.type}`}
            onClick={() => removeNotification(notification.id)}
          >
            <span className="notification-icon">
              {notification.type === 'error' ? '❌' : '✅'}
            </span>
            <span className="notification-message">{notification.message}</span>
            <button 
              className="notification-close"
              onClick={(e) => {
                e.stopPropagation();
                removeNotification(notification.id);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <HierarchyManager 
        onError={handleError}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

// Initialize the React app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
} else {
  console.error('Root container not found');
}