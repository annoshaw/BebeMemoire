import { Heart, Instagram, Twitter, Facebook } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-400 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <h3 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
              <span className="w-8 h-8 bg-stone-700 rounded-full flex items-center justify-center text-white font-sans text-lg">M</span>
              Memoria
            </h3>
            <p className="text-sm leading-relaxed max-w-xs">
              Capturing life's most precious moments, one memory at a time. Designed for modern families in Canada and beyond.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">How it works</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Download App</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Gift Cards</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Connect</h4>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-white transition-colors"><Instagram size={20} /></a>
              <a href="#" className="hover:text-white transition-colors"><Twitter size={20} /></a>
              <a href="#" className="hover:text-white transition-colors"><Facebook size={20} /></a>
            </div>
            <p className="mt-6 text-xs">
              Made with <Heart size={12} className="inline text-red-500" /> in Montreal.
            </p>
          </div>
        </div>
        
        <div className="border-t border-stone-800 mt-12 pt-8 text-xs text-center md:text-left flex flex-col md:flex-row justify-between items-center">
          <p>&copy; 2025 Memoria Inc. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}