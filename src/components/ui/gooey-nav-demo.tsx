import React, { useState, useEffect } from "react";
import { GooeyNav } from "./gooey-nav";

const items = [
  { label: "Rewards", href: "#" },
  { label: "Join Contest", href: "/contests-page" },
  { label: "Profile", href: "/profile" },
];

const GooeyNavDemo = () => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <div className="flex w-full min-h-screen flex-col justify-center items-center p-4 transition-colors duration-300 bg-black dark:bg-white">
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full border border-gray-700 dark:border-gray-300 bg-gray-900 dark:bg-gray-100 text-white dark:text-black"
        >
        </button>
      </div>

      <div className="relative flex justify-center items-center p-5 rounded-xl border border-gray-700 dark:border-gray-300 bg-black dark:bg-white shadow-xl dark:shadow-md"
           style={{ height: 'auto', minHeight: '100px' }}>
        <GooeyNav
          items={items}
          particleCount={15}
          particleDistances={[90, 10]}
          particleR={100}
          initialActiveIndex={1} // Set to 'Join Contest' for the initial active item
          animationTime={600}
          timeVariance={300}
        />
      </div>
    </div>
  );
};

export { GooeyNavDemo };
