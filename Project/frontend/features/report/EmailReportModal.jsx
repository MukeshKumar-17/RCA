import { useState } from 'react';

export default function EmailReportModal({ isOpen, onClose, incidentId, incidentTitle }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!email) {
      setError('Please enter an email address.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const response = await fetch(
        `${API_BASE}/report/${incidentId}/send-email`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to_email: email, message }),
        }
      );

      if (response.ok) {
        setSuccess(true);
        setLoading(false);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setEmail('');
          setMessage('');
        }, 2000);
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.detail || 'Failed to send email');
        setLoading(false);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-container-highest/80 backdrop-blur-sm animate-fade-in">
      <div className="bento-tile w-full max-w-md p-6 bg-surface-container-lowest shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline-md text-[20px] text-on-surface">Send RCA Report</h2>
          <button onClick={onClose} className="text-outline hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Email field */}
        <label className="block font-label-md text-[13px] text-outline mb-1.5">Developer Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="developer@company.com"
          className="w-full bento-tile px-4 py-3 bg-surface-container font-body-md text-[14px] mb-4 focus:ring-2 focus:ring-primary focus:outline-none"
        />

        {/* Message field */}
        <label className="block font-label-md text-[13px] text-outline mb-1.5">Message (optional)</label>
        <textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Please review this RCA report..."
          className="w-full bento-tile px-4 py-3 bg-surface-container font-body-md text-[14px] mb-3 focus:ring-2 focus:ring-primary focus:outline-none resize-none"
        />

        {/* Info text */}
        <p className="font-body-sm text-[12px] text-outline mb-4">
          The full RCA report will be attached as a PDF.
        </p>

        {/* Error display */}
        {error && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-error-container text-on-error-container font-body-sm text-[13px]">
            {error}
          </div>
        )}

        {/* Success display */}
        {success && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-tertiary-container text-on-tertiary-container font-body-sm text-[13px]">
            ✓ Email sent successfully!
          </div>
        )}

        {/* Button row */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="font-label-md text-label-md px-4 py-2 text-outline hover:text-on-surface transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={loading || !email}
            className="font-label-md text-label-md px-6 py-2 bg-primary text-on-primary rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {loading ? (
              <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[16px]">send</span>
            )}
            {loading ? 'Sending...' : 'Send Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
