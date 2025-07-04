import React, { useState, useEffect, useRef, useMemo } from 'react';
import PageTemplate from '../components/PageTemplate';
import { FaSearch, FaSpinner, FaExclamationTriangle, FaQrcode, FaPencilAlt, FaPlus, FaTimes, FaFilter, FaPrint, FaEdit } from 'react-icons/fa';
import { StudentApi, Student } from '../services/api.service';
import QRCodeModal from '../components/QRCodeModal';
import AddStudentModal from '../components/AddStudentModal';
import EditStudentModal from '../components/EditStudentModal';
import '../styles/Pages.css';

// Define search filter options
type SearchFilter = 'all' | 'id' | 'cn' | 'name' | 'card';

// Mock students data as fallback if API fails
const fallbackStudents: Student[] = [
  {
    id: 10001,
    name: 'John Smith',
    cn: '12345678',
    status: 'active',
    university_id: 1,
    card_id: 'CARD12345',
    university_name: 'University of Technology',
    balance: 125.50,
    created_at: '2023-01-15T10:30:00Z',
    qrCode: JSON.stringify({
      student_id: 10001,
      cn: '12345678',
      full_name: 'John Smith',
      card_id: 'CARD12345',
      university_id: 1
    })
  },
  {
    id: 20045,
    name: 'Sarah Johnson',
    cn: '23456789',
    status: 'active',
    university_id: 1,
    card_id: 'UNIV54321',
    university_name: 'University of Technology',
    balance: 75.25,
    created_at: '2023-01-20T11:15:00Z',
    qrCode: JSON.stringify({
      student_id: 20045,
      cn: '23456789',
      full_name: 'Sarah Johnson',
      card_id: 'UNIV54321',
      university_id: 1
    })
  },
  {
    id: 30721,
    name: 'Michael Chen',
    cn: '34567890',
    status: 'active',
    university_id: 2,
    card_id: 'STUD98765',
    university_name: 'State University',
    balance: 50.00,
    created_at: '2023-02-05T09:45:00Z',
    qrCode: JSON.stringify({
      student_id: 30721,
      cn: '34567890',
      full_name: 'Michael Chen',
      card_id: 'STUD98765',
      university_id: 2
    })
  }
];

const columns = [
  {
    Header: 'Student ID',
    accessor: 'id',
  },
  {
    Header: 'CN',
    accessor: 'cn',
  },
  {
    Header: 'Full Name',
    accessor: 'name',
  },
  {
    Header: 'Profile',
    accessor: 'profile',
    Cell: ({ row }: any) => {
      const student = row.original;
      const initial = getInitial(student.name);
      const avatarColor = getAvatarColor(initial);
      return (
        <div 
          className="student-avatar"
          style={{ backgroundColor: avatarColor }}
        >
          {initial}
        </div>
      );
    },
  },
  {
    Header: 'University',
    accessor: 'university_name',
  },
  {
    Header: 'Balance',
    accessor: 'balance',
    Cell: ({ row }: any) => {
      const student = row.original;
      return (
        <div className={`${student.balance && student.balance > 0 ? 'positive-balance' : 'zero-balance'} balance-cell`}>
          <span className="balance-amount">
            {student.balance ? student.balance.toFixed(2) : '0.00'}
          </span>
          <span className="balance-currency">DT</span>
        </div>
      );
    },
  },
  {
    Header: 'Card Number',
    accessor: 'card_id',
  },
  {
    Header: 'QR Code',
    accessor: 'qrCode',
    Cell: ({ row }: any) => {
      const student = row.original;
      return (
        <div className="flex space-x-2">
          <button
            className="text-blue-600 hover:text-blue-900"
            onClick={(e) => handleQRCodeClick(e, student)}
          >
            <FaQrcode />
          </button>
        </div>
      );
    },
  },
  {
    Header: 'Actions',
    accessor: 'actions',
    Cell: ({ row }: any) => {
      const student = row.original;
      return (
        <div className="flex space-x-2">
          <button
            className="text-blue-600 hover:text-blue-900"
            onClick={(e) => handleEditClick(e, student)}
          >
            <FaEdit />
          </button>
          <button
            className="text-purple-600 hover:text-purple-900"
            onClick={() => handlePrintIDCard(student)}
            title="Print ID Card"
          >
            <FaPrint />
          </button>
        </div>
      );
    },
  },
];

// Update the getUniversityName function to handle undefined
const getUniversityName = (universityId: number | undefined): string => {
  switch (universityId) {
    case 1:
      return 'ISET';
    case 2:
      return 'ISAT';
    default:
      return 'Prepa';
  }
};

