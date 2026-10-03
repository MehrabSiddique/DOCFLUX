"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Import useRouter for navigation
import { LogOut, Edit, Settings, Trash2, Menu, Upload } from "lucide-react";

export default function Header() {
  const userId = typeof window !== "undefined" ? sessionStorage.getItem("userId") : null;
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  // Check if it's client-side rendering
  useEffect(() => {
    setIsClient(true);  // We can now access localStorage safely
  }, []);

  const fetchProfileImage = async () => {
    try {
      // Make sure localStorage is available on the client side
      if (isClient) {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found");
          return;
        }

        const response = await fetch('http://localhost:5000/auth/profile-image', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setProfileImage(data.profileImage);
        } else {
          console.error('Failed to fetch profile image');
        }
      }
    } catch (error) {
      console.error("Error fetching profile image:", error);
    }
  };

  useEffect(() => {
    if (isClient) {
      fetchProfileImage();
    }
  }, [isClient]);

  const handleLogout = () => {
    // Clear the JWT token from localStorage
    localStorage.removeItem("jwtToken");

    // Redirect to the login page
    router.push("/"); // Redirect to the login page (adjust the path if needed)
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
    <header className="bg-[#fcc623] shadow-md px-4 py-3 flex items-center justify-between md:px-6">
    {/* Left - Title */}
    <h1 className="text-lg md:text-xl font-bold text-gray-800 ml-8 sm:ml-0">
      DOCUMENT MANAGEMENT SYSTEM
    </h1>
  
    {/* Center - Search Bar */}
   
  
   {/* Right - Profile Picture with Dropdown */}
<div className="relative flex items-center">
  <img
    src={profileImage}
    alt="Profile"
    className="w-10 h-10 aspect-square rounded-full object-cover cursor-pointer border border-gray-300"
    onClick={() => setMenuOpen(!menuOpen)}
  />
  
      {/* Dropdown Menu */}
      {menuOpen && (
  <div className="absolute right-0 top-12 w-44 bg-white border rounded-lg shadow-lg">
    
    {/* Edit Profile */}
    <button
      className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center text-sm md:text-base text-indigo-700 font-semibold"
      onClick={() => router.push('/setting')}
    >
      <Edit className="w-5 h-5 mr-2 text-indigo-700" /> Edit Profile
    </button>

    {/* Reset Password */}
    <button
      className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center text-sm md:text-base text-indigo-700 font-semibold"
      onClick={() => router.push('/resetpassword')}
    >
      <Settings className="w-5 h-5 mr-2 text-indigo-700" /> Reset Password
    </button>

    {/* Logout */}
    <button
      className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center text-sm md:text-base text-indigo-700 font-semibold"
      onClick={handleLogout}
    >
      <LogOut className="w-5 h-5 mr-2 text-indigo-700" /> Logout
    </button>
  </div>
)}

    </div>
  </header>
  
  );
}
