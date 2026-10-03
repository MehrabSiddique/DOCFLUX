'use client';
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";
import Lottie from "lottie-react";
import loadingAnimation from "../../public/animation/loading.json"; // Adjust path as needed
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/sidebar";
import Header from "../components/header";
import {
  X,
  Database,
  FileText,
  ArrowLeft,
  ArrowRight,
  Check,
  CloudUpload,
  Text,
} from "lucide-react";
import { FaGoogleDrive } from 'react-icons/fa';

export default function HomePage() {
  const [cropping, setCropping] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const [uploadModal, setUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
 // Track modal steps
  const [uploading, setUploading] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [summary, setSummary] = useState("");
  const [keywords, setKeywords] = useState("");
  const [documentId, setDocumentId] = useState<string | null>(null); // documentId state
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const cropperInstance = useRef<Cropper | null>(null);

  const router = useRouter();
  // Get userId from session storage
const userId = typeof window !== "undefined" ? sessionStorage.getItem("userId") : null;


const handleUpload = async (destination: "database" | "gdrive") => {
  if (!selectedFile) return;

  setLoading(true);
  setUploading(true);

  if (destination === "gdrive") {
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("userId", userId || "");

      const res = await fetch("http://localhost:5000/documents/gdrive", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      console.log("Google Drive upload response:", data);

      if (res.ok && data.driveFile) {
        alert("File uploaded to Google Drive successfully!");

        // Optional: Save metadata if returned
        if (data.document && data.document._id) {
          const id = data.document._id;
          setDocumentId(id);
          sessionStorage.setItem("documentId", id);
          setStep(2);
        }
      } else {
        alert("Failed to upload to Google Drive: " + data.message);
      }
    } catch (err) {
      console.error("Google Drive upload error:", err);
      alert("Google Drive upload error. Check console for details.");
    } finally {
      setUploading(false);
      setLoading(false);
    }

    return; // Exit early for Google Drive
  }

  // Handle "database" upload
  const formData = new FormData();
  formData.append("file", selectedFile);
  formData.append("destination", destination);
  formData.append("userId", userId || "");

  try {
    const response = await fetch("http://localhost:5000/documents/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.text();

    try {
      const jsonData = JSON.parse(data);
      console.log("Response data:", jsonData);

      if (response.ok) {
        if (jsonData.document && jsonData.document._id) {
          const id = jsonData.document._id;
          setDocumentId(id);
          sessionStorage.setItem("documentId", id);
          alert(`File saved to ${destination}!`);

          if (destination === "database") {
            setStep(2);
          }
        } else {
          alert("Document ID not found in the response.");
        }
      } else {
        alert(`Upload failed: ${jsonData.message}`);
      }
    } catch (error) {
      console.error("Error parsing JSON:", error);
      alert("Received non-JSON response: " + data);
    }
  } catch (error) {
    console.error("Upload error:", error);
    alert("Error uploading file. Please try again.");
  } finally {
    setUploading(false);
    setLoading(false);
  }
};

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    const imageTypes = ["image/png", "image/jpeg", "image/jpg"];
    const pdfType = "application/pdf";
  
    // If it's an image
    if (imageTypes.includes(file.type)) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedFile(file);
      setImagePreviewUrl(imageUrl);
      setStep(1.5); // Go to cropping
      setCropping(true);
    } 
    // If it's a PDF
    else if (file.type === pdfType) {
      setSelectedFile(file);
      setImagePreviewUrl(""); // No preview needed
      setStep(2); // Go directly to next step
      setCropping(false); // No cropping
    } 
    // If unsupported
    else {
      alert("Only PNG, JPG, JPEG images or PDF files are allowed.");
    }
  };
  
  
  const initializeCropper = () => {
    if (cropperInstance.current) {
      cropperInstance.current.destroy?.(); // Clean previous instance
    }
  
    if (imageRef.current) {
      cropperInstance.current = new Cropper(imageRef.current, {
        aspectRatio: NaN, // or any other aspect
        viewMode: 1,
        autoCropArea: 1,
        responsive: true,
      });
    }
  };
  
  useEffect(() => {
    if (step === 1.5 && cropping && imageRef.current) {
      initializeCropper();
    }
  }, [step, cropping]);
  

  const handleCropConfirm = () => {
    if (!cropperInstance.current) return;
  
    const canvas = cropperInstance.current.getCroppedCanvas();
    if (!canvas) return;
  
    canvas.toBlob((blob) => {
      if (blob) {
        setCroppedBlob(blob);
        setCropping(false);
        setStep(2);
      }
    }, 'image/jpeg');
  };
  
 
  // Correctly pass the document ID (e.g., document._id, not the entire document object)
  const handleConvertToText = async (documentId: string) => {
    console.log("documentId:", documentId);
    setLoading(true); // Start loading
  
    try {
      const response = await fetch(`http://localhost:5000/documents/extract-text/${documentId}`, {
        method: "POST",
      });
  
      const data = await response.json(); // Parse JSON
  
      if (response.ok) {
        console.log("Text extracted:", data);
        setExtractedText(data.text);
        await saveToDatabase("extractedText", data.text);
        setStep(3.5); // Move to summary step
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Error during text extraction:", error);
      alert("Error extracting text. Please try again.");
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const handleConvertToDocs = async () => {
    if (!documentId || !selectedFile) {
      alert("Missing document or file");
      return;
    }
  
    setLoading(true);
  
    try {
      const formData = new FormData();
      formData.append("file", selectedFile); // Attach the file
  
      const res = await fetch(`http://localhost:5000/documents/convert-doc/${documentId}`, {
        method: "POST",
        body: formData,
      });
  
      if (!res.ok) throw new Error("Conversion failed");
  
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
  
      // Trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = "converted.docx";
      a.click();
      URL.revokeObjectURL(url);
  
      // Optionally update DB
      await saveToDatabase("converted", true);
      setStep(4);
    } catch (err) {
      console.error("Error converting file:", err);
      alert("Failed to convert document to DOCX.");
    } finally {
      setLoading(false);
    }
  };
  

  
  const handleConvertToSummary = async () => {
    if (!extractedText) return;
    setLoading(true); // Start loading
  
    try {
      const response = await fetch(`http://localhost:5000/documents/summarize/${documentId}`, {
        method: "POST",
      });
  
      const data = await response.json();
      if (response.ok) {
        setSummary(data.document.summary);
        await saveToDatabase("summary", data.document.summary);
        setStep(5); // Move to keyword extraction step
      } else {
        alert(`Summary generation failed: ${data.message}`);
      }
    } catch (error) {
      console.error("Error summarizing text:", error);
      alert("Error summarizing text. Please try again.");
    } finally {
      setLoading(false); // Stop loading
    }
  };
  

  const handleConvertToKeywords = async () => {
    if (!summary) return;
    setLoading(true); // Start loading
  
    try {
      const response = await fetch(`http://localhost:5000/documents/extract-keywords/${documentId}`, {
        method: "POST",
      });
  
      const data = await response.json();
      if (response.ok) {
        setKeywords(data.document.keywords);
        await saveToDatabase("keywords", data.document.keywords);
        setStep(6); // Move to final step
      } else {
        const contentType = response.headers.get("content-type");
        const errorText = contentType?.includes("application/json")
          ? await response.json()
          : await response.text();
        alert(`Keyword extraction failed: ${errorText.message || errorText}`);
      }
    } catch (error) {
      console.error("Error extracting keywords:", error);
      alert("Error extracting keywords. Please try again.");
    } finally {
      setLoading(false); // Stop loading
    }
  };
  

  const saveToDatabase = async (type: string, content: string) => {
    try {
      const response = await fetch("http://localhost:5000/documents/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          documentId: documentId, // ✅ Add this line
          type: type,
          content: content,
        }),
      });
  
      const data = await response.json();
      if (response.ok) {
        console.log(`${type} saved to database successfully!`);
      } else {
        console.error(`Error saving ${type}:`, data.message);
      }
    } catch (error) {
      console.error("Error saving to database:", error);
    }
  };
  
  return (
    <div className="relative min-h-screen flex flex-col bg-purple-100">
      {/* Background content */}
      <div className={`${uploadModal ? 'opacity-90 pointer-events-none blur-sm' : ''} transition-all duration-300`}>
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-6">Upload Documents</h1>
            <div
              onClick={() => {
                setStep(1);
                setUploadModal(true);
              }}
              className="cursor-pointer"
            >
             <div className="flex justify-center sm:justify-start w-full">
  <img
    src="/upload.png"
    alt="Upload"
    className="w-64 h-48 sm:w-120 sm:h-80 rounded-lg hover:opacity-75"
  />
</div>

            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {uploadModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-xl sm:max-w-2xl relative">
            <button className="absolute top-3 right-3" onClick={() => setUploadModal(false)}>
              <X size={24} />
            </button>
            {/* Progress Display */}
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${(step / 6) * 100}%` }}
              />
            </div>

            {/* Step 1: Upload File */}
            {step === 1 && (
              <>
              <h2 className="text-xl font-semibold mb-4">Upload a File</h2>
              <div className="flex flex-col space-y-4">
                <input
                  type="file"
                  accept=".pdf, .png, .jpg, .jpeg, .gif"
                  onChange={handleFileChange}
                  className="border p-2 w-full"
                />
                <div className="flex justify-end">
                  <button
                    className="bg-blue-500 text-white p-2 rounded-full"
                    onClick={() => setStep(2)}
                  >
                    <ArrowRight size={24} />
                  </button>
                </div>
              </div>
            </>
            
            )}

{step === 1.5 && cropping && imagePreviewUrl && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-3xl w-full">
      <h2 className="text-lg font-semibold mb-2">Crop Image</h2>
      <div className="max-h-[70vh] overflow-auto flex justify-center">
        <img ref={imageRef} src={imagePreviewUrl} className="max-w-full max-h-[60vh]" />
      </div>
      <div className="mt-4 flex justify-between">
        <button
          className="bg-gray-400 px-4 py-2 rounded text-white"
          onClick={() => setCropping(false)}
        >
          Cancel
        </button>
        <button
  className="bg-green-500 px-4 py-2 rounded text-white"
  onClick={() => {
    if (!cropperInstance.current) {
      console.warn("Cropper instance not ready");
      return;
    }

    const canvas = cropperInstance.current.getCroppedCanvas();
    if (!canvas) {
      console.warn("No canvas from cropper");
      return;
    }

    canvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], "cropped.jpg", { type: "image/jpeg" });
        setSelectedFile(croppedFile);
        setCropping(false);
        setStep(2);
      }
    }, 'image/jpeg');
  }}
>
  Crop & Continue
</button>


      </div>
    </div>
  </div>
)}


            {/* Step 2: Save Options */}
            {step === 2 && (
  <>
    <h2 className="text-xl font-semibold mb-4">Save Options</h2>

    {loading ? (
      <div className="flex justify-center items-center my-4">
        <Lottie animationData={loadingAnimation} className="w-32 h-32" />
      </div>
    ) : (
      <>
        
        <button
          className="w-full bg-indigo-500 text-white p-3 rounded my-2 flex items-center justify-center gap-2"
          onClick={() => handleUpload("gdrive")}
        >
          <FaGoogleDrive size={20} /> Save to Google Drive
        </button>
        <button
          className="w-full bg-green-500 text-white p-3 rounded my-2 flex items-center justify-center gap-2"
          onClick={() => handleUpload("database")}
        >
          <Database size={20} /> Save to Database
        </button>
        <div className="flex justify-end">
                  <button
                    className="bg-blue-500 text-white p-2 rounded-full"
                    onClick={() => setStep(3)}
                  >
                    <ArrowRight size={24} />
                  </button>
                </div>
      </>
    )}
  </>
)}

            {/* Step 3: Preview Uploaded File */}
            {step === 3 && selectedFile && (
  <>
    <h2 className="text-lg font-semibold mb-4 text-center">File Uploaded Successfully</h2>

    {/* File Preview */}
    {selectedFile.type.includes("image") ? (
      <img
        src={URL.createObjectURL(selectedFile)}
        alt="Uploaded File"
        className="w-full h-40 object-contain rounded-md mb-2"
      />
    ) : selectedFile.type === "application/pdf" ? (
      <iframe
        src={URL.createObjectURL(selectedFile)}
        title="PDF Preview"
        className="w-full h-60 rounded-md mb-2 border"
      />
    ) : (
      <p className="text-sm text-gray-500">Preview not available for this file type.</p>
    )}

    {/* Convert Button */}
    {documentId && (
  loading ? (
    <div className="flex justify-center mt-2">
      <Lottie animationData={loadingAnimation} className="w-20 h-20" />
    </div>
  ) : (
    <button
      onClick={() => handleConvertToText(documentId)}
      className="block w-full bg-purple-500 text-white p-3 rounded mt-2 mb-4"
    >
      Convert to Text & Save
    </button>
  )
)}

    {/* Navigation Arrows */}
    <div className="flex justify-end">
                  <button
                    className="bg-blue-500 text-white p-2 rounded-full"
                    onClick={() => setStep(3.5)}
                  >
                    <ArrowRight size={24} />
                  </button>
                </div>
  
              </>
            )}

            {/* Step 3.5: Preview and Convert to Docs */}
{step === 3.5 && (
  <>
    <h2 className="text-xl font-semibold mb-4">Extracted Text</h2>
    <div className="bg-white p-3 h-48 overflow-y-auto rounded mb-4 text-sm whitespace-pre-wrap">
      {extractedText}
    </div>
      
      <button
        className="w-full bg-indigo-500 text-white p-3 rounded my-2 flex items-center justify-center gap-2"
        onClick={handleConvertToDocs}
      >
        convert as DOCX
      </button>

    {/* Navigation Arrows */}
    <div className="flex justify-end">
                  <button
                    className="bg-blue-500 text-white p-2 rounded-full"
                    onClick={() => setStep(4)}
                  >
                    <ArrowRight size={24} />
                  </button>
                </div>
  
              </>
            )}

            {/* Step 4: Extract Text */}
            {step === 4 && (
  <>
    <h2 className="text-lg font-semibold mb-4 text-center">Extracted Text</h2>
    <div className="border p-4 rounded-lg h-32 overflow-auto">{extractedText}</div>

    {loading ? (
      <div className="flex justify-center mt-4">
        <Lottie animationData={loadingAnimation} loop className="w-20 h-20" />
      </div>
    ) : (
      <button
        onClick={handleConvertToSummary}
        className="block w-full bg-purple-500 text-white p-3 rounded mt-2 mb-4"
      >
        Convert to Summary & Save
      </button>
    )}

    {/* right Arrow Navigation */}
    <div className="flex justify-end">
                  <button
                    className="bg-blue-500 text-white p-2 rounded-full"
                    onClick={() => setStep(5)}
                  >
                    <ArrowRight size={24} />
                  </button>
                </div>
  
  </>
)}


            {/* Step 5: Summary */}
            {step === 5 && (
  <>
    <h2 className="text-lg font-semibold mb-4 text-center">Summary</h2>
    <div className="border p-4 rounded-lg h-32 overflow-auto">{summary}</div>

    {loading ? (
      <div className="flex justify-center mt-4">
        <Lottie animationData={loadingAnimation} loop className="w-20 h-20" />
      </div>
    ) : (
      <button
        onClick={handleConvertToKeywords}
        className="block w-full bg-purple-500 text-white p-3 rounded mt-2 mb-4"
      >
        Convert to Keywords & Save
      </button>
    )}

    {/* Right Arrow Button */} 
    <div className="flex justify-end">
                  <button
                    className="bg-blue-500 text-white p-2 rounded-full"
                    onClick={() => setStep(6)}
                  >
                    <ArrowRight size={24} />
                  </button>
                </div>
  </>
)}


            {/* Step 6: Keywords */}
            {step === 6 && (
  <>
    <h2 className="text-lg font-semibold mb-4 text-center">Keywords</h2>
    <div className="border p-4 rounded-lg h-32 overflow-auto space-y-1">
      {Array.isArray(keywords) ? (
        keywords.map((keyword: string, index: number) => (
          <div key={index} className="text-sm text-gray-800">
            • {keyword}
          </div>
        ))
      ) : (
        <p className="text-sm text-gray-500">No keywords extracted.</p>
      )}
    </div>

    <h2 className="text-xl font-semibold mb-4">Process Complete</h2>
    <p className="text-green-500 font-bold">Your document has been processed successfully!</p>

    <button
      className="absolute bottom-4 right-4 bg-green-500 text-white p-2 rounded-full"
      onClick={() => setUploadModal(false)}
    >
      <Check size={24} />
    </button>
  </>
)}


            {/* Navigation Buttons */}
            {step > 1 && step < 6 && (
              <button
                className="absolute bottom-6 left-4 bg-gray-500 text-white p-2 rounded-full"
                onClick={() => setStep(step - 1)}
              >
                <ArrowLeft size={24} />
              </button>
              
            )}
            {/* right Navigation Buttons 
 {step > 1 && step < 6 && (
<button
              className="absolute bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full"
              onClick={() => setStep(step + 1)}
            >
              <ArrowRight size={24} />
            </button>
            )} */}
          </div>
        </div>
      )}
    </div>
  );
}
