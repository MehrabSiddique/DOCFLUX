'use client';

import { useEffect, useRef, useState } from "react";
import Sidebar from "../components/sidebar";
import Header from "../components/header";

type DocumentType = {
  _id: string;
  filename: string;
  filepath: string;
  mimetype: string;
  convertedDocxPath: string;
  isFavorite: boolean;
};

export default function Favorites() {
  const [favorites, setFavorites] = useState<DocumentType[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<null | { id: string; filename: string }>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const userId = typeof window !== "undefined" ? sessionStorage.getItem("userId") : null;
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFavorites = async () => {
    try {
      const res = await fetch(`http://localhost:5000/get/favorites/${userId}`);
      const data = await res.json();
      setFavorites(data);
    } catch (error) {
      console.error("Failed to fetch favorites:", error);
    }
  };
  
  useEffect(() => {
    if (userId) fetchFavorites();
  }, [userId]);
  
  const handleDownload = (docId: string) => {
    const link = document.createElement("a");
    link.href = `http://localhost:5000/get/download/${docId}`;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const handleRemoveFromFavorites = async (docId: string) => {
    try {
      await fetch(`http://localhost:5000/get/remove-favorite/${docId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: false }),
      });
      setFavorites(prev => prev.filter(doc => doc._id !== docId));
    } catch (error) {
      console.error("Failed to unfavorite:", error);
    }
  };

  const handleSearch = async () => {
    if (!userId || !searchQuery.trim()) return;
  
    try {
      const res = await fetch(`http://localhost:5000/get/search-favorites/${userId}?query=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error('Search failed.');
  
      const data = await res.json();
      setFavorites(data); // Set filtered favorite documents
    } catch (error) {
      console.error('❌ Search error:', error);
      alert('Failed to fetch search results.');
    }
  };
  

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
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
    fetchFavorites(); // Fetch full favorites again
  }}
    className="ml-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
  >
    Clear
  </button>
)}
  </div>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {favorites.length > 0 ? (
            favorites.map((doc) => (
              <div key={doc._id} className="bg-white rounded-lg shadow-md relative">
                {/* Dropdown Menu Trigger */}
                <div className="absolute top-2 right-2 z-10">
                  <button
                    className="text-gray-700 hover:text-black text-2xl"
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
                          handleRemoveFromFavorites(doc._id);
                          setOpenMenuId(null);
                        }}
                        className="w-full text-left text-indigo-600 px-4 py-2 hover:bg-purple-100"
                      >
                        Remove from Favorites
                      </button>
                    </div>
                  )}
                </div>

                {/* Preview */}
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

                {/* Filename */}
                <div className="p-4">
                  <h3 className="font-medium text-md truncate">{doc.filename}</h3>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-10">
              <p className="text-gray-500">No favorite documents yet.</p>
            </div>
          )}
          </div>
        </main>
      </div>
    </div>
  );
}
