import React from 'react';

export const COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 
  'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 
  'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 
  'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 
  'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'
];

export const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

const commonProps = {
  xmlns: "http://www.w3.org/2000/svg",
  width: "24",
  height: "24",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// Simple SVG Icons as components defined with React.createElement to support .ts extension
export const Icons = {
  Camera: () => React.createElement("svg", commonProps,
    React.createElement("path", { d: "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" }),
    React.createElement("circle", { cx: "12", cy: "13", r: "3" })
  ),
  History: () => React.createElement("svg", commonProps,
    React.createElement("path", { d: "M3 3v5h5" }),
    React.createElement("path", { d: "M3.05 13A9 9 0 1 0 6 5.3L3 8" })
  ),
  Plus: () => React.createElement("svg", commonProps,
    React.createElement("line", { x1: "12", y1: "5", x2: "12", y2: "19" }),
    React.createElement("line", { x1: "5", y1: "12", x2: "19", y2: "12" })
  ),
  Check: () => React.createElement("svg", commonProps,
    React.createElement("polyline", { points: "20 6 9 17 4 12" })
  ),
  Cake: () => React.createElement("svg", commonProps,
    React.createElement("path", { d: "M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" }),
    React.createElement("path", { d: "M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1" }),
    React.createElement("path", { d: "M2 21h20" }),
    React.createElement("path", { d: "M7 8v2" }),
    React.createElement("path", { d: "M12 8v2" }),
    React.createElement("path", { d: "M17 8v2" }),
    React.createElement("path", { d: "M7 4h.01" }),
    React.createElement("path", { d: "M12 4h.01" }),
    React.createElement("path", { d: "M17 4h.01" })
  ),
  Trash: () => React.createElement("svg", { ...commonProps, width: "20", height: "20" },
    React.createElement("polyline", { points: "3 6 5 6 21 6" }),
    React.createElement("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" })
  ),
  Share: () => React.createElement("svg", commonProps,
    React.createElement("circle", { cx: "18", cy: "5", r: "3" }),
    React.createElement("circle", { cx: "6", cy: "12", r: "3" }),
    React.createElement("circle", { cx: "18", cy: "19", r: "3" }),
    React.createElement("line", { x1: "8.59", y1: "13.51", x2: "15.42", y2: "17.49" }),
    React.createElement("line", { x1: "15.41", y1: "6.51", x2: "8.59", y2: "10.49" })
  ),
  ChevronLeft: () => React.createElement("svg", commonProps,
    React.createElement("polyline", { points: "15 18 9 12 15 6" })
  ),
  MoreHorizontal: () => React.createElement("svg", commonProps,
    React.createElement("circle", { cx: "12", cy: "12", r: "1" }),
    React.createElement("circle", { cx: "19", cy: "12", r: "1" }),
    React.createElement("circle", { cx: "5", cy: "12", r: "1" })
  ),
  X: () => React.createElement("svg", commonProps,
    React.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
    React.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
  ),
  DollarSign: () => React.createElement("svg", commonProps,
    React.createElement("line", { x1: "12", y1: "1", x2: "12", y2: "23" }),
    React.createElement("path", { d: "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" })
  ),
  CreditCard: () => React.createElement("svg", commonProps,
    React.createElement("rect", { x: "1", y: "4", width: "22", height: "16", rx: "2", ry: "2" }),
    React.createElement("line", { x1: "1", y1: "10", x2: "23", y2: "10" })
  )
};