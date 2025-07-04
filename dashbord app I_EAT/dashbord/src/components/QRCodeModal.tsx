import React, { useState } from 'react';
import { StudentApi } from '../services/api.service';
import DownloadHistoryModal from './DownloadHistoryModal';
import '../styles/QRCodeModal.css';

interface QRCodeModalProps {
  studentId: number;
  studentName: string;
  qrCodeUrl: string;
  isExistingQRCode?: boolean;
  onClose: () => void;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ 
  studentId, 
  studentName, 
  qrCodeUrl, 
  isExistingQRCode = false,
  onClose 
}) => {
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadComplete, setDownloadComplete] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async (e: React.MouseEvent) => {
    // Prevent default action to avoid any page navigation
    e.preventDefault();
    e.stopPropagation();
    
    if (isDownloading) return;
    
    try {
      setIsDownloading(true);
      setDownloadError(null);
      
      // First fetch the image as a blob
      const response = await fetch(qrCodeUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Create object URL from blob
      const objectUrl = URL.createObjectURL(blob);
      
      // Create temporary link element for download
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `${studentName.replace(/\s+/g, '-')}-qrcode.png`;
      link.style.display = 'none';
      
      // Add link to document, click it, and remove it
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
      }, 100);
      
      // Log the download
      await StudentApi.logDownload(studentId, 'QR Code');
      
      // Show download complete notification
      setDownloadComplete(true);
      setTimeout(() => {
        setDownloadComplete(false);
      }, 3000);
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadError(error instanceof Error ? error.message : 'Failed to download QR code');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleViewHistory = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowHistory(true);
  };

  return (
    <>
      <div className="qr-modal-backdrop" onClick={onClose}>
        <div className="qr-modal-container" onClick={e => e.stopPropagation()}>
          <h2 className="qr-modal-title">Student QR Code</h2>
          
          {!isExistingQRCode && (
            <div className="qr-code-status new-qr-code">
              <span>✨ This is a newly generated QR code</span>
            </div>
          )}
          
          <div className="qr-code-image-container">
            <img 
              src={qrCodeUrl} 
              alt={`QR Code for ${studentName}`} 
              className="qr-code-image"
            />
          </div>
          
          <div className="qr-info-container">
            <p className="qr-code-info">Student: {studentName}</p>
            <p className="qr-code-info">ID: {studentId}</p>
            <p className="qr-code-info">Status: {isExistingQRCode ? 'Existing QR Code' : 'Newly Generated'}</p>
          </div>
          
          <div className="qr-modal-actions">
            {downloadComplete && (
              <div className="download-notification">
                <span>✓ Download complete</span>
              </div>
            )}
            
            {downloadError && (
              <div className="download-error-notification">
                <span>❌ {downloadError}</span>
              </div>
            )}
            
            <button 
              className={`download-qr-button ${isDownloading ? 'downloading' : ''}`}
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? 'Downloading...' : 'Download QR Code'}
            </button>
            
            <button 
              className="view-history-button"
              onClick={handleViewHistory}
            >
              View Download History
            </button>
          </div>
          
          <button 
            className="qr-modal-close" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
          >
            Close
          </button>
        </div>
      </div>
      
      {showHistory && (
        <DownloadHistoryModal
          studentId={studentId}
          studentName={studentName}
          onClose={() => setShowHistory(false)}
        />
      )}
    </>
  );
};

export default QRCodeModal; 