import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import './Statistics.css';

interface DogStats {
  total: number;
  available: number;
  pending: number;
  adopted: number;
}

interface UserStats {
  total: number;
  organizations: number;
  private: number;
}

interface StatsData {
  dogs: DogStats;
  users: UserStats;
}

const Statistics: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getApiUrl = () => {
    if (process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `http://${window.location.hostname}:3001`;
    }
    return 'http://172.20.10.2:3001';
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/api/stats`);
        const data = await response.json();
        
        if (data.success) {
          setStats(data.data);
        } else {
          setError('Failed to fetch statistics');
        }
      } catch (err) {
        setError('Error connecting to server');
        console.error('Error fetching statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="statistics-page">
        <div className="statistics-container">
          <h1>{t('statistics.title') || 'Application Statistics'}</h1>
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="statistics-page">
        <div className="statistics-container">
          <h1>{t('statistics.title') || 'Application Statistics'}</h1>
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="statistics-page">
      <div className="statistics-container">
        <h1 className="statistics-title">
          {t('statistics.title') || 'Application Statistics'}
        </h1>

        {stats && (
          <>
            <div className="statistics-grid">
              {/* Dogs Section */}
              <div className="stats-section dogs-section">
                <h2 className="section-title">
                  🐕 {t('statistics.dogs') || 'Dogs'}
                </h2>
                <div className="stats-cards">
                  <div className="stat-card total-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-number">{stats.dogs.total}</div>
                    <div className="stat-label">{t('statistics.totalDogs') || 'Total Dogs'}</div>
                  </div>
                  <div className="stat-card available-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-number">{stats.dogs.available}</div>
                    <div className="stat-label">{t('statistics.available') || 'Available'}</div>
                  </div>
                  <div className="stat-card pending-card">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-number">{stats.dogs.pending}</div>
                    <div className="stat-label">{t('statistics.pending') || 'Pending'}</div>
                  </div>
                  <div className="stat-card adopted-card">
                    <div className="stat-icon">🎉</div>
                    <div className="stat-number">{stats.dogs.adopted}</div>
                    <div className="stat-label">{t('statistics.adopted') || 'Adopted'}</div>
                  </div>
                </div>
              </div>

              {/* Users Section */}
              <div className="stats-section users-section">
                <h2 className="section-title">
                  👥 {t('statistics.users') || 'Users'}
                </h2>
                <div className="stats-cards">
                  <div className="stat-card total-card">
                    <div className="stat-icon">👤</div>
                    <div className="stat-number">{stats.users.total}</div>
                    <div className="stat-label">{t('statistics.totalUsers') || 'Total Users'}</div>
                  </div>
                  <div className="stat-card organization-card">
                    <div className="stat-icon">🏢</div>
                    <div className="stat-number">{stats.users.organizations}</div>
                    <div className="stat-label">{t('statistics.organizations') || 'Organizations'}</div>
                  </div>
                  <div className="stat-card private-card">
                    <div className="stat-icon">🏠</div>
                    <div className="stat-number">{stats.users.private}</div>
                    <div className="stat-label">{t('statistics.private') || 'Private Individuals'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="stats-footer">
              <Link to="/" className="back-link">
                ← {t('statistics.backHome') || 'Back to Home'}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Statistics;