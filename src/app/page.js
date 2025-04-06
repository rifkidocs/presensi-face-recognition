"use client";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

const WebCamContainer = dynamic(() => import("../components/WebcamContainer"), {
  ssr: false,
});

export default function Home() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-center p-4 md:p-8 bg-gray-900'>
      <div className='container mx-auto max-w-4xl rounded-xl overflow-hidden'>
        <div className='p-2 md:p-8'>
          <WebCamContainer />
        </div>
      </div>
    </main>
  );
}
