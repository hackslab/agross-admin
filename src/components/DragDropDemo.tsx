import React, { useState } from "react";
import FileUpload from "./FileUpload";
import FilePreview from "./FilePreview";

/**
 * Demo component to showcase the drag-and-drop file upload feature
 * This is for testing/demonstration purposes only
 */
const DragDropDemo: React.FC = () => {
  const [images, setImages] = useState<Array<{ url: string; name: string }>>(
    []
  );
  const [videos, setVideos] = useState<Array<{ url: string; name: string }>>(
    []
  );

  const handleImageUpload = (files: File[]) => {
    const newFiles = files.map((file) => ({
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setImages([...images, ...newFiles]);
  };

  const handleVideoUpload = (files: File[]) => {
    const newFiles = files.map((file) => ({
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setVideos([...videos, ...newFiles]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setVideos(videos.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">
        Drag & Drop File Upload Demo
      </h1>

      <div className="space-y-8">
        {/* Image Upload Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Image Upload (Multiple)
          </h2>
          <FileUpload
            onFileSelect={handleImageUpload}
            accept="image/*"
            multiple={true}
            maxFiles={10}
            label="Drop your images here"
          />
          <FilePreview
            files={images}
            onRemove={removeImage}
            showImages={true}
          />
          <p className="mt-4 text-sm text-gray-500">
            Uploaded: {images.length} image{images.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Video Upload Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Video Upload (Multiple)
          </h2>
          <FileUpload
            onFileSelect={handleVideoUpload}
            accept="video/*"
            multiple={true}
            maxFiles={5}
            label="Drop your videos here"
          />
          <FilePreview
            files={videos}
            onRemove={removeVideo}
            showImages={false}
          />
          <p className="mt-4 text-sm text-gray-500">
            Uploaded: {videos.length} video{videos.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold mb-2 text-blue-800">
            How to Use
          </h3>
          <ul className="list-disc list-inside space-y-2 text-blue-700">
            <li>Drag files from your computer onto the upload areas</li>
            <li>Or click the upload area to browse and select files</li>
            <li>Watch for visual feedback when dragging over the area</li>
            <li>Files are validated for type and size automatically</li>
            <li>Click the × button to remove uploaded files</li>
          </ul>
        </div>

        {/* Features */}
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold mb-2 text-green-800">
            Features
          </h3>
          <ul className="list-disc list-inside space-y-2 text-green-700">
            <li>✓ Drag and drop support</li>
            <li>✓ Click to browse fallback</li>
            <li>✓ File type validation</li>
            <li>✓ File size validation</li>
            <li>✓ Multiple file uploads</li>
            <li>✓ Image preview thumbnails</li>
            <li>✓ Smooth animations and transitions</li>
            <li>✓ Error handling with user-friendly messages</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DragDropDemo;
