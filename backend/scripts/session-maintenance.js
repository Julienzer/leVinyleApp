#!/usr/bin/env node

/**
 * Script de maintenance automatique pour les sessions
 * 
 * Usage:
 *   node session-maintenance.js [options]
 * 
 * Options:
 *   --dry-run            Mode simulation sans modification
 *   --inactive-hours     Heures d'inactivité avant désactivation (défaut: 24)
 *   --delete-days        Jours avant suppression (défaut: 30)
 *   --verbose           Mode verbose avec logs détaillés
 *   --cron              Mode silencieux pour exécution cron
 */

const db = require('../db');
require('dotenv').config();

// Configuration par défaut
const DEFAULT_CONFIG = {
  inactive_hours: 24,
  delete_old_days: 30,
  dry_run: false,
  verbose: false,
  cron: false
};

class SessionMaintenance {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startTime = new Date();
  }

  log(message, force = false) {
    if (this.config.verbose || force || !this.config.cron) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${message}`);
    }
  }

  async getStats() {
    try {
      const result = await db.query('SELECT * FROM get_session_cleanup_stats()');
      return result.rows[0];
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
    }
  }

  async performCleanup() {
    const { inactive_hours, delete_old_days, dry_run } = this.config;
    
    try {
      if (dry_run) {
        this.log('🧪 MODE SIMULATION - Aucune modification ne sera effectuée');
        
        // Simuler le nettoyage
        const deactivateQuery = `
          SELECT COUNT(*) as count 
          FROM sessions 
          WHERE active = TRUE 
            AND auto_cleanup = TRUE
            AND last_activity < (CURRENT_TIMESTAMP - ($1 || ' hours')::INTERVAL)
        `;
        
        const deleteQuery = `
          SELECT COUNT(*) as count 
          FROM sessions 
          WHERE auto_cleanup = TRUE
            AND active = FALSE 
            AND updated_at < (CURRENT_TIMESTAMP - ($1 || ' days')::INTERVAL)
        `;
        
        const [deactivateResult, deleteResult] = await Promise.all([
          db.query(deactivateQuery, [inactive_hours]),
          db.query(deleteQuery, [delete_old_days])
        ]);
        
        const results = [
          {
            action: 'deactivated',
            session_count: parseInt(deactivateResult.rows[0].count),
            details: `Sessions à désactiver après ${inactive_hours} heures d'inactivité`
          },
          {
            action: 'deleted',
            session_count: parseInt(deleteResult.rows[0].count),
            details: `Sessions à supprimer après ${delete_old_days} jours`
          }
        ];
        
        return results;
        
      } else {
        this.log('🧹 NETTOYAGE RÉEL - Modifications en cours...');
        
        // Nettoyage réel
        const result = await db.query(
          'SELECT * FROM cleanup_inactive_sessions($1, $2)',
          [inactive_hours, delete_old_days]
        );
        
        const results = result.rows.map(row => ({
          action: row.action,
          session_count: parseInt(row.session_count),
          details: row.details
        }));
        
        return results;
      }
      
    } catch (error) {
      throw new Error(`Erreur lors du nettoyage: ${error.message}`);
    }
  }

  async run() {
    this.log('🚀 Démarrage de la maintenance des sessions');
    this.log(`📋 Configuration: ${JSON.stringify(this.config)}`);
    
    try {
      // 1. Récupérer les statistiques avant nettoyage
      this.log('📊 Récupération des statistiques...');
      const statsBefore = await this.getStats();
      
      this.log('📈 Statistiques avant nettoyage:');
      this.log(`   • Total sessions: ${statsBefore.total_sessions}`);
      this.log(`   • Sessions actives: ${statsBefore.active_sessions}`);
      this.log(`   • Sessions inactives: ${statsBefore.inactive_sessions}`);
      this.log(`   • Sessions anciennes: ${statsBefore.old_sessions}`);
      this.log(`   • Candidats au nettoyage: ${statsBefore.cleanup_candidates}`);
      
      // 2. Effectuer le nettoyage
      if (statsBefore.cleanup_candidates > 0) {
        this.log(`🧹 Nettoyage de ${statsBefore.cleanup_candidates} sessions...`);
        
        const cleanupResults = await this.performCleanup();
        
        // 3. Afficher les résultats
        this.log('✅ Nettoyage terminé:');
        cleanupResults.forEach(result => {
          const icon = result.action === 'deactivated' ? '🔴' : '🗑️';
          this.log(`   ${icon} ${result.details}: ${result.session_count} sessions`);
        });
        
        // 4. Statistiques après nettoyage (seulement si pas dry-run)
        if (!this.config.dry_run) {
          const statsAfter = await this.getStats();
          this.log('📉 Statistiques après nettoyage:');
          this.log(`   • Total sessions: ${statsAfter.total_sessions}`);
          this.log(`   • Sessions actives: ${statsAfter.active_sessions}`);
          this.log(`   • Sessions inactives: ${statsAfter.inactive_sessions}`);
          this.log(`   • Candidats restants: ${statsAfter.cleanup_candidates}`);
        }
        
      } else {
        this.log('✨ Aucune session à nettoyer');
      }
      
      // 5. Résumé final
      const duration = Date.now() - this.startTime;
      this.log(`🏁 Maintenance terminée en ${duration}ms`);
      
      // Mode cron : afficher seulement si action effectuée
      if (this.config.cron && statsBefore.cleanup_candidates > 0) {
        console.log(`Session maintenance: ${statsBefore.cleanup_candidates} sessions processed`);
      }
      
      return {
        success: true,
        duration,
        stats_before: statsBefore,
        cleanup_results: statsBefore.cleanup_candidates > 0 ? await this.performCleanup() : []
      };
      
    } catch (error) {
      this.log(`❌ Erreur: ${error.message}`, true);
      
      if (this.config.cron) {
        console.error(`Session maintenance failed: ${error.message}`);
      }
      
      return {
        success: false,
        error: error.message,
        duration: Date.now() - this.startTime
      };
    }
  }
}

