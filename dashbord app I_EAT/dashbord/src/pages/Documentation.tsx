import React, { useState } from 'react';
import PageTemplate from '../components/PageTemplate';
import { FaSearch, FaBook, FaCreditCard, FaUtensils, FaTicketAlt, FaUniversity, FaUserGraduate, FaCog } from 'react-icons/fa';
import '../styles/Pages.css';

interface DocItem {
  id: string;
  title: string;
  section: string;
  icon: React.ReactNode;
  content: string;
}

const Documentation: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('all');
  
  const docItems: DocItem[] = [
    {
      id: 'food-1',
      title: 'Adding Food Items',
      section: 'food',
      icon: <FaUtensils />,
      content: `
        <h3>Adding Food Items to the System</h3>
        <p>This guide will walk you through the process of adding new food items to the system inventory.</p>
        
        <h4>Steps to Add a Food Item:</h4>
        <ol>
          <li>Navigate to the Food Management page from the sidebar menu.</li>
          <li>Click the "Add Food Item" button in the upper right corner.</li>
          <li>Fill in the required information:
            <ul>
              <li>Name - The full name of the food item</li>
              <li>Price - The price in dollars</li>
              <li>Category - Select from existing categories or create a new one</li>
              <li>Description - A brief description of the item</li>
              <li>Available - Toggle whether the item is currently available</li>
            </ul>
          </li>
          <li>Upload an image of the food item if available.</li>
          <li>Click "Save" to add the item to the system.</li>
        </ol>
        
        <p>Once added, the food item will appear in the food listings and will be available for students to order if marked as available.</p>
      `
    },
    {
      id: 'cards-1',
      title: 'Managing University Cards',
      section: 'cards',
      icon: <FaCreditCard />,
      content: `
        <h3>University Card Management</h3>
        <p>University cards are the primary payment method for students within the system. This guide explains how to manage card accounts.</p>
        
        <h4>Features:</h4>
        <ul>
          <li>View all active university cards</li>
          <li>Add funds to student accounts</li>
          <li>Deduct funds for payments (Admin only)</li>
          <li>Activate or deactivate cards</li>
          <li>View transaction history</li>
        </ul>
        
        <h4>Adding Funds:</h4>
        <ol>
          <li>Navigate to University Cards in the sidebar</li>
          <li>Find the student's card account</li>
          <li>Click "Add Funds"</li>
          <li>Enter the amount and payment source</li>
          <li>Confirm the transaction</li>
        </ol>
        
        <p>Note: Staff users can view cards and information but cannot subtract funds from accounts. This is an admin-only function.</p>
      `
    },
    {
      id: 'tickets-1',
      title: 'Support Ticket System',
      section: 'tickets',
      icon: <FaTicketAlt />,
      content: `
        <h3>Support Ticket System</h3>
        <p>The ticket system allows students to report issues and request assistance. This guide explains how to manage incoming tickets.</p>
        
        <h4>Ticket Priority Levels:</h4>
        <ul>
          <li><strong>High:</strong> Urgent issues requiring immediate attention (payment failures, account lockouts)</li>
          <li><strong>Medium:</strong> Standard issues that should be resolved within 24 hours</li>
          <li><strong>Low:</strong> General inquiries and non-urgent matters</li>
        </ul>
        
        <h4>Ticket Workflow:</h4>
        <ol>
          <li>New tickets are automatically assigned a "Open" status</li>
          <li>Assign the ticket to a staff member and change status to "In Progress"</li>
          <li>Once resolved, update the status to "Closed"</li>
          <li>All actions are logged in the ticket history</li>
        </ol>
        
        <p>Students can view the status of their tickets through the student portal.</p>
      `
    },
    {
      id: 'university-1',
      title: 'University Partner Management',
      section: 'university',
      icon: <FaUniversity />,
      content: `
        <h3>University Partner Management</h3>
        <p>This system connects with multiple university partners. This guide explains how to add and manage university partners.</p>
        
        <h4>Adding a New University:</h4>
        <ol>
          <li>Navigate to Universities in the sidebar</li>
          <li>Click "Add University"</li>
          <li>Fill in the university details:
            <ul>
              <li>Name and location</li>
              <li>Primary contact information</li>
              <li>Student population</li>
              <li>Integration settings</li>
            </ul>
          </li>
          <li>Upload the university logo</li>
          <li>Save the university profile</li>
        </ol>
        
        <h4>Integration Requirements:</h4>
        <p>Each university partner needs to provide API access to their student database for authentication purposes. Contact the IT department of the university to establish this connection.</p>
      `
    },
    {
      id: 'student-1',
      title: 'Student Account Management',
      section: 'students',
      icon: <FaUserGraduate />,
      content: `
        <h3>Student Account Management</h3>
        <p>This guide covers the process of managing student accounts in the system.</p>
        
        <h4>Student Account Creation:</h4>
        <p>Student accounts are typically created through one of three methods:</p>
        <ol>
          <li>Batch import from university registrar data</li>
          <li>API integration with university systems</li>
          <li>Manual creation by administrators</li>
        </ol>
        
        <h4>Managing Existing Students:</h4>
        <ul>
          <li>View student profiles, including contact information and enrollment status</li>
          <li>Update student information if needed</li>
          <li>View associated university card and transaction history</li>
          <li>Activate or deactivate student accounts</li>
        </ul>
        
        <p>Note: Students cannot be fully deleted from the system for audit purposes, but they can be deactivated when they graduate or leave the university.</p>
      `
    },
    {
      id: 'settings-1',
      title: 'System Configuration',
      section: 'settings',
      icon: <FaCog />,
      content: `
        <h3>System Configuration</h3>
        <p>This guide provides information on configuring the system settings.</p>
        
        <h4>Available Configuration Options:</h4>
        <ul>
          <li><strong>User Management:</strong> Add, remove, and manage user accounts and permissions</li>
          <li><strong>Payment Gateways:</strong> Configure payment processing options</li>
          <li><strong>Email Notifications:</strong> Set up email templates and notification rules</li>
          <li><strong>System Appearance:</strong> Customize the look and feel of the interface</li>
          <li><strong>Backup & Restore:</strong> Configure automatic backups and restore points</li>
        </ul>
        
        <h4>Admin-Only Settings:</h4>
        <p>Certain configuration options are restricted to admin users only:</p>
        <ul>
          <li>User role management</li>
          <li>Payment gateway API keys</li>
          <li>System-wide email settings</li>
          <li>Data purge operations</li>
        </ul>
        
        <p>Always test any configuration changes in a test environment before applying to production.</p>
      `
    },
  ];

  const filteredDocs = docItems.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSection = selectedSection === 'all' || item.section === selectedSection;
    
    return matchesSearch && matchesSection;
  });

  const getIconForSection = (section: string) => {
    switch(section) {
      case 'food': return <FaUtensils />;
      case 'cards': return <FaCreditCard />;
      case 'tickets': return <FaTicketAlt />;
      case 'university': return <FaUniversity />;
      case 'students': return <FaUserGraduate />;
      case 'settings': return <FaCog />;
      default: return <FaBook />;
    }
  };

  const [selectedDoc, setSelectedDoc] = useState<DocItem | null>(null);

  return (
    <PageTemplate 
      title="Documentation" 
      subtitle="System documentation and user guides" 
      accessLevel={[]}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: '16px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
            <FaSearch style={{ position: 'absolute', top: '12px', left: '12px', color: '#6b7280' }} />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 10px 10px 40px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '0.95rem'
              }}
            />
          </div>
          
          <div>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '0.95rem'
              }}
            >
              <option value="all">All Sections</option>
              <option value="food">Food Management</option>
              <option value="cards">University Cards</option>
              <option value="tickets">Support Tickets</option>
              <option value="university">Universities</option>
              <option value="students">Students</option>
              <option value="settings">System Settings</option>
            </select>
          </div>
        </div>

        {selectedDoc ? (
          <div className="card-item" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <span>{selectedDoc.icon}</span>
                {selectedDoc.title}
              </h2>
              <button 
                className="action-button"
                style={{ padding: '4px 8px' }}
                onClick={() => setSelectedDoc(null)}
              >
                Back to List
              </button>
            </div>
            <div dangerouslySetInnerHTML={{ __html: selectedDoc.content }}></div>
          </div>
        ) : (
          <div className="grid-container">
            {filteredDocs.map(doc => (
              <div 
                key={doc.id} 
                className="card-item"
                style={{ cursor: 'pointer' }} 
                onClick={() => setSelectedDoc(doc)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '8px',
                    backgroundColor: '#e2e8f0',
                    color: '#0f172a'
                  }}>
                    {doc.icon}
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{doc.title}</h3>
                </div>
                <p style={{ margin: '0 0 12px', color: '#6b7280' }}>
                  {doc.content.replace(/<[^>]*>?/gm, '').substring(0, 120)}...
                </p>
                <div style={{ fontSize: '0.85rem', color: '#3b82f6' }}>
                  Click to read more
                </div>
              </div>
            ))}
          </div>
        )}
        
        {filteredDocs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
            <FaBook style={{ fontSize: '3rem', marginBottom: '16px' }} />
            <p style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No documentation found</p>
            <p>Try adjusting your search terms or select a different category.</p>
          </div>
        )}
      </div>
    </PageTemplate>
  );
};

export default Documentation; 