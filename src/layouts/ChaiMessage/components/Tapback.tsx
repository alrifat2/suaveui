import { AnimatePresence, motion } from "framer-motion";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { usePrevious } from "~/hooks/usePrevious";
import { useScreenSize } from "~/hooks/useScreenSize";
import { useTouchHold } from "~/hooks/useTouchHold";

export type TapbackAction = {
  label: string;
  icon: React.ReactNode;
  className?: string;
  onPress:
    | ((...args: any[]) => any)
    | {
        callback: (...args: any[]) => any;
        immediate?: boolean;
      };
  hidden?: boolean;
};

export type TapbackProps<T extends React.ElementType> = {
  as?: T;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  longPressDuration?: number;
  menuClassName?: string;
  actions?: TapbackAction[];
  transformOrigin?: "left" | "right";
  blur?: boolean;
  blurClassName?: string;
} & React.ComponentPropsWithoutRef<T>;

const _Tapback = <T extends React.ElementType>({ ..._props }: TapbackProps<T>) => {
  // Cast to <div> to get autocomplete
  const {
    as = "div",
    children,
    longPressDuration,
    isOpen,
    onOpenChange,
    transformOrigin = "left",
    menuClassName,
    actions,
    blur = true,
    blurClassName,
    ...props
  } = _props as React.ComponentPropsWithoutRef<"div"> & TapbackProps<T>;

  const [shouldOffset, setShouldOffset] = useState<number | undefined>(undefined);
  const prevShouldOffset = usePrevious(shouldOffset);
  const [isBackdropAnimating, setIsBackdropAnimating] = useState(false);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const upAnimationRef = useRef<Animation | null>(null);
  const downAnimationRef = useRef<Animation | null>(null);

  const [isDropdownAnimating, setIsDropdownAnimating] = useState(false);

  const Component: React.ElementType = as ?? "div";

  const recalculateOffset = useCallback(() => {
    if (!dropdownMenuRef.current) return;

    const child = dropdownMenuRef.current?.children?.[0] as HTMLDivElement | undefined;

    if (child) {
      const rect = child?.getBoundingClientRect();
      // if off screen, offset
      const top = rect?.top ?? 0;
      const height = child?.offsetHeight ?? 0;
      const windowHeight = window.innerHeight;

      const marginTop = 80;

      if (top + height + marginTop > windowHeight) {
        const offset = top - windowHeight + height + marginTop;
        setShouldOffset(offset);
      } else {
        setShouldOffset(undefined);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(recalculateOffset, 50);
    } else {
      setShouldOffset(undefined);
    }
  }, [isOpen, longPressDuration, recalculateOffset]);

  useEffect(() => {
    void (async () => {
      if (!elementRef.current) return;

      const transformProps: KeyframeAnimationOptions = {
        duration: 310,
        fill: "forwards",
        easing: "cubic-bezier(0.34, 0.152, 0.1, 1)",
      };

      // ignore initial render
      if (shouldOffset === prevShouldOffset) {
        return;
      }

      if (shouldOffset) {
        upAnimationRef.current?.cancel();
        upAnimationRef.current = await elementRef.current.animate(
          { transform: `translate3D(0, ${-shouldOffset}px, 0)` },
          transformProps,
        ).finished;

        // upAnimationRef?.current?.commitStyles();
        // upAnimationRef?.current?.cancel();
      } else {
        downAnimationRef.current?.cancel();
        downAnimationRef.current = await elementRef.current.animate({ transform: "initial" }, { ...transformProps })
          .finished;

        // motion framer bugfix
        // downAnimationRef?.current?.commitStyles();
        // downAnimationRef?.current?.cancel();
      }
    })();
  }, [shouldOffset, prevShouldOffset]);

  const onMenuOpen = useCallback(() => {
    /**
     * Remove user text selection if any
     */
    window.getSelection()?.removeAllRanges();

    onOpenChange?.(true);
  }, [onOpenChange]);

  const handleActionClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, action: TapbackAction) => {
      e.preventDefault();
      e.stopPropagation();

      onOpenChange?.(false);

      if (typeof action.onPress === "function") {
        setTimeout(() => {
          (action.onPress as () => void)();
        }, 300);
      } else {
        if (action.onPress.immediate) {
          action.onPress.callback(e);
        } else {
          setTimeout(action.onPress.callback, 300);
        }
      }
    },
    [onOpenChange],
  );

  const longPressProps = useTouchHold({
    callback: onMenuOpen,
    duration: longPressDuration ?? 300,
    enabled: !isOpen,
    targetRef: elementRef as React.RefObject<HTMLElement>,
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (elementRef.current?.contains(e.target as Node) || dropdownMenuRef.current?.contains(e.target as Node)) {
        return;
      }

      if (isDropdownAnimating || !isOpen) return;
      onOpenChange?.(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownAnimating, isOpen, onOpenChange]);

  /**
   * Detect Esc
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onOpenChange?.(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    } else {
      document.removeEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onOpenChange]);

  return (
    <>
      <AnimatePresence>
        {isOpen && blur && (
          <motion.div
            className={twMerge(
              "fixed left-0 top-0 z-[99] h-dvh w-dvw transform-gpu select-none bg-black/70 backdrop-blur-2xl",
              blurClassName,
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.18, ease: "easeOut" } }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            onAnimationStart={() => setIsBackdropAnimating(true)}
            onAnimationComplete={() => setIsBackdropAnimating(false)}
          />
        )}
      </AnimatePresence>

      <Component
        {...props}
        className={twMerge(
          props.className,
          "select-none sm:select-text",
          (isOpen || isBackdropAnimating) && "z-[100] select-text",
        )}
        ref={elementRef}
        {...longPressProps}
      >
        {children}

        {/* Context menu (copy, etc.) */}
        <div
          ref={dropdownMenuRef}
          className={twMerge("tapback-dropdown", isDropdownAnimating && "pointer-events-none select-none")}
        >
          <AnimatePresence initial={false}>
            {isOpen && (
              <>
                <motion.div
                  onAnimationStart={() => setIsDropdownAnimating(true)}
                  onAnimationComplete={() => setIsDropdownAnimating(false)}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20, duration: 0.4 }}
                  className={twMerge(
                    "[--bg:#1A1A1ADD]",
                    "absolute top-[100%] z-[100] mb-1 mt-1 flex min-w-[180px] flex-col divide-y divide-white/5 rounded-xl bg-[var(--bg)] text-white backdrop-blur-xl",
                    transformOrigin === "left" && "left-0 [transform-origin:top_left]",
                    transformOrigin === "right" && "right-0 [transform-origin:top_right]",
                    menuClassName,
                  )}
                >
                  {actions?.map((action) => {
                    if (action.hidden === true) return null;

                    return (
                      <div
                        key={action.label}
                        className={twMerge(
                          "flex w-full cursor-pointer items-center justify-between gap-2 px-4 py-3",
                          action.className,
                        )}
                        onClick={(e) => handleActionClick?.(e, action)}
                      >
                        <span>{action.label}</span>
                        {action.icon}
                      </div>
                    );
                  })}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </Component>
    </>
  );
};

export const Tapback = React.memo(_Tapback) as typeof _Tapback;