// Parse arguments en ligne de commande
function parseArgs() {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--dry-run':
        config.dry_run = true;
        break;
      case '--verbose':
        config.verbose = true;
        break;
      case '--cron':
        config.cron = true;
        break;
      case '--inactive-hours':
        config.inactive_hours = parseInt(args[++i]) || DEFAULT_CONFIG.inactive_hours;
        break;
      case '--delete-days':
        config.delete_old_days = parseInt(args[++i]) || DEFAULT_CONFIG.delete_old_days;
        break;
      case '--help':
        console.log(`
Usage: node session-maintenance.js [options]

Options:
  --dry-run              Mode simulation sans modification
  --inactive-hours N     Heures d'inactivité avant désactivation (défaut: ${DEFAULT_CONFIG.inactive_hours})
  --delete-days N        Jours avant suppression (défaut: ${DEFAULT_CONFIG.delete_old_days})
  --verbose              Mode verbose avec logs détaillés
  --cron                 Mode silencieux pour exécution cron
  --help                 Affiche cette aide

Exemples:
  node session-maintenance.js                              # Nettoyage standard
  node session-maintenance.js --dry-run                    # Simulation
  node session-maintenance.js --inactive-hours 12          # Désactiver après 12h
  node session-maintenance.js --delete-days 7              # Supprimer après 7 jours
  node session-maintenance.js --cron                       # Mode silencieux
        `);
        process.exit(0);
      default:
        console.error(`Argument inconnu: ${arg}`);
        console.error('Utilisez --help pour voir les options disponibles');
        process.exit(1);
    }
  }
  
  return config;
}

// Exécution du script
async function main() {
  const config = parseArgs();
  const maintenance = new SessionMaintenance(config);
  
  try {
    const result = await maintenance.run();
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('Erreur fatale:', error.message);
    process.exit(1);
  }
}

// Exporter pour tests ou usage programmatique
module.exports = SessionMaintenance;

// Exécuter si appelé directement
if (require.main === module) {
  main();
} 