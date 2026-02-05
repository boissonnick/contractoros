"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Animation variant for the transition
   * - fade: Simple opacity fade (default)
   * - slideUp: Slide up with fade
   * - slideLeft: Slide in from right with fade
   * - scale: Scale up with fade
   */
  variant?: 'fade' | 'slideUp' | 'slideLeft' | 'scale';
  /**
   * Duration of the animation in milliseconds
   * @default 200
   */
  duration?: number;
  /**
   * Whether to animate on initial mount
   * @default true
   */
  animateOnMount?: boolean;
}

/**
 * PageTransition - Subtle page transition animations for dashboard routes
 *
 * Wraps page content and provides smooth enter/exit animations when navigating
 * between dashboard routes. Uses Tailwind CSS for animations.
 *
 * @example
 * ```tsx
 * // In a page component
 * export default function ProjectsPage() {
 *   return (
 *     <PageTransition>
 *       <div>Page content...</div>
 *     </PageTransition>
 *   );
 * }
 * ```
 */
export function PageTransition({
  children,
  className,
  variant = 'fade',
  duration = 200,
  animateOnMount = true,
}: PageTransitionProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(!animateOnMount);
  const [currentPath, setCurrentPath] = useState(pathname);

  // Handle route changes
  useEffect(() => {
    if (pathname !== currentPath) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- timeout callback is an async handler
      setIsVisible(false);
      // Small delay before showing new content
      const timeout = setTimeout(() => {
        setCurrentPath(pathname);
        setIsVisible(true);
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [pathname, currentPath]);

  // Handle initial mount animation
  useEffect(() => {
    if (animateOnMount && !isVisible) {
      // Trigger animation after a brief delay to ensure DOM is ready
      const timeout = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timeout);
    }
  }, [animateOnMount, isVisible]);

  // Animation classes based on variant
  const baseTransition = `transition-all ease-out`;
  const durationClass = duration <= 150 ? 'duration-150' :
                        duration <= 200 ? 'duration-200' :
                        duration <= 300 ? 'duration-300' : 'duration-500';

  const variantClasses = {
    fade: {
      initial: 'opacity-0',
      visible: 'opacity-100',
    },
    slideUp: {
      initial: 'opacity-0 translate-y-2',
      visible: 'opacity-100 translate-y-0',
    },
    slideLeft: {
      initial: 'opacity-0 translate-x-2',
      visible: 'opacity-100 translate-x-0',
    },
    scale: {
      initial: 'opacity-0 scale-[0.98]',
      visible: 'opacity-100 scale-100',
    },
  };

  const animationClasses = variantClasses[variant];

  return (
    <div
      className={cn(
        baseTransition,
        durationClass,
        isVisible ? animationClasses.visible : animationClasses.initial,
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Staggered animation wrapper for lists of items
 * Each child is animated with a slight delay after the previous
 */
interface StaggeredTransitionProps {
  children: React.ReactNode[];
  className?: string;
  /**
   * Delay between each item's animation in milliseconds
   * @default 50
   */
  staggerDelay?: number;
  /**
   * Base animation variant
   * @default 'slideUp'
   */
  variant?: 'fade' | 'slideUp' | 'slideLeft' | 'scale';
}

export function StaggeredTransition({
  children,
  className,
  staggerDelay = 50,
  variant = 'slideUp',
}: StaggeredTransitionProps) {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    children.forEach((_, index) => {
      const timeout = setTimeout(() => {
        setVisibleItems(prev => new Set(Array.from(prev).concat(index)));
      }, index * staggerDelay + 10);
      timeouts.push(timeout);
    });

    return () => timeouts.forEach(clearTimeout);
  }, [children, staggerDelay]);

  const variantClasses = {
    fade: {
      initial: 'opacity-0',
      visible: 'opacity-100',
    },
    slideUp: {
      initial: 'opacity-0 translate-y-3',
      visible: 'opacity-100 translate-y-0',
    },
    slideLeft: {
      initial: 'opacity-0 translate-x-3',
      visible: 'opacity-100 translate-x-0',
    },
    scale: {
      initial: 'opacity-0 scale-95',
      visible: 'opacity-100 scale-100',
    },
  };

  const animationClasses = variantClasses[variant];

  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <div
          key={index}
          className={cn(
            'transition-all duration-300 ease-out',
            visibleItems.has(index) ? animationClasses.visible : animationClasses.initial
          )}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

/**
 * Hover scale animation wrapper
 * Provides subtle scale effect on hover for interactive elements
 */
interface HoverScaleProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Scale factor on hover (1.02 = 2% larger)
   * @default 1.02
   */
  scale?: number;
}

export function HoverScale({
  children,
  className,
  scale = 1.02,
}: HoverScaleProps) {
  return (
    <div
      className={cn(
        'transition-transform duration-200 ease-out',
        className
      )}
      style={{
        // Use CSS custom property for dynamic scale
        ['--hover-scale' as string]: scale,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = `scale(${scale})`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
      }}
    >
      {children}
    </div>
  );
}

/**
 * Fade in on scroll animation wrapper
 * Elements fade in when they enter the viewport
 */
interface FadeInOnScrollProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Threshold for triggering animation (0-1, where 0.1 = 10% visible)
   * @default 0.1
   */
  threshold?: number;
  /**
   * Animation variant
   * @default 'slideUp'
   */
  variant?: 'fade' | 'slideUp' | 'slideLeft' | 'scale';
}

export function FadeInOnScroll({
  children,
  className,
  threshold = 0.1,
  variant = 'slideUp',
}: FadeInOnScrollProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Unobserve after first intersection
          if (ref.current) observer.unobserve(ref.current);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  const variantClasses = {
    fade: {
      initial: 'opacity-0',
      visible: 'opacity-100',
    },
    slideUp: {
      initial: 'opacity-0 translate-y-4',
      visible: 'opacity-100 translate-y-0',
    },
    slideLeft: {
      initial: 'opacity-0 translate-x-4',
      visible: 'opacity-100 translate-x-0',
    },
    scale: {
      initial: 'opacity-0 scale-95',
      visible: 'opacity-100 scale-100',
    },
  };

  const animationClasses = variantClasses[variant];

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-500 ease-out',
        isVisible ? animationClasses.visible : animationClasses.initial,
        className
      )}
    >
      {children}
    </div>
  );
}

export default PageTransition;
