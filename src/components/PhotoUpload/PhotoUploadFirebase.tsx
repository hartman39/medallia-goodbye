import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, push, set } from 'firebase/database';
import { storage, database } from '../../config/firebase';

interface PhotoUploadProps {
  onPhotoUploaded: (photo: { src: string; title: string; description: string }) => void;
}

const PhotoUploadFirebase: React.FC<PhotoUploadProps> = ({ onPhotoUploaded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Please select an image smaller than 5MB');
        return;
      }
      setSelectedFile(file);
    } else {
      alert('Please select a valid image file');
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !title.trim()) {
      alert('Please select a photo and add a title');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Check if Firebase is configured
      const isFirebaseConfigured = storage && database &&
        !storage.app.options.apiKey?.includes('TEMP');

      if (isFirebaseConfigured) {
        // Upload to Firebase Storage
        const timestamp = Date.now();
        const fileName = `user-uploads/${timestamp}_${selectedFile.name}`;
        const storageRef = ref(storage, fileName);

        // Upload file
        setUploadProgress(30);
        const snapshot = await uploadBytes(storageRef, selectedFile);

        setUploadProgress(60);
        // Get download URL
        const downloadURL = await getDownloadURL(snapshot.ref);

        setUploadProgress(80);
        // Save metadata to Realtime Database
        const photosRef = dbRef(database, 'photos');
        const newPhotoRef = push(photosRef);
        await set(newPhotoRef, {
          src: downloadURL,
          title: title.trim(),
          description: description.trim() || 'Shared by a visitor',
          uploadedAt: timestamp,
          fileName: selectedFile.name
        });

        setUploadProgress(100);

        // Notify parent component
        onPhotoUploaded({
          src: downloadURL,
          title: title.trim(),
          description: description.trim() || 'Shared by a visitor'
        });

        alert('Photo uploaded successfully! It will be visible to all visitors. 🎉');
      } else {
        // Fallback to localStorage if Firebase is not configured
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageSrc = e.target?.result as string;

          // Save to localStorage
          try {
            const existingPhotos = JSON.parse(localStorage.getItem('userUploadedPhotos') || '[]');
            const newPhoto = {
              id: Date.now(),
              src: imageSrc,
              title: title.trim(),
              description: description.trim() || 'Shared by a visitor',
              isUserUploaded: true
            };
            existingPhotos.unshift(newPhoto);
            localStorage.setItem('userUploadedPhotos', JSON.stringify(existingPhotos));

            // Notify parent component
            onPhotoUploaded({
              src: imageSrc,
              title: title.trim(),
              description: description.trim() || 'Shared by a visitor'
            });

            alert('Photo saved locally! Configure Firebase to share with all visitors.');
          } catch (error) {
            alert('Storage limit exceeded. Try a smaller image.');
          }
        };
        reader.readAsDataURL(selectedFile);
      }

      // Reset form
      setSelectedFile(null);
      setTitle('');
      setDescription('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Error uploading photo. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedFile(null);
    setTitle('');
    setDescription('');
    setUploadProgress(0);
  };

  return (
    <>
      {/* Upload Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105 z-40 flex items-center gap-2"
      >
        <span className="text-xl">📸</span>
        <span className="hidden sm:inline font-medium">Share Your Medallia Memories</span>
        <span className="sm:hidden font-medium">Share</span>
      </button>

      {/* Upload Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  📸 Share Your Medallia Memory
                </h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                  disabled={isUploading}
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Photo (Max 5MB)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50"
                  />
                  {selectedFile && (
                    <p className="mt-2 text-sm text-green-600">
                      ✓ {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                {/* Photo Preview */}
                {selectedFile && (
                  <div className="mt-4">
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Memory Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Team lunch at Palo Alto office"
                    disabled={isUploading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50"
                    maxLength={100}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {title.length}/100 characters
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell us about this memory..."
                    disabled={isUploading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50"
                    rows={3}
                    maxLength={200}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {description.length}/200 characters
                  </p>
                </div>

                {/* Upload Progress */}
                {isUploading && uploadProgress > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={!selectedFile || !title.trim() || isUploading}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  {isUploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Uploading... {uploadProgress > 0 && `${uploadProgress}%`}
                    </span>
                  ) : (
                    'Share Memory'
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  Your photo will be added to the gallery for <strong>everyone</strong> to see and enjoy!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PhotoUploadFirebase;