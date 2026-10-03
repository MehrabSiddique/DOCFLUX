"use client";
import { useState } from "react";
import { useRouter } from "next/navigation"; // Import useRouter for navigation
import { FaUser, FaLock } from "react-icons/fa";
import Link from "next/link"; 

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const router = useRouter(); // ✅ Router for navigation
  
  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await res.json();
      console.log("Response Data:", data); // Debugging
  
      if (!res.ok) {
        throw new Error(data.error || "Login failed"); // Show actual error
      }
  
      localStorage.setItem("token", data.token);
      sessionStorage.setItem("userId", data.user._id);
      alert("Login Successful!");
      router.push("./home");
    } catch (error) {
      console.error("Login Error:", error);
      alert(error.message); // Show only the error message
    }
  };
  

  return (
    <div className="flex min-h-screen items-center justify-center bg-purple-50">
      <div className="flex w-full max-w-4xl shadow-xl rounded-lg overflow-hidden bg-white min-h-[85vh]">
        {/* Left Side - Login Form */}
        <div className="w-full md:w-1/2 p-10 text-center flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-indigo-600 mb-3">Welcome Back</h2>
          <p className="text-indigo-600 mb-6">Sign in to continue</p>

          {/* Login Form */}
          <div className="mt-4">
            <div className="relative mb-4">
              <FaUser className="absolute left-4 top-3 text-indigo-400" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)} // ✅ Update email state
                className="w-full pl-10 p-3 rounded-lg bg-purple-100 text-indigo-800 border border-indigo-300 focus:ring-indigo-400 focus:border-indigo-400"
              />
            </div>

            <div className="relative mb-4">
              <FaLock className="absolute left-4 top-3 text-indigo-400" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)} // ✅ Update password state
                className="w-full pl-10 p-3 rounded-lg bg-purple-100 text-indigo-800 border border-indigo-300 focus:ring-indigo-400 focus:border-indigo-400"
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex justify-between text-indigo-500 text-sm mb-4">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" onChange={() => setRemember(!remember)} />
                Remember Me
              </label>
              <Link href="/forgotpassword" className="hover:underline text-indigo-500">
                Forgot Password?
              </Link>
            </div>

            {/* Login Button */}
            <button
              onClick={handleLogin} // ✅ Call function on click
              className="w-full bg-indigo-400 hover:bg-indigo-500 text-white font-semibold p-3 rounded-lg transition-all duration-300"
            >
              Login
            </button>

            {/* Create Account Button (With Link) */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 text-sm sm:text-base text-center">
  <p className="text-gray-500">Don't have an account?</p>
  <Link href="/signup">
    <p className="text-indigo-500 font-semibold hover:text-indigo-700 transition-all duration-300 cursor-pointer">
      Create Account
    </p>
  </Link>
</div>



          </div>
        </div>

        {/* Right Side - Background Image */}
        <div
          className="hidden md:block w-1/2 bg-cover bg-center"
          style={{ backgroundImage: "url('/login1.png')" }}
        ></div>
      </div>
    </div>
  );
}
