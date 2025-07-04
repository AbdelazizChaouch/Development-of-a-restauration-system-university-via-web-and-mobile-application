import React, { useState, useEffect } from 'react';
import { UniversityCardApi } from '../services/api.service';
import { FaSearch, FaFilter, FaTimes, FaSpinner, FaExclamationTriangle, FaPlus } from 'react-icons/fa';
import PageTemplate from '../components/PageTemplate';
import '../styles/Pages.css';

// Add type declaration for testAuth method
declare module '../services/api.service' {
  interface UniversityCardApiType {
    testAuth: () => Promise<any>;
  }
}

// Create a simple inline LoginForm component
const LoginForm = ({ onLogin }: { onLogin: (user: any) => void }) => {
  const users = {
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
  
  return (
    <div className="login-container">
      <h2>Login</h2>
      <div className="login-buttons">
        <button onClick={() => onLogin(users.admin)} className="login-button admin">Login as Admin</button>
        <button onClick={() => onLogin(users.staff)} className="login-button staff">Login as Staff</button>
        <button onClick={() => onLogin(users.viewer)} className="login-button viewer">Login as Viewer</button>
      </div>
    </div>
  );
};

interface User {
  id: string;
  name: string;
  role: string;
  email: string;
}

// Define search filter options
type SearchFilter = 'all' | 'id' | 'card' | 'name';

// Simple card component that doesn't rely on Material UI
const UniversityCards: React.FC = () => {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilter, setSearchFilter] = useState<SearchFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filteredCards, setFilteredCards] = useState<any[]>([]);

  // Load user from localStorage on component mount
  useEffect(() => {
    try {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        const userData = JSON.parse(userJson);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, []);

  // Fetch cards using the API
    const fetchCards = async () => {
      try {
        setLoading(true);
      
      // Get user authentication details from localStorage
      const userJson = localStorage.getItem('user');
      const token = localStorage.getItem('auth_token');
      
      if (!userJson || !token) {
        console.error('No authentication data found');
        setError('Authentication required. Please log in.');
        setLoading(false);
        return;
      }
      
      const userData = JSON.parse(userJson);
      console.log('Fetching cards with user:', userData.id, userData.role);
      
      // Make a direct fetch request to get cards with student details
      const response = await fetch('http://localhost:5000/api/cards/details', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': userData.id,
          'x-user-role': userData.role
        }
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error:', response.status, errorText);
        throw new Error(`API error: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Cards data received:', data);
      
      if (data && data.cards) {
        setCards(data.cards);
        setFilteredCards(data.cards);
      } else {
        console.warn('No cards data in response:', data);
        setCards([]);
        setFilteredCards([]);
      }
      
        setError(null);
      } catch (error) {
        console.error('Error fetching university cards:', error);
        setError('Failed to load university cards. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

  // Fetch cards on component mount
  useEffect(() => {
    fetchCards();
  }, []);

  // Update filtered cards when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCards(cards);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    
    // Filter based on the selected filter
    const filtered = cards.filter(card => {
      switch (searchFilter) {
        case 'id':
          return String(card.student_id).includes(term);
        case 'name':
          return (card.full_name?.toLowerCase().includes(term) || false);
        case 'card':
          return (card.card_number?.toLowerCase().includes(term) || false);
        case 'all':
        default:
          return (
            String(card.student_id).includes(term) ||
            (card.full_name?.toLowerCase().includes(term) || false) ||
            (card.card_number?.toLowerCase().includes(term) || false)
          );
      }
    });
    
    setFilteredCards(filtered);
  }, [searchTerm, cards, searchFilter]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setSearchFilter('all');
    setFilteredCards(cards);
    setShowFilters(false);
  };
  
  // Handle filter change
  const handleFilterChange = (filter: SearchFilter) => {
    setSearchFilter(filter);
    if (searchTerm) {
      document.querySelector<HTMLInputElement>('.search-input')?.focus();
    }
  };

  // Toggle filters display
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Get placeholder text based on current filter
  const getPlaceholderText = () => {
    switch (searchFilter) {
      case 'id': return 'Search by Student ID';
      case 'name': return 'Search by Student Name';
      case 'card': return 'Search by Card Number';
      default: return 'Search by ID, name, or card number';
    }
  };

  // Function to handle adding funds
  const handleAddFunds = async (cardId: number, amount: number) => {
    if (!user) {
      setError('You must be logged in to add funds');
      return;
    }
    
    try {
      console.log(`Attempting to add ${amount} to card ${cardId} as user role: ${user.role || 'unknown'}`);
      
      // Prepare request data
      const requestData = {
        amount: amount,
        operation: 'add'
      };
      
      // Prepare headers with authentication
      const headers = {
        'Content-Type': 'application/json',
        'X-User-ID': user.id.toString(),
        'X-User-Role': user.role || 'staff'
      };
      
      console.log('Request details:', {
        headers,
        body: requestData,
        url: `http://localhost:5000/api/university-cards/${cardId}/balance`
      });
      
      // Make direct fetch request with error handling
      try {
      const response = await fetch(`http://localhost:5000/api/university-cards/${cardId}/balance`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(requestData)
      });
      
      console.log('Response status:', response.status, response.statusText);
      
      if (!response.ok) {
          let errorMessage = `Error: ${response.status} ${response.statusText}`;
          
          try {
            const errorData = await response.json();
        console.error('Error response:', errorData);
            if (errorData && errorData.message) {
              errorMessage = errorData.message;
            }
          } catch (parseError) {
            console.error('Failed to parse error response:', parseError);
          }
          
          throw new Error(errorMessage);
        }
        
        // Parse the response data with error handling
        let responseData;
        try {
          responseData = await response.json();
      console.log('Add funds response:', responseData);
        } catch (parseError) {
          console.error('Failed to parse response data:', parseError);
          throw new Error('Invalid response format from server');
        }
      
        // Get the new balance from the response with fallbacks
        let newBalance: number;
        
        if (responseData && responseData.data && responseData.data.new_balance) {
          // Try to parse the new balance as a number
          try {
            const balanceStr = responseData.data.new_balance.toString().replace(/[^\d.-]/g, '');
            newBalance = parseFloat(balanceStr);
          } catch (parseError) {
            console.error('Failed to parse new balance:', parseError);
            newBalance = cards.find(card => card.card_id === cardId)?.sold + amount || 0; // Fallback to calculating locally
          }
        } else if (responseData && responseData.data && responseData.data.sold) {
          newBalance = parseFloat(responseData.data.sold);
        } else {
          // Fallback: find the card and get its current balance plus the amount
          const currentCard = cards.find(card => card.card_id === cardId);
          if (!currentCard) {
            throw new Error('Card not found');
          }
          newBalance = currentCard.sold + amount;
        }
      
      // Update the card in the list
      setCards(prevCards => 
        prevCards.map(card => 
          card.card_id === cardId 
            ? { ...card, sold: newBalance } 
            : card
        )
      );
      
        // Show success message
        setError(null);
        alert(`Successfully added ${amount} DT to card`);
        
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        throw fetchError;
      }
    } catch (error) {
      console.error('Error adding funds:', error);
      let errorMessage = 'Failed to add funds';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setError(errorMessage);
      
      // Refresh the card list to ensure we have the latest data
      try {
        await fetchCards();
      } catch (refreshError) {
        console.error('Failed to refresh cards after error:', refreshError);
      }
    }
  };

  // Function to handle subtracting funds (admin only)
  const handleSubtractFunds = async (cardId: number, amount: number) => {
    if (!user) {
      setError('You must be logged in to subtract funds');
      return;
    }
    
    if (user.role !== 'admin') {
      setError('Only administrators can subtract funds');
      return;
    }
    
    try {
      console.log(`Attempting to subtract ${amount} from card ${cardId} as user role: ${user.role || 'unknown'}`);
      
      // Prepare request data
      const requestData = {
        amount: amount,
        operation: 'subtract'
      };
      
      // Prepare headers with authentication
      const headers = {
        'Content-Type': 'application/json',
        'X-User-ID': user.id.toString(),
        'X-User-Role': user.role || 'staff'
      };
      
      console.log('Request details:', {
        headers,
        body: requestData,
        url: `http://localhost:5000/api/university-cards/${cardId}/balance`
      });
      
      // Make direct fetch request with error handling
      try {
      const response = await fetch(`http://localhost:5000/api/university-cards/${cardId}/balance`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(requestData)
      });
      
      console.log('Response status:', response.status, response.statusText);
      
      if (!response.ok) {
          let errorMessage = `Error: ${response.status} ${response.statusText}`;
          
          try {
            const errorData = await response.json();
        console.error('Error response:', errorData);
            if (errorData && errorData.message) {
              errorMessage = errorData.message;
            }
          } catch (parseError) {
            console.error('Failed to parse error response:', parseError);
          }
          
          throw new Error(errorMessage);
        }
        
        // Parse the response data with error handling
        let responseData;
        try {
          responseData = await response.json();
      console.log('Subtract funds response:', responseData);
        } catch (parseError) {
          console.error('Failed to parse response data:', parseError);
          throw new Error('Invalid response format from server');
        }
      
        // Get the new balance from the response with fallbacks
        let newBalance: number;
        
        if (responseData && responseData.data && responseData.data.new_balance) {
          // Try to parse the new balance as a number
          try {
            const balanceStr = responseData.data.new_balance.toString().replace(/[^\d.-]/g, '');
            newBalance = parseFloat(balanceStr);
          } catch (parseError) {
            console.error('Failed to parse new balance:', parseError);
            // Fallback to calculating locally
            const currentCard = cards.find(card => card.card_id === cardId);
            if (currentCard) {
              newBalance = currentCard.sold - amount;
            } else {
              throw new Error('Card not found');
            }
          }
        } else if (responseData && responseData.data && responseData.data.sold) {
          newBalance = parseFloat(responseData.data.sold);
        } else {
          // Fallback: find the card and get its current balance minus the amount
          const currentCard = cards.find(card => card.card_id === cardId);
          if (!currentCard) {
            throw new Error('Card not found');
          }
          newBalance = currentCard.sold - amount;
        }
      
    // Update the card in the list
    setCards(prevCards => 
      prevCards.map(card => 
        card.card_id === cardId 
          ? { ...card, sold: newBalance } 
          : card
      )
    );
      
        // Show success message
        setError(null);
        alert(`Successfully subtracted ${amount} DT from card`);
        
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        throw fetchError;
      }
    } catch (error) {
      console.error('Error subtracting funds:', error);
      let errorMessage = 'Failed to subtract funds';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setError(errorMessage);
      
      // Refresh the card list to ensure we have the latest data
      try {
        await fetchCards();
      } catch (refreshError) {
        console.error('Failed to refresh cards after error:', refreshError);
      }
    }
  };

  // Handle user login
  const handleLogin = (loggedInUser: User) => {
    try {
      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      console.log('User data stored in localStorage:', loggedInUser);
      
      // Update state
      setUser(loggedInUser);
      
      // Clear any previous errors
      setError(null);
    } catch (error) {
      console.error('Error during login:', error);
      setError('Failed to log in. Please try again.');
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  // Test authentication
  const testAuthentication = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use direct fetch instead of the API method to avoid type errors
      const userJson = localStorage.getItem('user');
      const userData = userJson ? JSON.parse(userJson) : null;
      
      console.log('Testing authentication with user:', userData);
      
      if (!userData || !userData.id) {
        throw new Error('No user data found in localStorage');
      }
      
      const headers = {
        'Content-Type': 'application/json',
        'X-User-ID': userData.id.toString(),
        'X-User-Role': userData.role || 'staff'
      };
      
      console.log('Auth test headers:', headers);
      
      const response = await fetch('http://localhost:5000/api/auth-test', {
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Authentication test failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Auth test response:', data);
      
      alert(`Authentication test successful! User: ${JSON.stringify(data.user)}`);
    } catch (error) {
      console.error('Authentication test failed:', error);
      setError('Authentication test failed. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Function to create a new card
  const createCard = async (studentId: number, initialBalance: number) => {
    try {
      // Get user authentication details from localStorage
      const userJson = localStorage.getItem('user');
      const token = localStorage.getItem('auth_token');
      
      if (!userJson || !token) {
        console.error('No authentication data found');
        setError('Authentication required. Please log in.');
        return;
      }
      
      const userData = JSON.parse(userJson);
      console.log('Creating card with user:', userData.id, userData.role);
      
      // Make a direct fetch request to create a new card
      const response = await fetch('http://localhost:5000/api/university-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': userData.id,
          'x-user-role': userData.role
        },
        body: JSON.stringify({
          student_id: studentId,
          sold: initialBalance,
          created_by: userData.id
        })
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error:', response.status, errorText);
        throw new Error(`API error: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Card created:', data);
      
      // Refresh the card list
      fetchCards();
      
      return data;
    } catch (error) {
      console.error('Error creating university card:', error);
      setError('Failed to create university card. Please try again later.');
      return null;
    }
  };

  // Loading state
  if (loading && !user) {
  return (
      <PageTemplate 
        title="University Cards" 
        subtitle="Loading card data..."
        accessLevel={['admin', 'staff', 'viewer']}
      >
        <div className="loading-container">
          <FaSpinner className="loading-spinner" />
          <p>Loading university cards data...</p>
        </div>
      </PageTemplate>
    );
  }

  // Render with PageTemplate
  return (
    <PageTemplate 
      title="University Cards" 
      subtitle={user ? "" : "Please log in to manage university cards"}
      accessLevel={['admin', 'staff', 'viewer']}
    >
          <div>
        {error && !loading && (
          <div className="notification warning">
            <FaExclamationTriangle /> {error}
          </div>
        )}
      
      {!user ? (
        <LoginForm onLogin={handleLogin} />
        ) : (
          <>
            <div className="page-actions-container">
              <div className="search-container">
                <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder={getPlaceholderText()}
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
              />
              
              <button 
                  className="filter-button"
                onClick={toggleFilters}
                  title="Search filters"
                >
                  <FaFilter className={`filter-icon ${searchFilter !== 'all' ? 'filter-active' : ''}`} />
              </button>
              
              {searchTerm && (
                <button 
                    className="clear-search-button"
                  onClick={clearSearch}
                    aria-label="Clear search"
                >
                  <FaTimes />
                </button>
              )}
              
              {showFilters && (
                  <div className="search-filters">
                    <div className="filter-option">
                      <input 
                        type="radio" 
                        id="filter-all" 
                        name="search-filter" 
                        checked={searchFilter === 'all'} 
                        onChange={() => handleFilterChange('all')} 
                      />
                      <label htmlFor="filter-all">All Fields</label>
                    </div>
                    
                    <div className="filter-option">
                      <input 
                        type="radio" 
                        id="filter-id" 
                        name="search-filter" 
                        checked={searchFilter === 'id'} 
                        onChange={() => handleFilterChange('id')} 
                      />
                      <label htmlFor="filter-id">Student ID</label>
          </div>

                    <div className="filter-option">
                    <input 
                        type="radio" 
                        id="filter-name" 
                        name="search-filter" 
                        checked={searchFilter === 'name'} 
                        onChange={() => handleFilterChange('name')} 
                    />
                      <label htmlFor="filter-name">Name</label>
                  </div>
                    
                    <div className="filter-option">
                    <input 
                        type="radio" 
                        id="filter-card" 
                        name="search-filter" 
                        checked={searchFilter === 'card'} 
                        onChange={() => handleFilterChange('card')} 
                      />
                      <label htmlFor="filter-card">Card Number</label>
                  </div>
                  </div>
                )}
              </div>
              
              {user && user.role === 'admin' && (
                  <button 
                  className="add-button"
                    onClick={() => {
                    const studentId = prompt('Enter student ID:');
                    const initialBalance = prompt('Enter initial balance:');
                    if (studentId && initialBalance) {
                      createCard(parseInt(studentId), parseFloat(initialBalance));
                            }
                  }}
                >
                  <FaPlus className="add-icon" />
                  Add Card
                  </button>
              )}
            </div>

            {loading ? (
              <div className="loading-container">
                <FaSpinner className="loading-spinner" />
                <p>Loading university cards data...</p>
              </div>
            ) : cards.length === 0 ? (
              <div className="empty-state">
                <p>No university cards data available</p>
                <button className="action-button" onClick={() => window.location.reload()}>
                  Refresh
                </button>
            </div>
          ) : (
              <>
                <table className="data-table">
                <thead>
                    <tr>
                      <th>Card ID</th>
                      <th>Card Number</th>
                      <th>Student ID</th>
                      <th>Student Name</th>
                      <th>Balance</th>
                      <th>Status</th>
                      <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCards.map((card, index) => (
                      <tr key={card.card_id}>
                        <td>{card.card_id}</td>
                        <td className="card-number">{card.card_number || '-'}</td>
                        <td>{card.student_id}</td>
                        <td>{card.full_name || 'N/A'}</td>
                        <td className={`${card.sold > 0 ? 'positive-balance' : 'zero-balance'} balance-cell`}>
                          <span className="balance-amount">
                            {card.sold ? Number(card.sold).toFixed(2) : '0.00'}
                          </span>
                          <span className="balance-currency">DT</span>
                      </td>
                        <td>
                          <div className={`status-badge ${card.used ? 'status-used' : 'status-active'}`}>
                            <span className="status-dot"></span>
                            {card.used ? 'Used' : 'Active'}
                          </div>
                        </td>
                        <td>
                          {user && (user.role === 'admin' || user.role === 'staff') ? (
                            <div className="action-buttons">
                            <input 
                              type="number" 
                              placeholder="Amount" 
                              min="0.01" 
                              step="0.01"
                              id={`amount-${card.card_id}`}
                                className="amount-input"
                            />
                            <button 
                                className="action-button add-button"
                              onClick={() => {
                                const input = document.getElementById(`amount-${card.card_id}`) as HTMLInputElement;
                                const amount = parseFloat(input.value);
                                if (amount > 0) {
                                  handleAddFunds(card.card_id, amount);
                                  input.value = '';
                                }
                              }}
                            >
                                <span>+</span> Add
                            </button>
                            
                            {user.role === 'admin' && (
                              <button 
                                  className="action-button delete-button"
                                onClick={() => {
                                  const input = document.getElementById(`amount-${card.card_id}`) as HTMLInputElement;
                                  const amount = parseFloat(input.value);
                                  if (amount > 0 && amount <= card.sold) {
                                    handleSubtractFunds(card.card_id, amount);
                                    input.value = '';
                                  } else if (amount > card.sold) {
                                    alert('Insufficient funds on card');
                                  }
                                }}
                              >
                                  <span>-</span> Subtract
                              </button>
                            )}
                          </div>
                          ) : (
                            <span className="view-only-text">View only</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
                {cards.length > 0 && filteredCards.length === 0 && (
                  <div className="no-results">
                    <p>
                      {searchFilter === 'id' 
                        ? `No card with Student ID "${searchTerm}" found.` 
                        : `No cards found matching "${searchTerm}".`}
                    </p>
                    {searchTerm && (
                      <button className="action-button" onClick={clearSearch}>
                        Clear Search
                      </button>
          )}
        </div>
                )}
              </>
            )}
          </>
      )}
    </div>
      
      <style>
        {`
        .login-container {
          max-width: 400px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background-color: #f9f9f9;
        }
        
        .login-container h2 {
          text-align: center;
          margin-bottom: 20px;
        }
        
        .login-buttons {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .login-button {
          padding: 10px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          color: white;
          font-weight: 500;
        }
        
        .login-button.admin {
          background-color: #4CAF50;
        }
        
        .login-button.staff {
          background-color: #2196F3;
        }
        
        .login-button.viewer {
          background-color: #9E9E9E;
        }
        
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        
        .status-active {
          background: #ecfdf5;
          color: #059669;
        }
        
        .status-active .status-dot {
          background: #059669;
        }
        
        .status-used {
          background: #fef2f2;
          color: #dc2626;
        }
        
        .status-used .status-dot {
          background: #dc2626;
        }
        
        .amount-input {
          width: 80px;
          padding: 6px 10px;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          font-size: 14px;
          margin-right: 4px;
          flex-shrink: 0;
        }
        
        .action-buttons {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: nowrap;
          white-space: nowrap;
        }
        
        .view-only-text {
          color: #64748b;
          font-style: italic;
          font-size: 14px;
        }
        
        .card-number {
          font-family: monospace;
          font-weight: 500;
        }
        
        .action-button {
          padding: 6px 8px;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
          flex-shrink: 0;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        
        .add-button {
          background-color: #ecfdf5;
          color: #059669;
        }
        
        .add-button:hover {
          background-color: #d1fae5;
        }
        
        .delete-button {
          background-color: #fef2f2;
          color: #dc2626;
        }
        
        .delete-button:hover {
          background-color: #fee2e2;
        }
        `}
      </style>
    </PageTemplate>
  );
};

export default UniversityCards; 