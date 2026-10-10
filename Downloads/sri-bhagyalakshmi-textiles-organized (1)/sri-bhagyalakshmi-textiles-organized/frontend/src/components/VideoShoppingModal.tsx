import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';

interface VideoShoppingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VideoShoppingModal: React.FC<VideoShoppingModalProps> = ({ isOpen, onClose }) => {
  const { categories } = useStore();
  const [selectedPreference, setSelectedPreference] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('WhatsApp Video');
  const [selectedLanguage, setSelectedLanguage] = useState('Tamil & English');
  const [preferredDate, setPreferredDate] = useState('Tomorrow');
  const [preferredTime, setPreferredTime] = useState('Morning Daylight (10:30 AM)');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [scheduledSuccess, setScheduledSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setScheduledSuccess(true);
  };

  const generateWhatsAppLink = () => {
    const text = `Vanakkam! Sri Bhagyalakshmi Textiles, I would like to schedule a daylight video drape call:
- Name: ${clientName || 'Handloom Patron'}
- Mobile: ${clientPhone || 'Phone number'}
- Interest: ${selectedPreference}
- Preferred Time: ${preferredDate} at ${preferredTime}
- Platform: ${selectedPlatform}
- Language: ${selectedLanguage}

Looking forward to inspecting the weaves!`;
    return `https://wa.me/917358616601?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex justify-center items-center p-4 animate-fadeIn">
      <div className="relative bg-[#FAF7F2] text-[#181512] w-full max-w-xl border border-[#E5DFD5] shadow-2xl p-6 sm:p-8 modal-panel">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#756F66] hover:text-[#181512] transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[24px]">close</span>
        </button>

        {scheduledSuccess ? (
          <div className="text-center py-8 space-y-4">
            <span className="w-14 h-14 rounded-full bg-[#173629] text-white flex items-center justify-center mx-auto text-3xl">
              ✓
            </span>
            <h2 className="font-serif text-3xl text-[#181512]">Slot Reserved</h2>
            <p className="font-sans text-xs text-[#756F66] max-w-md mx-auto leading-relaxed">
              We will start the {selectedPlatform} session on {preferredDate} at {preferredTime} in {selectedLanguage}.
            </p>
            <div className="pt-4 flex flex-col gap-3">
              <a
                href={generateWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 bg-[#25D366] text-white text-[11px] uppercase tracking-luxury hover:bg-[#128C7E] transition-colors font-medium text-center"
              >
                Send Confirmation on WhatsApp
              </a>
              <button
                onClick={() => {
                  setScheduledSuccess(false);
                  onClose();
                }}
                className="w-full py-3 border border-[#181512] text-[#181512] text-[11px] uppercase tracking-luxury hover:bg-[#181512] hover:text-white transition-colors cursor-pointer"
              >
                Return to Collection
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#181512] font-normal leading-snug">
              Video Shopping
            </h2>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="font-sans text-[10px] uppercase tracking-luxury text-[#181512] block mb-1">
                  Category
                </label>
                <select
                  value={selectedPreference}
                  onChange={(e) => setSelectedPreference(e.target.value)}
                  className="w-full bg-white border border-[#E5DFD5] px-3 py-2 text-xs focus:outline-none focus:border-[#c89d42]"
                >
                  <option value="">Any</option>
                  {categories.map((c) => (
                    <option key={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-sans text-[10px] uppercase tracking-luxury text-[#181512] block mb-1">
                    Preferred Date
                  </label>
                  <select
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full bg-white border border-[#E5DFD5] px-3 py-2 text-xs focus:outline-none focus:border-[#c89d42]"
                  >
                    <option>Today Afternoon</option>
                    <option>Tomorrow</option>
                    <option>This Weekend</option>
                  </select>
                </div>
                <div>
                  <label className="font-sans text-[10px] uppercase tracking-luxury text-[#181512] block mb-1">
                    Daylight Time Slot
                  </label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full bg-white border border-[#E5DFD5] px-3 py-2 text-xs focus:outline-none focus:border-[#c89d42]"
                  >
                    <option>Morning (10:30 AM – 12:00 PM)</option>
                    <option>Afternoon (02:00 PM – 04:00 PM)</option>
                    <option>Golden Hour (04:30 PM – 06:30 PM)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-sans text-[10px] uppercase tracking-luxury text-[#181512] block mb-1">
                    Platform
                  </label>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    className="w-full bg-white border border-[#E5DFD5] px-3 py-2 text-xs focus:outline-none focus:border-[#c89d42]"
                  >
                    <option>WhatsApp Video Call</option>
                    <option>Zoom Meeting</option>
                    <option>Google Meet</option>
                  </select>
                </div>
                <div>
                  <label className="font-sans text-[10px] uppercase tracking-luxury text-[#181512] block mb-1">
                    Language
                  </label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full bg-white border border-[#E5DFD5] px-3 py-2 text-xs focus:outline-none focus:border-[#c89d42]"
                  >
                    <option>Tamil &amp; English</option>
                    <option>English</option>
                    <option>Hindi &amp; English</option>
                    <option>Telugu</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-sans text-[10px] uppercase tracking-luxury text-[#181512] block mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Your name"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-white border border-[#E5DFD5] px-3 py-2 text-xs focus:outline-none focus:border-[#c89d42]"
                  />
                </div>
                <div>
                  <label className="font-sans text-[10px] uppercase tracking-luxury text-[#181512] block mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Phone number"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full bg-white border border-[#E5DFD5] px-3 py-2 text-xs focus:outline-none focus:border-[#c89d42]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#181512] text-white text-[11px] uppercase tracking-luxury hover:bg-[#c89d42] hover:text-[#181512] transition-colors font-medium cursor-pointer"
                >
                  Confirm Slot
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
