import React, { useState } from 'react';

interface PhotoUploadProps {
  onPhotoUploaded: (photo: { src: string; title: string; description: string }) => void;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ onPhotoUploaded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
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

    try {
      // Create a data URL for the image to display immediately
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageSrc = e.target?.result as string;

        // Add the photo to the gallery
        onPhotoUploaded({
          src: imageSrc,
          title: title.trim(),
          description: description.trim() || 'Shared by a visitor'
        });

        // Reset form
        setSelectedFile(null);
        setTitle('');
        setDescription('');
        setIsOpen(false);

        alert('Thank you for sharing your Medallia memory! 📸');
      };

      reader.readAsDataURL(selectedFile);
    } catch (error) {
      alert('Error uploading photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedFile(null);
    setTitle('');
    setDescription('');
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
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  {selectedFile && (
                    <p className="mt-2 text-sm text-green-600">
                      ✓ {selectedFile.name}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    rows={3}
                    maxLength={200}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {description.length}/200 characters
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={!selectedFile || !title.trim() || isUploading}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  {isUploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sharing...
                    </span>
                  ) : (
                    'Share Memory'
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  Your photo will be added to the gallery for others to see and enjoy!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PhotoUpload;