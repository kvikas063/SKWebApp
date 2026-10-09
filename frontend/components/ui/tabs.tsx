"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // `w-fit` hugs the triggers on a wide screen; `max-w-full` clamps the bar
      // to the available width on a narrow one, where `overflow-x-auto` turns
      // the remainder into a sideways scroll instead of an off-screen overflow.
      "flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-2xl border bg-muted/50 p-1.5 text-muted-foreground",
      // Five triggers are wider than a phone, so the bar scrolls sideways
      // instead of running off the edge. The scrollbar is hidden and a
      // partially visible trailing tab is the affordance that it scrolls.
      "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "group inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
      // Scoped to the inactive state so the hover wash cannot fight the active
      // gradient when a selected tab is hovered.
      "data-[state=inactive]:hover:bg-background data-[state=inactive]:hover:text-foreground",
      // The active pill reuses the indigo-to-violet gradient the app's buttons,
      // stat cards and avatars already use, so the bar reads as part of the
      // same design language rather than a stock grey pill.
      "data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-indigo-500/25 data-[state=active]:hover:from-indigo-700 data-[state=active]:hover:to-violet-700",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };