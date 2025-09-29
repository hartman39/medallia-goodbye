import React, { useState, useMemo, useEffect } from 'react';
import { galleryPhotos } from '../../data/galleryPhotos';
import PhotoUploadFirebase from '../PhotoUpload/PhotoUploadFirebase';
import { ref, onValue } from 'firebase/database';
import { database } from '../../config/firebase';

interface Photo {
  id: number;
  src: string;
  title: string;
  description?: string;
  isUserUploaded?: boolean;
}

const PhotoGallery: React.FC = () => {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [userPhotos, setUserPhotos] = useState<Photo[]>([]);
  const [firebasePhotos, setFirebasePhotos] = useState<Photo[]>([]);
  const [imagePositions, setImagePositions] = useState<Map<number, string>>(new Map());

  const handleImageError = (photoId: number) => {
    setImageErrors(prev => new Set(Array.from(prev).concat(photoId)));
  };

  const handleImageLoad = (photoId: number, event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    const aspectRatio = img.naturalWidth / img.naturalHeight;

    // Determine best positioning based on aspect ratio and size
    let position = 'object-center'; // default

    if (aspectRatio > 1.5) {
      // Wide images - likely landscapes, center them
      position = 'object-center';
    } else if (aspectRatio < 0.8) {
      // Tall/portrait images - show top portion
      position = 'object-top';
    } else {
      // Square-ish images - use center but slightly favor top
      position = 'object-center';
    }

    setImagePositions(prev => new Map(prev).set(photoId, position));
  };

  // Load photos from localStorage on mount
  useEffect(() => {
    const savedPhotos = localStorage.getItem('userUploadedPhotos');
    if (savedPhotos) {
      try {
        setUserPhotos(JSON.parse(savedPhotos));
      } catch (e) {
        console.error('Failed to load user photos:', e);
      }
    }
  }, []);

  // Save user photos to localStorage whenever they change
  useEffect(() => {
    if (userPhotos.length > 0) {
      try {
        localStorage.setItem('userUploadedPhotos', JSON.stringify(userPhotos));
      } catch (e) {
        console.error('Failed to save user photos:', e);
      }
    }
  }, [userPhotos]);

  // Fetch photos from Firebase
  useEffect(() => {
    try {
      const photosRef = ref(database, 'photos');
      const unsubscribe = onValue(photosRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const photosArray = Object.keys(data).map(key => ({
            id: key,
            ...data[key],
            isUserUploaded: true
          }));
          // Sort by upload date, newest first
          photosArray.sort((a, b) => (b.uploadedAt || 0) - (a.uploadedAt || 0));
          setFirebasePhotos(photosArray);
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.log('Firebase not configured yet, using local storage only');
    }
  }, []);

  const handlePhotoUploaded = (newPhoto: { src: string; title: string; description: string }) => {
    // Only add to local state if Firebase is not being used
    // Firebase photos are automatically synced via the onValue listener
    const isFirebaseUrl = newPhoto.src.includes('firebasestorage.googleapis.com');
    if (!isFirebaseUrl) {
      const photo: Photo = {
        id: Date.now(), // Use timestamp as unique ID
        src: newPhoto.src,
        title: newPhoto.title,
        description: newPhoto.description,
        isUserUploaded: true
      };
      setUserPhotos(prev => [photo, ...prev]); // Add to beginning
    }
  };

  // Shuffle gallery photos on each render using useMemo to preserve order during re-renders
  const shuffledGalleryPhotos = useMemo(() => {
    const shuffled = [...galleryPhotos];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []); // Empty dependency array means this only runs once per component mount (page refresh)

  // Combine photos - use Firebase photos if available, otherwise use localStorage photos
  // This prevents duplicates when photos are in both Firebase and localStorage
  const userUploadedPhotos = firebasePhotos.length > 0 ? firebasePhotos : userPhotos;
  const allPhotos = [...userUploadedPhotos, ...shuffledGalleryPhotos];
  const filteredPhotos = allPhotos.filter((photo: Photo) => !imageErrors.has(photo.id));

  const handlePhotoClick = (photo: Photo) => {
    setSelectedPhoto(photo);
  };

  const closeModal = () => {
    setSelectedPhoto(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            📸 Photo Gallery
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-4 sm:mb-6">
            A collection of moments from my time at Medallia
          </p>
        </div>

        {/* Gallery Grid */}
        {filteredPhotos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
            {filteredPhotos.map((photo: Photo) => (
              <div
                key={photo.id}
                className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
                onClick={() => handlePhotoClick(photo)}
              >
                <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  <div className="aspect-w-4 aspect-h-3 relative overflow-hidden">
                    <img
                      src={photo.src}
                      alt={photo.title}
                      className={`w-full h-32 sm:h-40 lg:h-48 object-cover ${imagePositions.get(photo.id) || 'object-top'} group-hover:scale-110 transition-transform duration-300`}
                      onLoad={(e) => handleImageLoad(photo.id, e)}
                      onError={() => handleImageError(photo.id)}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📷</div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">
              Photos Coming Soon!
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Photos will appear here once they're added to the gallery folder.
            </p>
            <div className="mt-6 text-sm text-gray-500 bg-gray-100 rounded-lg p-4 max-w-2xl mx-auto">
              <p className="font-medium mb-2">📁 To add photos:</p>
              <p>1. Place image files in <code className="bg-white px-2 py-1 rounded text-xs">/public/images/gallery/</code></p>
              <p>2. Update the photo data in <code className="bg-white px-2 py-1 rounded text-xs">src/data/galleryPhotos.js</code></p>
            </div>
          </div>
        )}

        {/* Photo Modal */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <div
              className="max-w-4xl max-h-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeModal}
                className="absolute -top-12 right-0 text-white text-2xl hover:text-gray-300 transition-colors"
                aria-label="Close"
              >
                ✕
              </button>

              <div className="bg-white rounded-lg overflow-hidden shadow-2xl">
                <img
                  src={selectedPhoto.src}
                  alt={selectedPhoto.title}
                  className="w-full max-h-96 object-contain"
                />
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 text-center">
                    {selectedPhoto.title}
                  </h2>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Photo Upload Component with Firebase */}
        <PhotoUploadFirebase onPhotoUploaded={handlePhotoUploaded} />

        {/* Stats Footer */}
        <div className="mt-16 text-center text-gray-600">
          <div className="bg-white rounded-lg p-6 shadow-sm max-w-md mx-auto">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {filteredPhotos.length}
            </div>
            <div className="text-sm">
              Photos
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoGallery;