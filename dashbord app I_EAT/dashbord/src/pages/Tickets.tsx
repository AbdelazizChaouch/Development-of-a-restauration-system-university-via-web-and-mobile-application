import React, { useState, useEffect } from 'react';
import PageTemplate from '../components/PageTemplate';
import { FaPlus, FaSearch, FaFilter, FaEye, FaPrint, FaCalendarAlt, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import '../styles/Pages.css';
import { fetchFromApi } from '../services/api.service';

interface Ticket {
  ticket_id: number;
  order_id: number;
  issue_date: string;
  price: number;
  order_type: string;
  used: number;
  student_id: number;
  qr_data: string;
  student_name?: string;
  created_at?: string;
}

interface DateRange {
  startDate: string | null;
  endDate: string | null;
}

const Tickets: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null
  });
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Fetch tickets from the backend
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Prepare date filter parameters
        let dateParams = '';
        const today = new Date();
        
        if (dateFilter === 'custom' && customDateRange.startDate) {
          // Use custom date range if selected
          dateParams = `?startDate=${customDateRange.startDate}${customDateRange.endDate ? `&endDate=${customDateRange.endDate}` : ''}`;
        } else if (dateFilter === 'today') {
          const todayStr = today.toISOString().split('T')[0];
          dateParams = `?startDate=${todayStr}&endDate=${todayStr}`;
        } else if (dateFilter === 'month') {
          const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
          const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          dateParams = `?startDate=${firstDay.toISOString().split('T')[0]}&endDate=${lastDay.toISOString().split('T')[0]}`;
        } else if (dateFilter === 'year') {
          const firstDay = new Date(today.getFullYear(), 0, 1);
          const lastDay = new Date(today.getFullYear(), 11, 31);
          dateParams = `?startDate=${firstDay.toISOString().split('T')[0]}&endDate=${lastDay.toISOString().split('T')[0]}`;
        }
        
        // Fetch tickets with date filter if applicable
        const endpoint = dateFilter === 'all' ? '/tickets/unused' : `/tickets${dateParams}`;
        const response = await fetchFromApi<{success: boolean, data: Ticket[]}>(endpoint);
        
        if (response.success && Array.isArray(response.data)) {
          setTickets(response.data);
        } else {
          setTickets([]);
          console.warn('No tickets found or invalid response format');
        }
      } catch (error) {
        console.error('Error fetching tickets:', error);
        setError('Failed to load tickets. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTickets();
  }, [dateFilter, customDateRange]);

  // Print tickets based on date filter
  const handlePrintTickets = () => {
    try {
      // Create a printable version of the tickets
      let printContent = `<html><head><title>Tickets Report</title>`;
      printContent += `<style>
        body { font-family: Arial, sans-serif; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        h1 { text-align: center; }
        .report-info { margin-bottom: 20px; }
      </style>`;
      printContent += `</head><body>`;
      
      // Add report title based on date filter
      let reportTitle = 'All Tickets';
      if (dateFilter === 'custom' && customDateRange.startDate) {
        const startDateFormatted = formatDate(customDateRange.startDate);
        const endDateFormatted = customDateRange.endDate ? formatDate(customDateRange.endDate) : startDateFormatted;
        reportTitle = `Tickets from ${startDateFormatted} to ${endDateFormatted}`;
      } else if (dateFilter === 'today') {
        reportTitle = 'Tickets for Today';
      } else if (dateFilter === 'month') {
        reportTitle = 'Tickets for Current Month';
      } else if (dateFilter === 'year') {
        reportTitle = 'Tickets for Current Year';
      }
      
      printContent += `<h1>${reportTitle}</h1>`;
      printContent += `<div class="report-info">`;
      printContent += `<p>Generated on: ${new Date().toLocaleString()}</p>`;
      printContent += `<p>Total tickets: ${filteredTickets.length}</p>`;
      printContent += `</div>`;
      
      // Create table with ticket data
      printContent += `<table>`;
      printContent += `<tr>
        <th>Ticket ID</th>
        <th>Order ID</th>
        <th>Issue Date</th>
        <th>Price</th>
        <th>Order Type</th>
        <th>Status</th>
        <th>Student ID</th>
        <th>Student Name</th>
      </tr>`;
      
      filteredTickets.forEach(ticket => {
        printContent += `<tr>
          <td>${ticket.ticket_id}</td>
          <td>${ticket.order_id || 'N/A'}</td>
          <td>${formatDate(ticket.issue_date)}</td>
          <td>$${parseFloat(ticket.price.toString()).toFixed(2)}</td>
          <td>${ticket.order_type}</td>
          <td>${ticket.used ? 'Used' : 'Unused'}</td>
          <td>${ticket.student_id}</td>
          <td>${ticket.student_name || 'N/A'}</td>
        </tr>`;
      });
      
      printContent += `</table>`;
      printContent += `</body></html>`;
      
      // Open a new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        // Print after a short delay to ensure content is loaded
        setTimeout(() => {
          printWindow.print();
        }, 500);
      } else {
        alert('Please allow pop-ups to print tickets');
      }
    } catch (error) {
      console.error('Error printing tickets:', error);
      alert('Failed to print tickets. Please try again.');
    }
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
  };

  // Toggle filters display
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Handle date filter change
  const handleDateFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFilter = e.target.value;
    setDateFilter(newFilter);
    
    // Show calendar if custom is selected
    if (newFilter === 'custom') {
      setShowCalendar(true);
    } else {
      setShowCalendar(false);
    }
  };

  // Handle date changes
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomDateRange(prev => ({
      ...prev,
      startDate: e.target.value
    }));
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomDateRange(prev => ({
      ...prev,
      endDate: e.target.value
    }));
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      searchTerm === '' || 
      ticket.ticket_id.toString().includes(searchTerm.toLowerCase()) ||
      (ticket.student_name && ticket.student_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ticket.order_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatusFilter = filterStatus === 'all' || 
      (filterStatus === 'used' && ticket.used === 1) || 
      (filterStatus === 'unused' && ticket.used === 0);
    
    // For priority, we'll use price ranges as a proxy for priority
    let priority = 'medium';
    if (ticket.price > 15) priority = 'high';
    else if (ticket.price < 8) priority = 'low';
    
    const matchesPriorityFilter = filterPriority === 'all' || priority === filterPriority;
    
    return matchesSearch && matchesStatusFilter && matchesPriorityFilter;
  });

  const getStatusBadgeClass = (used: number) => {
    return used ? 'status-inactive' : 'status-active';
  };

  const getPriorityClass = (price: number) => {
    if (price > 15) return 'status-inactive'; // high
    if (price < 8) return 'status-active'; // low
    return 'status-pending'; // medium
  };

  const getPriorityLabel = (price: number) => {
    if (price > 15) return 'High';
    if (price < 8) return 'Low';
    return 'Medium';
  };

  if (loading) {
    return (
      <PageTemplate 
        title="Ticket Management" 
        subtitle="Handle student support tickets and inquiries" 
        accessLevel={['admin', 'staff']}
      >
        <div className="loading-container">
          <FaExclamationTriangle className="loading-spinner" />
          <p>Loading tickets data...</p>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate 
      title="Ticket Management" 
      subtitle="Handle student support tickets and inquiries" 
      accessLevel={['admin', 'staff']}
    >
      <div>
        {error && !loading && (
          <div className="notification warning">
            <FaExclamationTriangle /> {error}
          </div>
        )}

        <div className="page-actions-container">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            
            <button 
              className="filter-button"
              onClick={toggleFilters}
              title="Search filters"
            >
              <FaFilter className={`filter-icon ${filterStatus !== 'all' || filterPriority !== 'all' || dateFilter !== 'all' ? 'filter-active' : ''}`} />
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
                  <label>Status:</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Statuses</option>
                    <option value="unused">Unused</option>
                    <option value="used">Used</option>
                  </select>
                </div>
                
                <div className="filter-option">
                  <label>Price Range:</label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Prices</option>
                    <option value="high">High (&gt;$15)</option>
                    <option value="medium">Medium ($8-$15)</option>
                    <option value="low">Low (&lt;$8)</option>
                  </select>
                </div>
                
                <div className="filter-option">
                  <label>Date Range:</label>
                  <select
                    value={dateFilter}
                    onChange={handleDateFilterChange}
                    className="filter-select"
                  >
                    <option value="all">All Dates</option>
                    <option value="custom">Custom Range</option>
                    <option value="today">Today</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                  </select>
                </div>
                
                {dateFilter === 'custom' && (
                  <div className="date-picker-container">
                    <div className="date-input-group">
                      <label>Start Date:</label>
                      <input 
                        type="date"
                        value={customDateRange.startDate || ''}
                        onChange={handleStartDateChange}
                        className="date-input"
                      />
                    </div>
                    <div className="date-input-group">
                      <label>End Date:</label>
                      <input 
                        type="date"
                        value={customDateRange.endDate || ''}
                        onChange={handleEndDateChange}
                        className="date-input"
                        min={customDateRange.startDate || undefined}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <button
            onClick={handlePrintTickets}
            className="add-button"
          >
            <FaPrint className="add-icon" />
            Print Tickets
          </button>
        </div>

        {filteredTickets.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Order Type</th>
                <th>Student</th>
                <th>Issue Date</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map(ticket => (
                <tr key={ticket.ticket_id}>
                  <td>{ticket.ticket_id}</td>
                  <td>{ticket.order_type}</td>
                  <td>{ticket.student_name || `Student ID: ${ticket.student_id}`}</td>
                  <td>{formatDate(ticket.issue_date)}</td>
                  <td>
                    <span className={`status-badge ${getPriorityClass(ticket.price)}`}>
                      ${parseFloat(ticket.price.toString()).toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(ticket.used)}`}>
                      {ticket.used ? 'Used' : 'Unused'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-results">
            <p>No tickets found matching your search criteria.</p>
          </div>
        )}
      </div>
    </PageTemplate>
  );
};

export default Tickets; 