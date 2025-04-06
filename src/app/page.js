"use client";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

const WebCamContainer = dynamic(() => import("../components/WebcamContainer"), {
  ssr: false,
});

export default function Home() {
  return (
    <main className='flex justify-center items-center min-h-screen bg-gray-900'>
      <div>
        <WebCamContainer />
      </div>
    </main>
  );
}
