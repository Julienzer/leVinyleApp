import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

export default function TrackCard({ track, onApprove, onReject, showActions = false }) {
  return (
    <div className="bg-gradient-to-br from-[#2D0036]/60 via-[#0A0A23]/60 to-[#1a1a40]/60 rounded-2xl p-12 shadow-2xl border-2 border-[#DBFFA8]/20 backdrop-blur-md">
      <div className="flex items-start justify-between gap-12">
        <div className="flex-1 space-y-4">
          <h3 className="text-4xl font-extrabold text-[#DBFFA8] drop-shadow-[0_0_16px_#CFF04] mb-4">{track.title}</h3>
          <p className="text-pink-400 font-semibold text-2xl mb-2">{track.artist}</p>
          <p className="text-lg text-[#00FFD0] mt-4">Proposé par {track.submitted_by}</p>
        </div>
        {showActions && (
          <div className="flex flex-col gap-6 items-center ml-8">
            <button
              onClick={() => onApprove(track.id)}
              className="p-4 bg-green-500/20 hover:bg-green-400/40 rounded-full text-green-400 shadow-lg transition-all text-2xl hover:scale-110"
              title="Approuver"
            >
              <CheckIcon className="w-8 h-8" />
            </button>
            <button
              onClick={() => onReject(track.id)}
              className="p-4 bg-red-500/20 hover:bg-red-400/40 rounded-full text-red-400 shadow-lg transition-all text-2xl hover:scale-110"
              title="Refuser"
            >
              <XMarkIcon className="w-8 h-8" />
            </button>
          </div>
        )}
      </div>
      <a
        href={track.spotify_url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-flex items-center text-xl font-bold text-[#DBFFA8] hover:text-[#FF4FAD] transition drop-shadow-[0_0_16px_#CFF04] hover:scale-105"
      >
        <span className="mr-3 text-2xl">🎵</span> Écouter sur Spotify
      </a>
    </div>
  );
} 