'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sun, Moon, ArrowDown, ArrowUp } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

export default function FloatingControls({ showScroll = false }: { showScroll?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY < 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!mounted) return null;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 ">
      {showScroll &&
        (isAtTop ? (
          <Button variant="outline" size="icon" onClick={scrollToBottom} className="cursor-pointer bg-white dark:bg-[#151515] border-[#e5e5e5] dark:border-[#383838]">
            <ArrowDown className="h-5 w-5" />
          </Button>
        ) : (
          <Button variant="outline" size="icon" onClick={scrollToTop} className="cursor-pointer bg-white dark:bg-[#151515] dark:border-[#383838]">
            <ArrowUp className="h-5 w-5" />
          </Button>
        ))}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="cursor-pointer bg-white dark:bg-[#151515] border-[#e5e5e5] dark:border-[#383838]">
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className={`${theme === 'light' ? 'bg-muted' : ''} cursor-pointer`} onClick={() => setTheme('light')}>
            Light
          </DropdownMenuItem>
          <DropdownMenuItem className={`${theme === 'dark' ? 'bg-muted' : ''} cursor-pointer`} onClick={() => setTheme('dark')}>
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem className={`${theme === 'system' ? 'bg-muted' : ''} cursor-pointer`} onClick={() => setTheme('system')}>
            System
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
