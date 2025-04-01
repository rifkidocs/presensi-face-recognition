"use client";
import dynamic from "next/dynamic";

const WebCamContainer = dynamic(() => import("../components/WebcamContainer"), {
  ssr: false,
});

export default function Home() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-center'>
      <WebCamContainer />
    </main>
  );
}
