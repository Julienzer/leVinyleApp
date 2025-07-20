import React, { useState, useEffect } from 'react';
import Avatar from './Avatar';

export default function SpotifyLoginButton({ token, user }) {
  const [spotifyStatus, setSpotifyStatus] = useState({ authenticated: false, loading: true });

  useEffect(() => {
    // Ne vérifier le statut Spotify que si l'utilisateur est connecté à Twitch
    if (token && user) {
      checkSpotifyStatus();
    } else {
      setSpotifyStatus({ authenticated: false, loading: false, currentUser: null });
    }
  }, [token, user]);

  const checkSpotifyStatus = async () => {
    if (!token) {
      setSpotifyStatus({ authenticated: false, loading: false, currentUser: null });
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/spotify/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      setSpotifyStatus({ 
        authenticated: data.authenticated, 
        loading: false,
        currentUser: data.currentUser 
      });
    } catch (error) {
      console.error('Error checking Spotify status:', error);
      setSpotifyStatus({ authenticated: false, loading: false, currentUser: null });
    }
  };

  const handleSpotifyLogin = () => {
    if (!token) {
      console.error('Token Twitch requis pour se connecter à Spotify');
      return;
    }
    
    // Rediriger vers l'auth Spotify avec le token Twitch pour le lier
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/spotify`;
  };

  const handleSpotifyLogout = async () => {
    if (!token) {
      console.error('Token Twitch requis pour se déconnecter de Spotify');
      return;
    }

    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/spotify/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      // Rafraîchir le statut après déconnexion
      checkSpotifyStatus();
    } catch (error) {
      console.error('Error logging out of Spotify:', error);
      // Même en cas d'erreur, on peut essayer de rafraîchir le statut
      checkSpotifyStatus();
    }
  };

  // Si pas de token Twitch, ne rien afficher
  if (!token || !user) {
    return null;
  }

  if (spotifyStatus.loading) {
    return (
      <button
        disabled
        className="px-6 py-3 rounded-full font-bold text-base bg-gray-500 text-white opacity-50 cursor-not-allowed flex items-center gap-2"
      >
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        Vérification...
      </button>
    );
  }

  if (spotifyStatus.authenticated && spotifyStatus.currentUser) {
    return (
      <button
        onClick={handleSpotifyLogout}
        className="px-6 py-3 rounded-full font-bold text-base bg-[#1DB954] hover:bg-[#1DB954]/80 text-white transition-all shadow-lg flex items-center gap-2 group"
        title="Se déconnecter de Spotify"
      >
        <Avatar 
          src={spotifyStatus.currentUser.profile_picture} 
          alt={spotifyStatus.currentUser.display_name}
          size="sm"
        />
        <span className="truncate max-w-[120px] group-hover:text-gray-200">{spotifyStatus.currentUser.display_name}</span>
        <svg className="w-4 h-4 text-green-200 group-hover:text-red-300 transition-colors opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={handleSpotifyLogin}
      className="px-6 py-3 rounded-full font-bold text-base bg-[#1DB954] text-white hover:bg-[#1DB954]/80 transition-all shadow-lg flex items-center gap-2"
      title={`Connecter Spotify pour ${user.display_name}`}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
      </svg>
      Connecter Spotify
    </button>
  );
} 