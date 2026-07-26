"use client";

import { BackgroundBeams } from "@/components/ui/background-beams";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Development preview for the BackgroundBeams component.
// Not routed in production; render it from a scratch page while designing.
export function BackgroundBeamsDemo() {
  return (
    <div className="relative flex h-[40rem] w-full flex-col items-center justify-center rounded-md bg-neutral-950 antialiased">
      <div className="relative z-10 mx-auto max-w-2xl p-4 text-center">
        <h1 className="bg-gradient-to-b from-neutral-200 to-neutral-600 bg-clip-text text-lg font-bold text-transparent md:text-7xl">
          Li&apos;an Campus Carpool
        </h1>
        <p className="relative z-10 mx-auto my-4 max-w-lg text-sm text-neutral-500">
          Background beams preview: animated gradient paths behind the page
          content, masked towards the center for a soft spotlight effect.
        </p>
        <div className="relative z-10 mx-auto flex max-w-md gap-2">
          <Input placeholder="you@lian.edu.cn" />
          <Button>Preview</Button>
        </div>
      </div>
      <BackgroundBeams />
    </div>
  );
}
