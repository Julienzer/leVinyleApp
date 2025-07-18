-- Migration pour ajouter la gestion automatique des sessions

-- Ajouter des colonnes pour traquer l'activité et l'expiration
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP DEFAULT NULL,
ADD COLUMN IF NOT EXISTS auto_cleanup BOOLEAN DEFAULT TRUE;

-- Mettre à jour les sessions existantes avec l'activité actuelle
UPDATE sessions 
SET last_activity = updated_at 
WHERE last_activity IS NULL;

-- Index pour optimiser les requêtes de nettoyage
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_auto_cleanup ON sessions(auto_cleanup);

-- Fonction pour mettre à jour last_activity automatiquement
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour last_activity quand une proposition est créée/modifiée
    UPDATE sessions 
    SET last_activity = CURRENT_TIMESTAMP 
    WHERE id = NEW.session_id;
    
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Triggers pour mettre à jour l'activité automatiquement
DROP TRIGGER IF EXISTS update_activity_on_proposition ON propositions;
CREATE TRIGGER update_activity_on_proposition
    AFTER INSERT OR UPDATE ON propositions
    FOR EACH ROW EXECUTE FUNCTION update_session_activity();

-- Fonction pour nettoyer les sessions inactives
CREATE OR REPLACE FUNCTION cleanup_inactive_sessions(
    inactive_hours INTEGER DEFAULT 24,
    delete_old_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    action TEXT,
    session_count INTEGER,
    details TEXT
) AS $$
DECLARE
    deactivated_count INTEGER;
    deleted_count INTEGER;
BEGIN
    -- 1. Désactiver les sessions inactives (plus de X heures sans activité)
    UPDATE sessions 
    SET active = FALSE, updated_at = CURRENT_TIMESTAMP
    WHERE active = TRUE 
      AND auto_cleanup = TRUE
      AND last_activity < (CURRENT_TIMESTAMP - (inactive_hours || ' hours')::INTERVAL);
    
    GET DIAGNOSTICS deactivated_count = ROW_COUNT;
    
    -- 2. Supprimer les sessions très anciennes (plus de X jours)
    DELETE FROM sessions 
    WHERE auto_cleanup = TRUE
      AND active = FALSE 
      AND updated_at < (CURRENT_TIMESTAMP - (delete_old_days || ' days')::INTERVAL);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Retourner les résultats
    RETURN QUERY VALUES 
        ('deactivated', deactivated_count, format('Sessions désactivées après %s heures d''inactivité', inactive_hours)),
        ('deleted', deleted_count, format('Sessions supprimées après %s jours', delete_old_days));
END;
$$ LANGUAGE 'plpgsql';

-- Fonction pour obtenir les statistiques des sessions
CREATE OR REPLACE FUNCTION get_session_cleanup_stats()
RETURNS TABLE (
    total_sessions INTEGER,
    active_sessions INTEGER,
    inactive_sessions INTEGER,
    old_sessions INTEGER,
    cleanup_candidates INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM sessions) as total_sessions,
        (SELECT COUNT(*)::INTEGER FROM sessions WHERE active = TRUE) as active_sessions,
        (SELECT COUNT(*)::INTEGER FROM sessions WHERE active = FALSE) as inactive_sessions,
        (SELECT COUNT(*)::INTEGER FROM sessions WHERE updated_at < CURRENT_TIMESTAMP - INTERVAL '30 days') as old_sessions,
        (SELECT COUNT(*)::INTEGER FROM sessions 
         WHERE auto_cleanup = TRUE 
           AND (
               (active = TRUE AND last_activity < CURRENT_TIMESTAMP - INTERVAL '24 hours') OR
               (active = FALSE AND updated_at < CURRENT_TIMESTAMP - INTERVAL '30 days')
           )
        ) as cleanup_candidates;
END;
$$ LANGUAGE 'plpgsql';

-- Vue pour les sessions à nettoyer
CREATE OR REPLACE VIEW sessions_cleanup_view AS
SELECT 
    s.id,
    s.code,
    s.name,
    s.streamer_id,
    u.display_name as streamer_name,
    s.active,
    s.created_at,
    s.updated_at,
    s.last_activity,
    s.auto_cleanup,
    EXTRACT(HOURS FROM (CURRENT_TIMESTAMP - s.last_activity)) as hours_inactive,
    EXTRACT(DAYS FROM (CURRENT_TIMESTAMP - s.updated_at)) as days_old,
    CASE 
        WHEN s.active = TRUE AND s.last_activity < CURRENT_TIMESTAMP - INTERVAL '24 hours' THEN 'À désactiver'
        WHEN s.active = FALSE AND s.updated_at < CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 'À supprimer'
        ELSE 'Actif'
    END as cleanup_status,
    (SELECT COUNT(*) FROM propositions WHERE session_id = s.id) as total_propositions
FROM sessions s
JOIN users u ON s.streamer_id = u.id
ORDER BY s.last_activity DESC;

-- Exemples d'utilisation :

-- Statistiques des sessions
-- SELECT * FROM get_session_cleanup_stats();

-- Sessions candidates au nettoyage  
-- SELECT * FROM sessions_cleanup_view WHERE cleanup_status != 'Actif';

-- Nettoyage manuel (désactiver après 12h, supprimer après 7 jours)
-- SELECT * FROM cleanup_inactive_sessions(12, 7);

-- Nettoyage standard (désactiver après 24h, supprimer après 30 jours)
-- SELECT * FROM cleanup_inactive_sessions();

COMMENT ON FUNCTION cleanup_inactive_sessions IS 'Nettoie automatiquement les sessions inactives. Paramètres: inactive_hours (défaut 24), delete_old_days (défaut 30)';
COMMENT ON FUNCTION get_session_cleanup_stats IS 'Retourne les statistiques des sessions pour le monitoring';
COMMENT ON VIEW sessions_cleanup_view IS 'Vue pour visualiser les sessions candidates au nettoyage'; 