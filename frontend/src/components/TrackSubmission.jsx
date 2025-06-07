import { useState } from 'react';

function ModernInput({ label, type = 'text', value, onChange, required = false, ...props }) {
  return (
    <div className="flex items-center gap-6 my-6 w-full">
      <label
        htmlFor={props.id}
        className="text-[#CFFF04] text-lg font-bold w-48 text-right"
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="flex-1 bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-200 rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow"
        placeholder={label}
        {...props}
      />
    </div>
  );
}

function ModernTextarea({ label, value, onChange, ...props }) {
  return (
    <div className="flex items-start gap-6 my-6 w-full">
      <label
        className="text-[#CFFF04] text-lg font-bold w-48 text-right pt-2"
      >
        {label}
      </label>
      <textarea
        value={value}
        onChange={onChange}
        className="flex-1 bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-200 rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow min-h-[120px] resize-none"
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
    <div className="flex flex-col items-center justify-center min-h-[80vh] font-['Roboto']">
      <link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet" />
      <div className="w-full max-w-4xl bg-gradient-to-br from-[#2D0036]/40 via-[#0A0A23]/40 to-[#1a1a40]/40 rounded-3xl p-16 shadow-2xl border-2 border-[#CFFF04]/20 backdrop-blur-md">
        <h2 className="text-5xl font-extrabold text-[#CFFF04] mb-16 drop-shadow-[0_0_16px_#CFFF04] tracking-wide text-center font-['Roboto']">Proposer un morceau</h2>
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
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
          <div className="flex justify-end mt-8">
            <button
              type="submit"
              className="w-[300px] py-6 rounded-[2rem] font-bold text-2xl bg-gradient-to-r from-[#CFFF04] to-[#CFFF04]/80 text-[#2D0036] shadow-[0_0_32px_#CFFF04] hover:from-[#FF4FAD] hover:to-[#FF4FAD]/80 hover:text-white transition-all duration-300 tracking-wide font-['Roboto'] transform hover:scale-[1.02]"
            >
              Envoyer
            </button>
          </div>
          {success && (
            <div className="text-green-400 font-bold mt-6 text-center text-xl bg-green-500/10 py-4 px-6 rounded-[2rem] border-2 border-green-500/20">
              Merci pour ta proposition !
            </div>
          )}
          {error && (
            <div className="text-red-400 font-bold mt-6 text-center text-xl bg-red-500/10 py-4 px-6 rounded-[2rem] border-2 border-red-500/20">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
} 