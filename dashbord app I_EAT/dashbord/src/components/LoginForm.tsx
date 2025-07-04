import React, { useState } from 'react';

interface User {
  id: string;
  name: string;
  role: string;
  email: string;
}

interface LoginFormProps {
  onLogin: (user: User) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [selectedUser, setSelectedUser] = useState<string>('admin');
  
  // Mock users for demonstration
  const users: Record<string, User> = {
    admin: {
      id: 'c20d7dc0-fee3-11ef-a93a-2cf05db4a17f',
      name: 'Alice Admin',
      email: 'alice@example.com',
      role: 'admin'
    },
    staff: {
      id: 'c20f599b-fee3-11ef-a93a-2cf05db4a17f',
      name: 'Bob Staff',
      email: 'bob@example.com',
      role: 'staff'
    },
    viewer: {
      id: 'c20f5c07-fee3-11ef-a93a-2cf05db4a17f',
      name: 'Charlie Viewer',
      email: 'charlie@example.com',
      role: 'viewer'
    }
  };
  
  const handleLogin = () => {
    const user = users[selectedUser];
    if (user) {
      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      onLogin(user);
    }
  };
  
  return (
    <div style={{ 
      maxWidth: '400px', 
      margin: '0 auto', 
      padding: '20px', 
      border: '1px solid #ddd', 
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Login</h2>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Select User Role:</label>
        <select 
          value={selectedUser} 
          onChange={(e) => setSelectedUser(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '8px', 
            border: '1px solid #ddd', 
            borderRadius: '4px' 
          }}
        >
          <option value="admin">Alice Admin</option>
          <option value="staff">Bob Staff</option>
          <option value="viewer">Charlie Viewer</option>
        </select>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <p><strong>Role:</strong> {users[selectedUser].role}</p>
        <p><strong>Permissions:</strong></p>
        {selectedUser === 'admin' && (
          <ul>
            <li>Can add funds to cards</li>
            <li>Can subtract funds from cards</li>
            <li>Full access to all features</li>
          </ul>
        )}
        {selectedUser === 'staff' && (
          <ul>
            <li>Can add funds to cards</li>
            <li>Cannot subtract funds from cards</li>
          </ul>
        )}
        {selectedUser === 'viewer' && (
          <ul>
            <li>Can only view information</li>
            <li>Cannot modify any data</li>
          </ul>
        )}
      </div>
      
      <button 
        onClick={handleLogin}
        style={{ 
          width: '100%', 
          padding: '10px', 
          backgroundColor: '#4CAF50', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Login as {users[selectedUser].name}
      </button>
    </div>
  );
};

export default LoginForm;
