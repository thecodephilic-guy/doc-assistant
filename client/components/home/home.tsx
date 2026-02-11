import { SignUp } from "@clerk/nextjs";

import React from "react";

function HomeView() {
  return (
    <>
      <div className="flex flex-col lg:flex-row items-center justify-center min-h-[calc(100vh-100px)] px-6 py-12 gap-10 lg:gap-20 max-w-6xl mx-auto">
        {/* Left Column: Text */}
        <div className="flex-1 text-center lg:text-left space-y-8 max-w-xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium mx-auto lg:mx-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            Now with Gemini 1.5 Flash
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-[1.1]">
            Chat with your <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-rose-500 to-orange-500">
              PDF Documents
            </span>
          </h1>

          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg mx-auto lg:mx-0">
            Stop scrolling through endless pages. Upload your documents and get
            instant answers, summaries, and insights powered by AI.
          </p>
        </div>

        {/* Right Column: Auth Form */}
        <div className="relative max-w-auto">
          {/* The Glow Effect - Toned down slightly */}
          <div className="absolute -inset-2 bg-linear-to-r from-rose-500 to-orange-500 rounded-2xl blur-lg opacity-20"></div>

          {/* The Card */}
          <div className="relative bg-white/50 backdrop-blur-xl p-2 rounded-2xl shadow-xl border border-white/60">
            <SignUp routing="hash" />
          </div>
        </div>
      </div>
      ;
    </>
  );
}

export default HomeView;
