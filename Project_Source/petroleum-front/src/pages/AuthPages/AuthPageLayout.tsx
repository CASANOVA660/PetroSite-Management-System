import React from "react";
import { Link } from "react-router-dom";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute -top-[30%] -left-[10%] w-[50%] h-[60%] rounded-full bg-[#FA812F]/20 blur-[120px] animate-float-slow"></div>
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-[#FA812F]/30 blur-[100px] animate-float-medium"></div>
        <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] rounded-full bg-blue-500/10 blur-[80px] animate-float-fast"></div>
      </div>

      <div className="relative flex flex-col lg:flex-row w-full min-h-screen">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex w-full lg:w-1/2 bg-[#FA812F] items-center justify-center relative overflow-hidden">
          {/* Background patterns */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/logo/small-logo.png')] bg-repeat opacity-10 transform rotate-12 scale-150"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-[#FA812F]/90 to-[#FA812F]"></div>
          </div>

          {/* Animated circles */}
          <div className="absolute w-64 h-64 rounded-full bg-white/10 -top-32 -left-32 animate-pulse"></div>
          <div className="absolute w-48 h-48 rounded-full bg-white/5 bottom-20 right-10 animate-pulse-slow"></div>

          <div className="z-10 text-center px-8 max-w-xl">
            <div className="relative transform transition-all duration-700 hover:scale-105">
              <Link to="/" className="block mb-8 transition-transform duration-300 hover:scale-105">
                <img
                  className="w-64 mx-auto drop-shadow-xl"
                  src="/images/logo/petroconnect-logo.svg"
                  alt="Italfluid Petroconnect"
                />
              </Link>
            </div>

            <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">
              Système de Gestion Pétrolière
            </h2>

            <p className="text-white/80 max-w-md mx-auto text-lg mb-8">
              La solution complète pour gérer efficacement vos ressources pétrolières avec des outils avancés et une interface intuitive.
            </p>

            <div className="flex justify-center gap-4 mt-6">
              <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-sm text-white text-center w-32 border border-white/20 transition-all hover:bg-white/20">
                <div className="text-2xl font-bold mb-1">100%</div>
                <div className="text-sm text-white/70">Sécurisé</div>
              </div>
              <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-sm text-white text-center w-32 border border-white/20 transition-all hover:bg-white/20">
                <div className="text-2xl font-bold mb-1">24/7</div>
                <div className="text-sm text-white/70">Support</div>
              </div>
              <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-sm text-white text-center w-32 border border-white/20 transition-all hover:bg-white/20">
                <div className="text-2xl font-bold mb-1">+500</div>
                <div className="text-sm text-white/70">Utilisateurs</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form Content */}
        <div className="flex items-center justify-center w-full lg:w-1/2 px-6 py-10 lg:py-0">
          {children}
        </div>

        {/* Theme Toggler */}
        <div className="fixed z-50 bottom-6 right-6">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
