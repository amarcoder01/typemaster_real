/**
 * InlineTypingOverlay Component
 * 
 * Captures keyboard input directly on the paragraph text.
 * This creates an immersive "reading while typing" experience
 * instead of a separate textarea.
 * 
 * Features:
 * - Invisible input that captures keystrokes
 * - Positioned over the visible text
 * - Blocks paste/cut operations
 * - Handles composition events for IME
 * - Auto-focus when active
 */

import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { cn } from '@/lib/utils';

export interface InlineTypingOverlayProps {
  /** The text to be typed */
  text: string;
  /** Current user input */
  userInput: string;
  /** Callback when input changes */
  onInput: (value: string) => void;
  /** Whether typing is active */
  isActive: boolean;
  /** Callback when paragraph is completed */
  onComplete?: () => void;
  /** Callback when typing starts */
  onStart?: () => void;
  /** Whether the overlay is disabled */
  disabled?: boolean;
  /** Placeholder text shown before typing starts */
  placeholder?: string;
  /** Additional className */
  className?: string;
}

export interface InlineTypingOverlayHandle {
  focus: () => void;
  blur: () => void;
  reset: () => void;
}

export const InlineTypingOverlay = forwardRef<InlineTypingOverlayHandle, InlineTypingOverlayProps>(
  function InlineTypingOverlay(
    {
      text,
      userInput,
      onInput,
      isActive,
      onComplete,
      onStart,
      disabled = false,
      placeholder = 'Click here or start typing...',
      className,
    },
    ref
  ) {
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const isComposingRef = useRef(false);
    const hasStartedRef = useRef(false);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      reset: () => {
        hasStartedRef.current = false;
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      },
    }));

    // Auto-focus when becoming active
    useEffect(() => {
      if (isActive && !disabled && inputRef.current) {
        inputRef.current.focus();
      }
    }, [isActive, disabled]);

    // Check for completion
    useEffect(() => {
      if (userInput.length > 0 && userInput === text && onComplete) {
        onComplete();
      }
    }, [userInput, text, onComplete]);

    // Handle input changes
    const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (isComposingRef.current || disabled) return;
      
      const value = e.target.value;
      
      // Don't allow input longer than the text
      if (value.length > text.length) {
        e.target.value = userInput;
        return;
      }

      // Trigger start callback on first input
      if (!hasStartedRef.current && value.length > 0) {
        hasStartedRef.current = true;
        onStart?.();
      }

      onInput(value);
    }, [text.length, userInput, onInput, onStart, disabled]);

    // Handle composition (IME) events
    const handleCompositionStart = useCallback(() => {
      isComposingRef.current = true;
    }, []);

    const handleCompositionEnd = useCallback((e: React.CompositionEvent<HTMLTextAreaElement>) => {
      isComposingRef.current = false;
      // Process the composed text
      setTimeout(() => {
        if (inputRef.current) {
          const value = inputRef.current.value;
          if (value.length <= text.length) {
            if (!hasStartedRef.current && value.length > 0) {
              hasStartedRef.current = true;
              onStart?.();
            }
            onInput(value);
          } else {
            inputRef.current.value = userInput;
          }
        }
      }, 0);
    }, [text.length, userInput, onInput, onStart]);

    // Block paste operations
    const handlePaste = useCallback((e: React.ClipboardEvent) => {
      e.preventDefault();
    }, []);

    // Block cut operations
    const handleCut = useCallback((e: React.ClipboardEvent) => {
      e.preventDefault();
    }, []);

    // Handle key down for special keys
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Allow backspace, delete, arrow keys
      const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
      
      // Prevent Tab from changing focus while typing
      if (e.key === 'Tab' && isActive && userInput.length < text.length) {
        e.preventDefault();
      }

      // Block Ctrl+V, Ctrl+X
      if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'x')) {
        e.preventDefault();
      }
    }, [isActive, userInput.length, text.length]);

    // Handle focus
    const handleFocus = useCallback(() => {
      // Ensure cursor is at the end
      if (inputRef.current) {
        inputRef.current.setSelectionRange(userInput.length, userInput.length);
      }
    }, [userInput.length]);

    // Sync input value with userInput prop
    useEffect(() => {
      if (inputRef.current && inputRef.current.value !== userInput) {
        inputRef.current.value = userInput;
      }
    }, [userInput]);

    return (
      <div
        className={cn(
          'inline-typing-overlay',
          'absolute inset-0 z-10',
          className
        )}
      >
        <textarea
          ref={inputRef}
          value={userInput}
          onChange={handleInput}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onPaste={handlePaste}
          onCut={handleCut}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          disabled={disabled}
          placeholder={!isActive ? placeholder : ''}
          className={cn(
            'w-full h-full',
            'bg-transparent text-transparent caret-transparent',
            'resize-none outline-none border-none',
            'cursor-text',
            'selection:bg-transparent',
            // Hide scrollbar
            'overflow-hidden',
            '[&::-webkit-scrollbar]:hidden',
            '[-ms-overflow-style:none]',
            '[scrollbar-width:none]',
            // Placeholder styling
            'placeholder:text-muted-foreground/50 placeholder:text-center placeholder:pt-12',
            disabled && 'cursor-not-allowed'
          )}
          style={{
            // Match the text styling of the paragraph
            fontFamily: 'inherit',
            fontSize: 'inherit',
            lineHeight: 'inherit',
            letterSpacing: 'inherit',
          }}
          aria-label="Type the paragraph text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-testid="inline-typing-input"
        />
      </div>
    );
  }
);

export default InlineTypingOverlay;

