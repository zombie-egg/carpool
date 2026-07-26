"use client";

import {
  Activity,
  Component,
  HomeIcon,
  Mail,
  Package,
  ScrollText,
  SunMoon,
} from "lucide-react";
import { Dock, DockIcon, DockItem, DockLabel } from "@/components/ui/dock";

const DEMO_ITEMS = [
  { title: "Home", icon: HomeIcon },
  { title: "Products", icon: Package },
  { title: "Components", icon: Component },
  { title: "Activity", icon: Activity },
  { title: "Change Log", icon: ScrollText },
  { title: "Email", icon: Mail },
  { title: "Theme", icon: SunMoon },
];

// Development preview for the Apple-style magnifying Dock.
// Not routed in production; render it from a scratch page while designing.
export function AppleStyleDock() {
  return (
    <div className="absolute bottom-2 left-1/2 max-w-full -translate-x-1/2">
      <Dock className="items-end pb-3">
        {DEMO_ITEMS.map((item) => (
          <DockItem key={item.title}>
            <DockLabel>{item.title}</DockLabel>
            <DockIcon>
              <item.icon className="h-full w-full text-neutral-300" />
            </DockIcon>
          </DockItem>
        ))}
      </Dock>
    </div>
  );
}
