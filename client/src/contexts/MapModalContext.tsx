import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import ReactDOM from 'react-dom';

interface MapModalState {
  show: boolean;
  location?: string;
  place?: string;
  coords?: { lat: number; lng: number };
}

interface MapModalContextType {
  showMap: (location: string, place?: string, coords?: { lat: number; lng: number }) => void;
  hideMap: () => void;
  mapState: MapModalState;
}

const MapModalContext = createContext<MapModalContextType | undefined>(undefined);

export const MapModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mapState, setMapState] = useState<MapModalState>({ show: false });

  const showMap = (location: string, place?: string, coords?: { lat: number; lng: number }) => {
    setMapState({ show: true, location, place, coords });
  };

  const hideMap = () => {
    setMapState({ show: false });
  };

  return (
    <MapModalContext.Provider value={{ showMap, hideMap, mapState }}>
      {children}
      {mapState.show && ReactDOM.createPortal(
        <div 
          className="dogdetails-map-modal"
          style={{ zIndex: '214748364999', position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0, 0, 0, 0.7)' }}
        >
          <div className="modal-map-content">
            <button
              className="modal-map-close"
              onClick={hideMap}
              aria-label="Close"
              title="Close"
            >
              <span>×</span>
            </button>
            <h3 className="modal-map-title">{mapState.place || mapState.location}</h3>
            <iframe
              className="map-iframe"
              title="Map Preview"
              allowFullScreen
              src={mapState.coords
                ? `https://www.openstreetmap.org/export/embed.html?bbox=${mapState.coords.lng-0.002},${mapState.coords.lat-0.002},${mapState.coords.lng+0.002},${mapState.coords.lat+0.002}&layer=mapnik&marker=${mapState.coords.lat},${mapState.coords.lng}`
                : `https://www.openstreetmap.org/export/embed.html?search=${encodeURIComponent(mapState.location || '')}&layer=mapnik`}
            />
            <div style={{ marginTop: 15, display: 'flex', gap: 10 }}>
              <button 
                onClick={hideMap} 
                style={{ fontSize: 16, padding: '10px 20px', borderRadius: 6, border: '1px solid #ddd', background: '#f8f9fa', cursor: 'pointer', color: '#666' }}
              >
                Close
              </button>
              {mapState.coords && (
                <a 
                  href={`https://www.openstreetmap.org/?mlat=${mapState.coords.lat}&mlon=${mapState.coords.lng}#map=16/${mapState.coords.lat}/${mapState.coords.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 16, padding: '10px 20px', borderRadius: 6, border: 'none', background: '#007bff', color: 'white', textDecoration: 'none', cursor: 'pointer', display: 'inline-block' }}
                >
                  View Full Map
                </a>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </MapModalContext.Provider>
  );
};

export const useMapModal = () => {
  const context = useContext(MapModalContext);
  if (!context) {
    throw new Error('useMapModal must be used within MapModalProvider');
  }
  return context;
};