"use client";
import { useState } from "react";
import { FaEnvelope, FaLock } from "react-icons/fa";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1); // Step 1: Email, Step 2: Code, Step 3: New Password
  const [code, setCode] = useState(["", "", "", ""]); // Array for 4-digit code
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const API_URL = "http://localhost:5000/password"; // Update this with your backend URL

  const sendResetCode = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/send-reset-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setStep(2);
      }
      setMessage(data.message);
    } catch (error) {
      setMessage("Error sending reset code. Try again.");
    }
    setLoading(false);
  };

  const verifyCode = async () => {
    setLoading(true);
    try {
      const enteredCode = code.join(""); // Combine code boxes
      const response = await fetch(`${API_URL}/verify-reset-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: enteredCode }),
      });
      const data = await response.json();
      if (response.ok) {
        setStep(3);
      }
      setMessage(data.message);
    } catch (error) {
      setMessage("Error verifying code. Try again.");
    }
    setLoading(false);
  };

  const resetPassword = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage("Password changed successfully! You can now log in.");
        setStep(1);
        setEmail("");
        setNewPassword("");
        setCode(["", "", "", ""]);
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage("Error resetting password. Try again.");
    }
    setLoading(false);
  };


  
  const handleCodeInput = (index, value) => {
    if (!/^\d?$/.test(value)) return; // Allow only single digits
  
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
  
    if (value && index < 3) {
      document.getElementById(`code-${index + 1}`).focus();
    }
  };
  
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d{4}$/.test(pastedData)) return; // Ensure it's exactly 4 digits
  
    const newCode = pastedData.split(""); // Split string into array
    setCode(newCode);
  
    // Move focus to the last filled box
    document.getElementById(`code-${newCode.length - 1}`)?.focus();
  };
  

  const resendCode = async () => {
    setMessage("Resending code...");
    sendResetCode();
  };

  

  return (
    <div className="flex min-h-screen items-center justify-center bg-purple-100">
      <div className="w-full max-w-4xl flex bg-white shadow-lg rounded-xl overflow-hidden min-h-[550px]">
        <div
          className="hidden md:block md:w-1/2 bg-cover bg-center"
          style={{
            backgroundImage: "url('/forgot.png')",
            minHeight: "600px",
          }}
        ></div>

        <div className="w-full md:w-1/2 p-12 text-center flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-indigo-600 mb-3">
            {step === 1
              ? "Forgot Password?"
              : step === 2
              ? "Enter Verification Code"
              : "Reset Password"}
          </h2>
          <p className="text-indigo-600 mb-6 text-sm">
            {step === 1
              ? "Enter your email to reset your password"
              : step === 2
              ? "We sent a 4-digit code to your email"
              : "Enter a new password for your account"}
          </p>

          {message && <p className="text-red-500 text-sm mb-2">{message}</p>}

          {step === 1 && (
            <>
              <div className="relative mb-4">
                <FaEnvelope className="absolute left-4 top-3 text-indigo-500" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full pl-10 p-3 rounded-lg bg-purple-100 text-indigo-800 border border-indigo-300 focus:ring-indigo-400 focus:border-indigo-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button
                className="w-full bg-indigo-400 hover:bg-indigo-500 text-white font-semibold p-3 rounded-lg transition-all duration-300"
                onClick={sendResetCode}
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Code"}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex justify-center gap-2 mb-4">
              {code.map((digit, index) => (
  <input
    key={index}
    id={`code-${index}`}
    type="text"
    maxLength={1}
    className="w-12 h-12 text-center text-xl border border-indigo-300 rounded-lg focus:ring-indigo-400 focus:border-indigo-400"
    value={digit}
    onChange={(e) => handleCodeInput(index, e.target.value)}
    onPaste={handlePaste} // Attach paste event handler
  />
))}

              </div>
              <p className="text-gray-600 text-sm">
                Didn't receive code?{" "}
                <button
                  className="text-indigo-600 hover:underline"
                  onClick={resendCode}
                >
                  Resend Code
                </button>
              </p>
              <button
                className="w-full bg-indigo-400 hover:bg-indigo-500 text-white font-semibold p-3 rounded-lg transition-all duration-300 mt-4"
                onClick={verifyCode}
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <div className="relative mb-4">
                <FaLock className="absolute left-4 top-3 text-indigo-500" />
                <input
                  type="password"
                  placeholder="Enter new password"
                  className="w-full pl-10 p-3 rounded-lg bg-purple-100 text-indigo-800 border border-indigo-300 focus:ring-indigo-400 focus:border-indigo-400"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <button
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold p-3 rounded-lg transition-all duration-300"
                onClick={resetPassword}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save New Password"}
              </button>
            </>
          )}

          <p className="mt-4 text-gray-500 text-sm">
            Remember your password?{" "}
            <a href="/" className="text-indigo-600 hover:underline">
              Login here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
