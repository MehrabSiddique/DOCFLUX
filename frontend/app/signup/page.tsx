"use client";
import { useState } from "react";
import { FaUser, FaEnvelope, FaLock } from "react-icons/fa";
import Link from "next/link";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!fullName || !email || !password) {
      alert("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });

      const data = await response.json(); // Parse response
      console.log("Response Data:", data); // Log response in console

      setLoading(false);

      if (response.ok) {
        alert("Signup successful!");
      } else {
        console.error("Signup Error:", data);
        alert(data.message || "Signup failed");
      }
    } catch (error) {
      setLoading(false);
      console.error("Fetch Error:", error);
      alert("Something went wrong. Check console for details.");
    }
  }; // <-- Make sure this bracket properly closes the function

  return (
    <div className="flex justify-center items-center min-h-screen bg-purple-100">
      <div className="flex flex-col md:flex-row w-11/12 md:w-2/3 h-[550px] bg-white rounded-lg shadow-lg overflow-hidden">
        
        {/* Form Section */}
        <div className="w-full md:w-1/2 bg-white p-8 text-center rounded-l-lg">
          <h2 className="text-indigo-600 text-2xl font-bold">Create Account</h2>
          <p className="text-sm text-indigo-600 mt-2">Sign Up with Email Address</p>

          {/* Input Fields */}
          <div className="relative mt-4">
            <FaUser className="absolute left-4 top-4 text-indigo-500" />
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-3 bg-purple-100 pl-10 border border-indigo-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="relative mt-4">
            <FaEnvelope className="absolute left-4 top-4 text-indigo-500" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 pl-10 border bg-purple-100 border-indigo-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="relative mt-4">
            <FaLock className="absolute left-4 top-4 text-indigo-500" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 pl-10 border bg-purple-100 border-indigo-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Terms & Conditions Checkbox */}
          <div className="flex items-center mt-4">
            <input
              type="checkbox"
              checked={agree}
              onChange={() => setAgree(!agree)}
              className="mr-2"
            />
            <span className="text-sm text-indigo-600">I Agree to Terms and Conditions</span>
          </div>

          {/* Signup Button */}
          <button
            onClick={handleSignup}
            disabled={!agree || loading}
            className={`w-3/4 mt-6 py-3 text-white rounded-full transition duration-300 ${
              agree
                ? "bg-indigo-400 hover:bg-indigo-500"
                : "bg-indigo-200 cursor-not-allowed"
            }`}
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
          <div className="mt-6 flex flex-wrap items-center justify-center sm:justify-center space-x-2 text-sm sm:text-base">
  <p className="text-gray-500">Already have an account?</p>
  <h1 className="py-3 text-indigo-500 rounded-full hover:text-indigo-600 transition duration-300 cursor-pointer">
    <a href="/">Sign In</a>
  </h1>
</div>



        </div>

       

        {/* Welcome Section (Hidden on Mobile) */}
        <div
          className="hidden md:flex w-1/2 bg-gray-100 h-full bg-cover bg-center"
          style={{ backgroundImage: "url('/signup1.png')" }}
        />
      </div>
    </div>
  );
}
