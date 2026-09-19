import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChefHat, Heart, Home as HomeIcon } from "lucide-react";

export const Header = () => {
  const { pathname } = useLocation();
  const isActive = (p) => pathname === p;

  return (
    <header
      data-testid="nav-header"
      className="sticky top-0 z-40 bg-cream/90 backdrop-blur-md border-b border-[#E2DACF]"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link
          to="/"
          data-testid="nav-logo"
          className="flex items-center gap-2.5 group"
        >
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-sage text-cream transition-colors duration-300 group-hover:bg-sage-hover">
            <ChefHat size={20} strokeWidth={2} />
          </span>
          <span className="font-serif text-lg sm:text-xl font-bold text-ink leading-none">
            Zero Sprechi <span className="text-terracotta">Chef</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/"
            data-testid="nav-link-home"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${
              isActive("/")
                ? "bg-sage text-cream"
                : "text-ink-muted hover:bg-sage-light hover:text-ink"
            }`}
          >
            <HomeIcon size={16} />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <Link
            to="/preferiti"
            data-testid="nav-link-favorites"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors duration-300 ${
              isActive("/preferiti")
                ? "bg-sage text-cream"
                : "text-ink-muted hover:bg-sage-light hover:text-ink"
            }`}
          >
            <Heart size={16} />
            <span className="hidden sm:inline">Preferiti</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};
