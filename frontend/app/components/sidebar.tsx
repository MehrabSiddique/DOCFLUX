"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Home, FileText, Star, Settings, Menu, X } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { label: "Home", icon: <Home className="mr-3" />, href: "/home" },
    { label: "Documents", icon: <FileText className="mr-3" />, href: "/docs" },
    { label: "Favorites", icon: <Star className="mr-3" />, href: "/favourite" },
    { label: "Settings", icon: <Settings className="mr-3" />, href: "/setting" },
  ];

  return (
    <>
      {/* Mobile Hamburger Button */}
      {!isOpen && (
        <button
          className="sm:hidden fixed top-4 left-2 z-50 bg-[#5C21D2] p-2 rounded-md text-white"
          onClick={() => setIsOpen(true)}
        >
          <Menu size={24} />
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-60 bg-[#5C21D2] text-white p-4 transform transition-transform duration-300 z-40 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } sm:translate-x-0 sm:relative sm:w-60`}
      >
        {/* Mobile Close Button */}
        <div className="sm:hidden absolute top-4 right-4">
          <button
            className="bg-white text-[#5C21D2] p-2 rounded-md"
            onClick={() => setIsOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <h1 className="text-xl font-bold mb-6 text-center mt-12 sm:mt-0">📂 File Manager</h1>

        {/* Navigation Links */}
        <nav className="flex flex-col space-y-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center p-2 rounded-lg transition-colors duration-200 ${
                  isActive ? "bg-indigo-800" : "hover:bg-indigo-900"
                }`}
              >
                {item.icon} {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Background Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black opacity-30 sm:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
