"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/sidebar";
import Header from "../components/header";

export default function ResetPassword() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const token = localStorage.getItem("token");

  const handleResetPassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setMessage("All fields are required.");
      return;
    }
  
    if (newPassword !== confirmPassword) {
      setMessage("New passwords do not match!");
      return;
    }
  
    try {
      const token = localStorage.getItem("token"); // ✅ Ensure token is stored here after login
      if (!token) {
        setMessage("Unauthorized: No token found");
        return;
      }
  
      const res = await fetch("http://localhost:5000/repassword/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // ✅ Add token to header
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
  
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Password change failed");
  
      setMessage("Password updated successfully! Redirecting...");
      setTimeout(() => router.push("/"), 3000);
    } catch (error: any) {
      setMessage(error.message);
    }
  };
  
  return (
    <div className="flex h-screen bg-purple-100">
      <Sidebar />
      
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold text-indigo-500 text-center">Change Password</h2>
            {message && <p className="text-center text-red-500 mt-2">{message}</p>}

            {/* Old Password */}
            <div className="mt-4">
              <label className="block text-gray-600 text-sm">Old Password</label>
              <input
                type="password"
                className="w-full p-3 rounded-lg bg-purple-100 border border-indigo-300 focus:ring-indigo-400 focus:border-indigo-400"
                placeholder="Enter old password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>

            {/* New Password */}
            <div className="mt-4">
              <label className="block text-gray-600 text-sm">New Password</label>
              <input
                type="password"
                className="w-full p-3 rounded-lg bg-purple-100 border border-indigo-300 focus:ring-indigo-400 focus:border-indigo-400"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            {/* Confirm New Password */}
            <div className="mt-4">
              <label className="block text-gray-600 text-sm">Confirm New Password</label>
              <input
                type="password"
                className="w-full p-3 rounded-lg bg-purple-100 border border-indigo-300 focus:ring-indigo-400 focus:border-indigo-400"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              onClick={handleResetPassword}
              className="w-full mt-6 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold p-3 rounded-lg transition-all duration-300"
            >
              Update Password
            </button>
          </div>
        </div>
      </div>
  );
}
