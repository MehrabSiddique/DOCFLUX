'use client';

import React, { useRef} from 'react';
import { useEffect, useState } from 'react';
import Header from '../components/header';
import Sidebar from '../components/sidebar';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<null | { id: string; filename: string }>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  

  const fetchConvertedDocs = async () => {
    if (!userId) return;
  
    try {
      const res = await fetch(`http://localhost:5000/get/converted-docs/${userId}`);
      if (!res.ok) throw new Error('Network response was not ok');
  
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
  

  const toggleFavorite = async (docId: string, isCurrentlyFavorite: boolean) => {
    try {
      const url = isCurrentlyFavorite
        ? `http://localhost:5000/get/remove-favorite/${docId}`
        : `http://localhost:5000/get/favorite/${docId}`;
  
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: isCurrentlyFavorite ? JSON.stringify({ isFavorite: false }) : null,
      });
  
      const data = await res.json();
      console.log('✅ Favorite toggled:', data);
  
      if (res.ok) {
        fetchConvertedDocs(); // Refresh document list
      } else {
        alert(data.message || 'Failed to update favorite status.');
      }
    } catch (error) {
      console.error('❌ Error updating favorite status:', error);
      alert('Server error occurred while updating favorite.');
    }
  };

 
  const handleDelete = async (docId: string) => {
    const confirmDelete = confirm("Are you sure you want to delete this document?");
    if (!confirmDelete) return;
  
    try {
      const res = await fetch(`http://localhost:5000/get/delete-doc/${docId}`, {
        method: 'DELETE',
      });
  
      const data = await res.json();
      console.log('✅ Server responded:', res.status, data);
  
      if (res.ok) {
        alert(data.message || 'Document deleted successfully');
        fetchConvertedDocs(); // Refresh list
      } else {
        alert(data.error || 'Failed to delete document.');
      }
    } catch (error) {
      console.error('❌ Error deleting document:', error);
      alert('Error while communicating with server.');
    }
  };

  const handleSearch = async () => {
    if (!userId || !searchQuery.trim()) return;
  
    try {
      const res = await fetch(`http://localhost:5000/get/search-docs/${userId}?query=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error('Search failed.');
  
      const data = await res.json();
      setDocuments(data); // Update with search results
    } catch (error) {
      console.error('❌ Search error:', error);
      alert('Failed to fetch search results.');
    }
  };
  
  
  return (
    <div className="min-h-screen flex flex-col bg-purple-100">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 space-y-6">
        <div className="flex justify-center mb-6">
    <input
      type="text"
      placeholder="Search by text, summary, or keywords..."
      className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:border-blue-300"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleSearch(); // Trigger on Enter key
      }}
    />
    <button
      onClick={handleSearch}
      className="ml-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
    >
      Search
    </button>
    {searchQuery && (
  <button
    onClick={() => {
      setSearchQuery('');
      fetchConvertedDocs(); // Reset to full list
    }}
    className="ml-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
  >
    Clear
  </button>
)}
  </div>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {documents.length > 0 ? (
            documents.map((doc) => (
              <div key={doc._id} className="bg-white rounded-lg shadow-md relative">
                <div className="absolute top-2 right-2 z-10">
                  <button
  className="text-gray-700 hover:text-black text-2xl" // <-- increased size
  onClick={() => setOpenMenuId(openMenuId === doc._id ? null : doc._id)}
>
  &#x22EE;
</button>

                  {openMenuId === doc._id && (
                    <div className="absolute right-0 mt-2 bg-white shadow-md rounded-md w-40 z-20">
                  

                      <button
                        onClick={() => {
                          handleDownload(doc._id);
                          setOpenMenuId(null);
                        }}
                        className="w-full text-left text-indigo-600 px-4 py-2 hover:bg-purple-100"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => {
                          toggleFavorite(doc._id, doc.isFavorite);
                          setOpenMenuId(null);
                        }}
                        className="w-full text-left text-indigo-600 px-4 py-2 hover:bg-purple-100"
                      >
                        {doc.isFavorite ? 'Unfavorite' : 'Add to Favorites'}
                      </button>
                      <button
    onClick={() => {
      handleDelete(doc._id);
      setOpenMenuId(null);
    }}
    className="w-full text-left px-4 py-2 text-indigo-600 hover:bg-purple-100"
  >
    Delete
  </button>
                    </div>
                  )}
                </div>

              <div className="h-64 flex items-center justify-center bg-indigo-200 rounded-t-lg p-4 text-center">
  {doc.convertedDocxPath ? (
    <a
      href={`http://localhost:5000/${doc.convertedDocxPath}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-indigo-800 font-semibold underline break-words"
    >
      View Converted DOCX
    </a>
  ) : (
    <span className="text-indigo-800 font-semibold">No DOCX Available</span>
  )}
</div>

                <div className="p-4">
                  <h3 className="font-medium text-md truncate">{doc.filename}</h3>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-10">
              <p className="text-gray-500">No converted DOCX documents found.</p>
            </div>
          )}
          </div>
        </main>
      </div>
    </div>
  );
}
