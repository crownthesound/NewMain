"use client";
import React, { useId, useMemo } from "react";
import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import type { Container, SingleOrMultiple } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import { cn } from "@/lib/utils";
import { motion, useAnimation } from "framer-motion";

interface ParticlesProps {
  id?: string;
  className?: string;
  background?: string;
  particleSize?: number;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleColor?: string;
  particleDensity?: number;
}

export const SparklesCore = (props: ParticlesProps) => {
  const {
    id,
    className,
    background = "transparent",
    minSize = 0.4,
    maxSize = 1.2,
    speed = 1,
    particleColor = "#ffffff",
    particleDensity = 100,
  } = props;
  const [init, setInit] = useState(false);
  
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);
  
  const controls = useAnimation();

  const particlesLoaded = async (container?: Container) => {
    if (container) {
      await controls.start({
        opacity: 1,
        transition: {
          duration: 1,
        },
      });
    }
  };

  const generatedId = useId();
  
  return (
    <motion.div 
      animate={controls} 
      initial={{ opacity: 0 }}
      className={cn("opacity-0", className)}
    >
      {init && (
        <Particles
          id={id || generatedId}
          className={cn("absolute inset-0 h-full w-full pointer-events-none")}
          particlesLoaded={particlesLoaded}
          options={{
            background: {
              color: {
                value: background,
              },
            },
            fullScreen: {
              enable: false,
              zIndex: 0,
            },
            fpsLimit: 120,
            interactivity: {
              events: {
                onClick: {
                  enable: false,
                  mode: "push",
                },
                onHover: {
                  enable: false,
                  mode: "repulse",
                },
                resize: {
                  enable: true,
                  delay: 0.5,
                },
              },
              modes: {
                push: {
                  quantity: 4,
                },
                repulse: {
                  distance: 200,
                  duration: 0.4,
                },
              },
            },
            particles: {
              color: {
                value: particleColor,
              },
              move: {
                direction: "none",
                enable: true,
                outModes: {
                  default: "out",
                },
                speed: {
                  min: speed * 0.1,
                  max: speed,
                },
              },
              number: {
                density: {
                  enable: true,
                  area: 800,
                },
                value: particleDensity,
              },
              opacity: {
                value: {
                  min: 0.1,
                  max: 0.8,
                },
                animation: {
                  enable: true,
                  speed: 2,
                  sync: false,
                  startValue: "random",
                },
              },
              shape: {
                type: "circle",
              },
              size: {
                value: {
                  min: minSize,
                  max: maxSize,
                },
                animation: {
                  enable: true,
                  speed: 1,
                  sync: false,
                  startValue: "random",
                },
              },
            },
            detectRetina: true,
          }}
        />
      )}
    </motion.div>
  );
};