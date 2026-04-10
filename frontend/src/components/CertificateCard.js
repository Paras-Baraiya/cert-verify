import React, { useRef } from 'react';
import toast from 'react-hot-toast';
import { API } from '../context/AuthContext';

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
};

const CertificateCard = ({ cert }) => {
  const certRef = useRef(null);

  const handleDownload = async () => {
    try {
      toast.loading('Generating PDF...', { id: 'pdf' });

      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');

      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, (pdf.internal.pageSize.getHeight() - pdfHeight) / 2, pdfWidth, pdfHeight);
      pdf.save(`Certificate_${cert.certificateId}.pdf`);

      // Track download
      await API.post(`/certificates/track-download/${cert.certificateId}`).catch(() => {});
      toast.success('Certificate downloaded!', { id: 'pdf' });
    } catch (err) {
      toast.error('Download failed. Please try again.', { id: 'pdf' });
    }
  };

  const durationWeeks = Math.ceil(
    (new Date(cert.endDate) - new Date(cert.startDate)) / (1000 * 60 * 60 * 24 * 7)
  );

  return (
    <div className="certificate-wrapper">
      <div className="certificate" ref={certRef} id="certificate-print">
        <div className="cert-corner tl" /><div className="cert-corner tr" />
        <div className="cert-corner bl" /><div className="cert-corner br" />

        <div className="cert-logo">🎓</div>
        <div className="cert-org">Certificate Verification System</div>
        <div className="cert-id-badge">ID: {cert.certificateId}</div>

        <div className="cert-title-text">Certificate of Completion</div>
        <div className="cert-subtitle">Internship Program</div>

        <p className="cert-presented">This is to certify that</p>
        <div className="cert-name">{cert.studentName}</div>

        <p className="cert-body">
          has successfully completed an internship in the domain of{' '}
          <strong>{cert.internshipDomain}</strong> from{' '}
          <strong>{formatDate(cert.startDate)}</strong> to{' '}
          <strong>{formatDate(cert.endDate)}</strong>.
          Throughout the program, they demonstrated dedication, professionalism, and technical competence.
          Their performance has been rated as <strong>{cert.grade}</strong>.
        </p>

        <div className="cert-meta">
          <div className="cert-meta-item">
            <div className="cert-meta-label">Domain</div>
            <div className="cert-meta-value">{cert.internshipDomain}</div>
          </div>
          <div className="cert-meta-item">
            <div className="cert-meta-label">Duration</div>
            <div className="cert-meta-value">{durationWeeks} Weeks</div>
          </div>
          <div className="cert-meta-item">
            <div className="cert-meta-label">Performance</div>
            <div className="cert-meta-value">{cert.grade}</div>
          </div>
          {cert.college && (
            <div className="cert-meta-item">
              <div className="cert-meta-label">Institution</div>
              <div className="cert-meta-value">{cert.college}</div>
            </div>
          )}
        </div>

        <div className="cert-footer">
          <div className="cert-seal">
            <div className="seal-icon">🏅</div>
            <div className="seal-text">Verified</div>
          </div>
          <div style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.78rem' }}>
            Issued on {formatDate(cert.createdAt || new Date())}
          </div>
          <div className="cert-signature">
            <div className="sig-line" />
            <div className="sig-name">{cert.issuedBy || 'HR Department'}</div>
            <div className="sig-title">Authorized Signatory</div>
          </div>
        </div>
      </div>

      <div className="cert-actions">
        <button className="btn btn-gold" onClick={handleDownload}>
          ⬇️ Download PDF
        </button>
        <button className="btn btn-outline" onClick={() => window.print()}>
          🖨️ Print
        </button>
      </div>
    </div>
  );
};

export default CertificateCard;
