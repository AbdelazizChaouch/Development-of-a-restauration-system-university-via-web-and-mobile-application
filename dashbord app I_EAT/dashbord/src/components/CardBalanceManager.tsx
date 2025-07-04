import React, { useState, useEffect } from 'react';
import { UniversityCardApi } from '../services/api.service';
import { Button, TextField, Typography, Box, Paper, Alert, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

interface CardBalanceManagerProps {
  cardId: number;
  initialBalance?: number;
  onBalanceUpdated?: (newBalance: number) => void;
}

interface User {
  id: string;
  role: string;
  name: string;
}

const CardBalanceManager: React.FC<CardBalanceManagerProps> = ({ 
  cardId, 
  initialBalance = 0,
  onBalanceUpdated 
}) => {
  const [amount, setAmount] = useState<string>('');
  const [balance, setBalance] = useState<number>(initialBalance);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Load user from localStorage
  useEffect(() => {
    try {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        const userData = JSON.parse(userJson);
        setUser(userData);
        console.log('User loaded in CardBalanceManager:', userData);
      } else {
        console.warn('No user found in localStorage');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, []);

  // Load current balance
  useEffect(() => {
    const fetchCardDetails = async () => {
      try {
        setLoading(true);
        const card = await UniversityCardApi.getById(cardId);
        setBalance(card.sold);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching card details:', error);
        setError('Failed to load card balance');
        setLoading(false);
      }
    };

    fetchCardDetails();
  }, [cardId]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow positive numbers with up to 2 decimal places
    const value = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(value) || value === '') {
      setAmount(value);
    }
  };

  // Function to update card balance (add or subtract)
  const updateCardBalance = async (operation: 'add' | 'subtract') => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (operation === 'subtract' && parseFloat(amount) > balance) {
      setError('Insufficient funds on card');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Get user data from localStorage
      const userJson = localStorage.getItem('user');
      const userData = userJson ? JSON.parse(userJson) : null;
      
      console.log(`Authentication check before ${operation} funds:`, {
        user: userData,
        cardId,
        amount,
        operation
      });
      
      if (!userData || !userData.id) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      // Client-side role check
      if (operation === 'subtract' && userData.role !== 'admin') {
        throw new Error('Permission denied: Only administrators can subtract funds from cards');
      }
      
      // Prepare request data
      const requestData = {
        amount: parseFloat(amount),
        operation
      };
      
      // Prepare headers with authentication
      const headers = {
        'Content-Type': 'application/json',
        'X-User-ID': userData.id.toString(),
        'X-User-Role': userData.role || 'staff'
      };
      
      console.log('Request details:', {
        headers,
        body: requestData,
        url: `http://localhost:5000/api/university-cards/${cardId}/balance`
      });
      
      // Make direct fetch request
      const response = await fetch(`http://localhost:5000/api/university-cards/${cardId}/balance`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(requestData)
      });
      
      console.log('Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Error response:', errorData);
        throw new Error(errorData.message || `Error: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log(`${operation} funds response:`, responseData);
      
      // Get the new balance from the response
      const newBalance = responseData.data?.new_balance || 
                         responseData.data?.sold || 
                         (operation === 'add' ? balance + parseFloat(amount) : balance - parseFloat(amount));
      
      console.log(`New balance determined: ${newBalance}`);
      
      setBalance(newBalance);
      setSuccess(`Successfully ${operation === 'add' ? 'added' : 'subtracted'} $${parseFloat(amount).toFixed(2)} ${operation === 'add' ? 'to' : 'from'} card balance. New balance: $${newBalance.toFixed(2)}`);
      setAmount('');
      
      if (onBalanceUpdated) {
        onBalanceUpdated(newBalance);
      }
    } catch (error) {
      console.error(`Error ${operation} funds:`, error);
      
      // Extract error message from different possible error formats
      let errorMessage = `Failed to ${operation} funds`;
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = (error as any).message || JSON.stringify(error);
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = () => updateCardBalance('add');
  const handleSubtractFunds = () => updateCardBalance('subtract');

  // Determine if user can add funds (admin or staff)
  const canAddFunds = user && (user.role === 'admin' || user.role === 'staff');
  
  // Determine if user can subtract funds (admin only)
  const canSubtractFunds = user && user.role === 'admin';

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Card Balance Manager
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body1">
          Current Balance: <strong>${balance.toFixed(2)}</strong>
        </Typography>
      </Box>
      
      {(canAddFunds || canSubtractFunds) && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TextField
            label="Amount"
            variant="outlined"
            size="small"
            value={amount}
            onChange={handleAmountChange}
            disabled={loading}
            InputProps={{
              startAdornment: <Box component="span" sx={{ mr: 1 }}>$</Box>,
            }}
            sx={{ mr: 2, width: '150px' }}
          />
          
          {canAddFunds && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddFunds}
              disabled={loading || !amount}
              sx={{ mr: 1 }}
            >
              Add Funds
            </Button>
          )}
          
          {canSubtractFunds && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<RemoveIcon />}
              onClick={handleSubtractFunds}
              disabled={loading || !amount || parseFloat(amount) > balance}
            >
              Subtract Funds
            </Button>
          )}
          
          {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}
        </Box>
      )}
      
      {!canAddFunds && !canSubtractFunds && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You have view-only access to card balances.
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      
      {user && (
        <Typography variant="body2" color="textSecondary">
          Logged in as: {user.name} ({user.role})
        </Typography>
      )}
    </Paper>
  );
};

export default CardBalanceManager; 