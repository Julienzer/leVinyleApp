import { useState } from 'react';

function ModernInput({ label, type = 'text', value, onChange, required = false, ...props }) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label
        htmlFor={props.id}
        className="text-[#CFFF04] text-base font-bold mb-1"
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full bg-[#181826]/80 text-white text-base border-2 border-[#CFFF04]/30 rounded-xl px-4 py-2 transition-all duration-300 focus:outline-none focus:border-[#CFFF04] hover:border-[#CFFF04]/60 shadow focus:shadow-[0_0_10px_#CFFF04/30] placeholder:text-white/50"
        placeholder={label}
        {...props}
      />
    </div>
  );
}

function ModernTextarea({ label, value, onChange, ...props }) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label
        className="text-[#CFFF04] text-base font-bold mb-1"
      >
        {label}
      </label>
      <textarea
        value={value}
        onChange={onChange}
        className="w-full bg-[#181826]/80 text-white text-base border-2 border-[#CFFF04]/30 rounded-xl px-4 py-2 transition-all duration-300 focus:outline-none focus:border-[#CFFF04] hover:border-[#CFFF04]/60 shadow focus:shadow-[0_0_10px_#CFFF04/30] placeholder:text-white/50 min-h-[80px] resize-none"
        placeholder={label}
        {...props}
      />
    </div>
  );
}

export default function TrackSubmission() {
  const [url, setUrl] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess(true);
    setError('');
    // Ici, tu pourras brancher l'API plus tard
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] font-['Roboto']">
      <div className="w-full max-w-md bg-gradient-to-br from-[#2D0036]/60 via-[#0A0A23]/60 to-[#1a1a40]/60 rounded-2xl p-4 sm:p-6 shadow-xl border-2 border-[#CFFF04]/20 backdrop-blur-md mx-auto">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#CFFF04] mb-6 drop-shadow-[0_0_8px_#CFFF04] tracking-wide text-center font-['Roboto']">Proposer un morceau</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <ModernInput
            label="Lien Spotify"
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            required
            id="track-url"
            autoComplete="off"
          />
          <ModernInput
            label="Ton pseudo"
            type="text"
            value={pseudo}
            onChange={e => setPseudo(e.target.value)}
            required
            id="track-pseudo"
            autoComplete="off"
          />
          <ModernTextarea
            label="Message (optionnel)"
            value={message}
            onChange={e => setMessage(e.target.value)}
            id="track-message"
          />
          <button
            type="submit"
            className="w-full py-3 rounded-full font-bold text-lg bg-gradient-to-r from-[#CFFF04] to-[#CFFF04]/80 text-[#2D0036] shadow hover:from-[#FF4FAD] hover:to-[#FF4FAD]/80 hover:text-white transition-all duration-300 tracking-wide font-['Roboto'] transform hover:scale-[1.03] hover:shadow-[0_0_20px_#FF4FAD] focus:outline-none focus:ring-2 focus:ring-[#CFFF04] focus:ring-offset-2 focus:ring-offset-[#2D0036]"
          >
            Envoyer
          </button>
          {success && (
            <div className="text-green-400 font-bold mt-4 text-center text-base bg-green-500/10 py-3 px-4 rounded-[2rem] border-2 border-green-500/20 backdrop-blur-sm">
              Merci pour ta proposition !
            </div>
          )}
          {error && (
            <div className="text-red-400 font-bold mt-4 text-center text-base bg-red-500/10 py-3 px-4 rounded-[2rem] border-2 border-red-500/20 backdrop-blur-sm">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
} 