const Students: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showQRCode, setShowQRCode] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [searchFilter, setSearchFilter] = useState<SearchFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [studentCreationError, setStudentCreationError] = useState<string | null>(null);
  const [studentUpdateError, setStudentUpdateError] = useState<string | null>(null);
  const [isExistingQRCode, setIsExistingQRCode] = useState<boolean>(false);
  const printCardRef = useRef<HTMLDivElement>(null);

  // Fetch students from real backend API
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        // Try to get data from the API
        const data = await StudentApi.getAll();
        
        // If we get here, the API call succeeded
        if (data && data.length > 0) {
          console.log('Successfully loaded', data.length, 'students from API');
          setStudents(data);
          setSearchResults(data);
          setError(null);
        } else {
          // API returned empty data
          console.warn('API returned empty student data, using fallback data');
          setStudents(fallbackStudents);
          setSearchResults(fallbackStudents);
          setUseFallback(true);
          setError('No students found in the API, using sample data');
        }
      } catch (err: any) {
        console.error('Failed to fetch students from API:', err);
        // Use fallback data on error
        setStudents(fallbackStudents);
        setSearchResults(fallbackStudents);
        setUseFallback(true);
        setError(`Failed to load from API: ${err.message || 'Unknown error'}. Using sample data.`);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Update search results when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults(students);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    
    // If searching by ID only
    if (searchFilter === 'id') {
      // Check for exact matches first
      const exactMatches = students.filter(student => 
        String(student.id) === term
      );
      
      // If we have exact matches, return them
      if (exactMatches.length > 0) {
        setSearchResults(exactMatches);
        return;
      }
      
      // Otherwise do partial matches on ID
      const partialMatches = students.filter(student => 
        String(student.id).includes(term)
      );
      setSearchResults(partialMatches);
      return;
    }
    
    // Filter based on the selected filter
    const filtered = students.filter(student => {
      // Partial ID search if term looks like a number
      if (searchFilter === 'all' && !isNaN(Number(term)) && term.length >= 3) {
        return String(student.id).includes(term);
      }
      
      switch (searchFilter) {
        case 'cn':
          return (student.cn?.toLowerCase().includes(term) || false);
        case 'name':
          return (student.name?.toLowerCase().includes(term) || false);
        case 'card':
          return (student.card_id?.toLowerCase().includes(term) || false);
        case 'all':
        default:
          return (
            String(student.id).includes(term) ||
            (student.name?.toLowerCase().includes(term) || false) ||
            (student.cn?.toLowerCase().includes(term) || false) ||
            (student.university_name?.toLowerCase().includes(term) || false) ||
            (student.card_id?.toLowerCase().includes(term) || false)
          );
      }
    });
    
    setSearchResults(filtered);
  }, [searchTerm, students, searchFilter]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setSearchFilter('all');
    setSearchResults(students);
    setShowFilters(false);
  };
  
  // Handle filter change
  const handleFilterChange = (filter: SearchFilter) => {
    setSearchFilter(filter);
    // If changing filter with existing search term, keep focus on search input
    if (searchTerm) {
      document.querySelector<HTMLInputElement>('.search-input')?.focus();
    }
  };

  // Toggle filters display
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Get the first letter of the student's name for avatar
  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  // Get a background color based on the initial
  const getAvatarColor = (initial: string) => {
    const colors = [
      '#6366F1', // Indigo
      '#8B5CF6', // Violet
      '#EC4899', // Pink
      '#F43F5E', // Rose
      '#10B981', // Emerald
      '#3B82F6', // Blue
      '#8B5CF6', // Violet
    ];
    
    // Use the character code to select a color
    const index = initial.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Handle QR code icon click
  const handleQRCodeClick = (e: React.MouseEvent, student: Student) => {
    e.preventDefault();
    e.stopPropagation();
    
    setSelectedStudent(student);
    
    // Get the QR code URL from the StudentApi service
    const url = StudentApi.getQRCodeUrl(student.id, student);
    setQrCodeUrl(url);
    
    console.log('QR code data for student:', student.qrCode);
    
    // Set a flag for whether this is displaying an existing QR code or generating a new one
    const isExistingQRCode = !!student.qrCode;
    setIsExistingQRCode(isExistingQRCode);
    
    // Show the QR code modal
    setShowQRCode(true);
    
    // If we're generating a new QR code (not displaying an existing one), 
    // we should consider updating the backend to store it
    if (!isExistingQRCode) {
      console.log('No existing QR code found. A new one will be generated.');
    } else {
      console.log('Displaying existing QR code for student:', student.id);
    }
  };
  
  // Handle adding a new student
  const handleAddStudent = () => {
    setStudentCreationError(null); // Clear any previous error
    setShowAddModal(true);
  };
  
  // Handle when a student is successfully added
  const handleStudentAdded = (newStudent: Student) => {
    // Clear any previous error
    setStudentCreationError(null);
    
    // Add the new student to the list
    setStudents(prevStudents => [newStudent, ...prevStudents]);
    
    // Update search results if needed
    if (!searchTerm || 
        searchFilter === 'all' ||
        (searchFilter === 'id' && String(newStudent.id).includes(searchTerm)) ||
        (searchFilter === 'name' && newStudent.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (searchFilter === 'cn' && newStudent.cn?.toLowerCase().includes(searchTerm.toLowerCase()))) {
      setSearchResults(prevResults => [newStudent, ...prevResults]);
    }
  };
  
  // Handle student creation error
  const handleCreationError = (errorMessage: string) => {
    setStudentCreationError(errorMessage);
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setStudentCreationError(null);
    }, 5000);
  };

  // Handle edit button click
  const handleEditClick = (e: React.MouseEvent, student: Student) => {
    e.preventDefault();
    e.stopPropagation();
    
    setSelectedStudent(student);
    setShowEditModal(true);
  };
  
  // Handle student update
  const handleStudentUpdated = (updatedStudent: Student) => {
    // Clear any previous error
    setStudentUpdateError(null);
    
    // Update the student in the list
    setStudents(prevStudents => 
      prevStudents.map(student => 
        student.id === updatedStudent.id ? updatedStudent : student
      )
    );
    
    // Update search results if needed
    setSearchResults(prevResults => 
      prevResults.map(student => 
        student.id === updatedStudent.id ? updatedStudent : student
      )
    );
  };
  
  // Handle student update error
  const handleUpdateError = (errorMessage: string) => {
    setStudentUpdateError(errorMessage);
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setStudentUpdateError(null);
    }, 5000);
  };

  // Get placeholder text based on current filter
  const getPlaceholderText = () => {
    switch (searchFilter) {
      case 'id': return 'Search by Student ID (e.g., 10001)';
      case 'cn': return 'Search by CN Number';
      case 'name': return 'Search by Student Name';
      case 'card': return 'Search by Card Number';
      default: return 'Search students by ID, name, CN, etc.';
    }
  };

  // Add the print ID card handler function
  const handlePrintIDCard = (student: Student) => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print ID card');
      return;
    }

    // Generate QR code value as JSON object to match database format
    const qrCodeData = {
      student_id: student.id,
      cn: student.cn || '',
      full_name: student.name,
      card_number: student.card_id || '',
      university_id: student.university_id || 0
    };
    const qrCodeValue = JSON.stringify(qrCodeData);

    // Create the HTML content for printing
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Student ID Card</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              padding: 20px;
            }
            .id-card {
              width: 320px;
              height: 200px;
              border: 1px solid #ccc;
              border-radius: 10px;
              padding: 15px;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
              display: flex;
              flex-direction: column;
            }
            .header {
              text-align: center;
              margin-bottom: 15px;
              border-bottom: 2px solid #0066cc;
              padding-bottom: 10px;
            }
            .header h1 {
              margin: 0;
              color: #0066cc;
              font-size: 20px;
            }
            .content {
              display: flex;
              flex-grow: 1;
            }
            .info {
              flex: 2;
            }
            .qr-code {
              flex: 1;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .info p {
              margin: 5px 0;
              font-size: 14px;
            }
            .label {
              font-weight: bold;
              color: #555;
            }
            @media print {
              body {
                padding: 0;
                margin: 0;
              }
              .id-card {
                width: 100%;
                height: 100%;
                border: none;
                box-shadow: none;
              }
              @page {
                size: 9cm 5.5cm;
                margin: 0;
              }
            }
          </style>
        </head>
        <body onload="window.print(); window.setTimeout(function(){ window.close(); }, 500);">
          <div class="id-card">
            <div class="header">
              <h1>Student ID Card</h1>
            </div>
            <div class="content">
              <div class="info">
                <p><span class="label">Name:</span> ${student.name}</p>
                <p><span class="label">Student ID:</span> ${student.id}</p>
                <p><span class="label">CN:</span> ${student.cn || 'N/A'}</p>
                <p><span class="label">Card ID:</span> ${student.card_id || 'N/A'}</p>
              </div>
              <div class="qr-code">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrCodeValue)}" alt="QR Code" />
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Write the HTML content to the new window
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Loading state
  if (loading) {
    return (
      <PageTemplate 
        title="Students" 
        subtitle="Loading student data..."
        accessLevel={['admin', 'staff']}
      >
        <div className="loading-container">
          <FaSpinner className="loading-spinner" />
          <p>Loading students data...</p>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate 
      title="Students" 
      subtitle={useFallback ? "Using sample data - API connection failed" : ""}
      accessLevel={['admin', 'staff']}
    >
      <div>
        {error && !loading && (
          <div className="notification warning">
            <FaExclamationTriangle /> {error}
          </div>
        )}
        
        {/* Add student creation error notification */}
        {studentCreationError && (
          <div className="notification warning">
            <FaExclamationTriangle /> {studentCreationError}
          </div>
        )}
        
        {/* Add student update error notification */}
        {studentUpdateError && (
          <div className="notification warning">
            <FaExclamationTriangle /> {studentUpdateError}
          </div>
        )}
        
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
                    id="filter-cn" 
                    name="search-filter" 
                    checked={searchFilter === 'cn'} 
                    onChange={() => handleFilterChange('cn')} 
                  />
                  <label htmlFor="filter-cn">CN Number</label>
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
          
          <button 
            className="add-button" 
            onClick={handleAddStudent}
          >
            <FaPlus className="add-icon" />
            Add Student
          </button>
        </div>

        {students.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>CN</th>
                <th>Full Name</th>
                <th>Profile</th>
                <th>University</th>
                <th>Balance</th>
                <th>Card Number</th>
                <th>QR Code</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map(student => {
                const initial = getInitial(student.name);
                const avatarColor = getAvatarColor(initial);
                
                return (
                  <tr key={student.id}>
                    <td>{student.id}</td>
                    <td>{student.cn || '-'}</td>
                    <td>{student.name}</td>
                    <td>
                      <div 
                        className="student-avatar"
                        style={{ backgroundColor: avatarColor }}
                      >
                        {initial}
                      </div>
                    </td>
                    <td>{getUniversityName(student.university_id)}</td>
                    <td className={`${student.balance && student.balance > 0 ? 'positive-balance' : 'zero-balance'} balance-cell`}>
                      <span className="balance-amount">
                        {student.balance ? student.balance.toFixed(2) : '0.00'}
                      </span>
                      <span className="balance-currency">DT</span>
                    </td>
                    <td className="card-number">{student.card_id || '-'}</td>
                    <td>
                      {student.qrCode ? (
                        <button
                          onClick={(e) => handleQRCodeClick(e, student)}
                          className="qr-code-button"
                          title="View QR Code"
                          type="button"
                        >
                          <FaQrcode />
                          <span className="sr-only">View QR Code</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleQRCodeClick(e, student)}
                          className="qr-code-button"
                          title="Generate QR Code"
                          type="button"
                        >
                          <FaQrcode />
                          <span className="sr-only">Generate QR Code</span>
                        </button>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                      <button 
                        className="edit-button"
                        onClick={(e) => handleEditClick(e, student)}
                        title="Edit Student"
                      >
                          <FaEdit />
                        </button>
                        
                        <button 
                          className="print-button"
                          onClick={() => handlePrintIDCard(student)}
                          title="Print ID Card"
                        >
                          <FaPrint />
                      </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>No students data available</p>
            <button className="action-button" onClick={() => window.location.reload()}>
              Refresh
            </button>
          </div>
        )}
        
        {students.length > 0 && searchResults.length === 0 && (
          <div className="no-results">
            <p>
              {searchFilter === 'id' 
                ? `No student with ID "${searchTerm}" found.` 
                : `No students found matching "${searchTerm}".`}
            </p>
            {searchTerm && (
              <button className="action-button" onClick={clearSearch}>
                Clear Search
              </button>
            )}
          </div>
        )}

        {/* QR Code Modal */}
        {showQRCode && selectedStudent && (
          <QRCodeModal
            studentId={selectedStudent.id}
            studentName={selectedStudent.name}
            qrCodeUrl={qrCodeUrl}
            onClose={() => setShowQRCode(false)}
            isExistingQRCode={isExistingQRCode}
          />
        )}
        
        {/* Add Student Modal */}
        {showAddModal && (
          <AddStudentModal
            onClose={() => setShowAddModal(false)}
            onStudentAdded={handleStudentAdded}
            onError={handleCreationError}
          />
        )}
        
        {/* Edit Student Modal */}
        {showEditModal && selectedStudent && (
          <EditStudentModal
            student={selectedStudent}
            onClose={() => setShowEditModal(false)}
            onStudentUpdated={handleStudentUpdated}
            onError={handleUpdateError}
          />
        )}
      </div>
      
      {/* Replace style jsx with regular CSS class */}
      <style>
        {`
        .action-buttons {
          display: flex;
          gap: 8px;
        }
        
        .print-button {
          background: none;
          border: none;
          color: #6366F1;
          cursor: pointer;
          padding: 6px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }
        
        .print-button:hover {
          background-color: rgba(99, 102, 241, 0.1);
        }
        `}
      </style>
    </PageTemplate>
  );
};

export default Students; 