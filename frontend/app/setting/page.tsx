"use client";
import { useEffect, useState } from "react";
import Sidebar from "../components/sidebar";
import Header from "../components/header";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [profileImage, setProfileImage] = useState("/default-avatar.png");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  
  const fetchUserData = async () => {
    // Check if window is defined to ensure this is client-side
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        console.log("Fetching user data with token:", token); // Log the token here
        const res = await fetch("http://localhost:5000/auth/user", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Unauthorized");
        }

        const data = await res.json();
        setName(data.fullName);
        setEmail(data.email);
        if (data.profileImage) setProfileImage(data.profileImage);
      } catch (err) {
        console.error("Fetch error:", err);
        setMessage("Failed to fetch user data.");
      }
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleUpdate = async () => {
    const token = localStorage.getItem("token");
    if (!token) return setMessage("Please login again.");

    if (!name || !email) {
      setMessage("Name and email are required.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/auth/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          email,
          password: password || undefined,
          profileImage, // optional: base64 or URL
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      setMessage("Profile updated successfully!");
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || "Failed to update profile.");
    }
  };

  return (
    <div className="flex h-screen bg-purple-100">
      <Sidebar />

      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-2xl font-bold text-center text-indigo-600 mb-4">User Settings</h2>

          {/* Profile Picture */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <img
                src={profileImage}
                alt="Profile"
                className="w-28 h-28 rounded-full border-4 border-indigo-300 object-cover"
              />
              <label className="absolute bottom-0 right-0 bg-indigo-500 text-white rounded-full p-1 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                ✎
              </label>
            </div>
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="block text-gray-700">Name</label>
            <input
              type="text"
              className="w-full mt-1 p-3 border rounded-lg bg-purple-100 border-indigo-300"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              className="w-full mt-1 p-3 border rounded-lg bg-purple-100 border-indigo-300"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="block text-gray-700">Password</label>
            <input
              type="password"
              className="w-full mt-1 p-3 border rounded-lg bg-purple-100 border-indigo-300"
              placeholder="Enter new password (optional)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {message && <p className="text-center text-sm text-red-500 mb-4">{message}</p>}

          {/* Update Button */}
          <button
            onClick={handleUpdate}
            className="w-full bg-indigo-500 text-white font-semibold py-3 rounded-lg hover:bg-indigo-600 transition-all"
          >
            Update Profile
          </button>
        </div>
      </div>
    </div>
  );
}
