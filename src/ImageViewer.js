import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { fetch } from "@inrupt/solid-client-authn-browser";

export default function ImageViewer({ url, onClose }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to handle image loading with authenticated fetch
  const getImageSrc = async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return URL.createObjectURL(await response.blob());
    } catch (error) {
      console.error('Error loading image:', error);
      throw new Error('Failed to load image from pod');
    }
  };

  return (
    <div className="fixed inset-0 bg-next-black/80 flex items-center justify-center z-50">
      <div className="relative max-w-4xl max-h-[90vh] w-full mx-4">
        <div className="next-window overflow-hidden shadow-next-window">
          {/* NeXTSTEP-style title bar */}
          <div className="next-title-bar">
            <div className="next-title-text flex items-center">
              <span className="truncate">{url.split('/').pop()}</span>
              <span className="text-xs ml-2 opacity-70">(Image Viewer)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border border-next-border"></div>
              <button
                onClick={onClose}
                className="text-next-white text-xs hover:text-next-white/60 transition-colors"
                aria-label="Close image viewer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* NeXTSTEP-style image container */}
          <div className="bg-next-white border-t border-next-border p-1">
            {isLoading && (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 text-next-blue animate-spin" />
              </div>
            )}
            {error && (
              <div className="text-next-red text-center p-4 bg-next-dark">
                {error}
              </div>
            )}
            <img
              src={url}
              alt="Preview"
              className={`max-h-[80vh] max-w-full object-contain mx-auto border border-next-border
                ${isLoading ? 'hidden' : 'block'}`}
              onLoad={() => setIsLoading(false)}
              onError={async (e) => {
                setIsLoading(false);
                try {
                  const blobUrl = await getImageSrc();
                  e.target.src = blobUrl;
                } catch (err) {
                  setError(err.message);
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}