'use client';

import { useEffect, useState } from 'react';
import Header from '../components/header';
import Sidebar from '../components/sidebar';
import DocumentPreview from '../components/DocumentPreview';
import { useRouter } from 'next/navigation';

type DocumentType = {
  _id: string;
  filename: string;
  filepath: string;
  mimetype: string;
  convertedDocxPath: string;
  isFavorite: boolean;
};

export default function ConvertedDocsPage() {
  const userId = typeof window !== "undefined" ? sessionStorage.getItem("userId") : null;
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentType | null>(null);
  const router = useRouter();

  const fetchConvertedDocs = async () => {
    if (!userId) return;

    try {
      const res = await fetch(`http://localhost:5000/get/converted-docs/${userId}`);
      const data = await res.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching converted docs:', error);
    }
  };

  useEffect(() => {
    fetchConvertedDocs();
  }, [userId]);

  const handleDownload = (docId: string) => {
    const link = document.createElement('a');
    link.href = `http://localhost:5000/get/download/${docId}`;
    link.download = ''; // Let the server control the filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleFavorite = async (docId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`http://localhost:5000/favorite/${docId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !currentStatus }),
      });

      const data = await res.json();
      console.log(data);
      fetchConvertedDocs(); // Refresh updated favorite status
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleEdit = (docId: string) => {
    router.push(`/edit/${docId}`);
  };

  // Get appropriate icon and color based on document mimetype
  const getDocumentTypeInfo = (mimetype: string) => {
    if (mimetype.includes('pdf')) {
      return {
        icon: '📄',
        label: 'PDF File',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800'
      };
    } else if (mimetype.includes('image')) {
      return {
        icon: '🖼️',
        label: 'Image File',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800'
      };
    } else if (mimetype.includes('wordprocessingml.document')) {
      return {
        icon: '📝',
        label: 'DOCX File',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800'
      };
    } else {
      return {
        icon: '📄',
        label: 'Document',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800'
      };
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {documents.length > 0 ? (
            documents.map((doc) => {
              const { icon, label, bgColor, textColor } = getDocumentTypeInfo(doc.mimetype);
              return (
                <div key={doc._id} className="bg-white rounded-lg shadow-md relative">
                  <div className="absolute top-2 right-2 z-10">
                    <button
                      className="text-gray-700 hover:text-black"
                      onClick={() => setOpenMenuId(openMenuId === doc._id ? null : doc._id)}
                    >
                      &#x22EE;
                    </button>
                    {openMenuId === doc._id && (
                      <div className="absolute right-0 mt-2 bg-white shadow-md rounded-md w-40 z-20">
                        <button
                          onClick={() => {
                            handleEdit(doc._id);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            handleDownload(doc._id);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => {
                            handleToggleFavorite(doc._id, doc.isFavorite);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100"
                        >
                          {doc.isFavorite ? 'Unfavorite' : 'Add to Favorites'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div 
                    className={`h-64 flex flex-col items-center justify-center ${bgColor} rounded-t-lg cursor-pointer`}
                    onClick={() => setPreviewDoc(doc)}
                  >
                    <span className="text-6xl mb-2">{icon}</span>
                    <span className={`${textColor} font-semibold`}>{label}</span>
                  </div>

                  <div className="p-4">
                    <h3 className="font-medium text-md truncate">{doc.filename}</h3>
                    <p className="text-xs text-gray-500 mt-1">Converted Document</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 text-center py-10">
              <p className="text-gray-500">No converted documents found.</p>
            </div>
          )}
          {previewDoc && (
            <DocumentPreview
              documentId={previewDoc._id}
              filename={previewDoc.filename}
              mimetype={previewDoc.mimetype}
              onClose={() => setPreviewDoc(null)}
            />
          )}
        </main>
      </div>
    </div>
  );
}