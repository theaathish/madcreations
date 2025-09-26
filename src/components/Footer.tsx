import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img
                src="/logo.png"
                alt="Mad Creations Logo"
                className="h-8 w-8 object-contain"
              />
              <span className="text-2xl font-bold">Mad Creations</span>
            </div>
            <p className="text-gray-300 mb-4">
              Your one-stop destination for high-quality posters, polaroids, and custom designs. 
              Bringing your walls to life with amazing artwork and personalized creations.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com/madcreations" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://instagram.com/madcreations" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://twitter.com/madcreations" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/posters" className="text-gray-300 hover:text-purple-400 transition-colors">
                  Posters
                </Link>
              </li>
              <li>
                <Link to="/polaroids" className="text-gray-300 hover:text-purple-400 transition-colors">
                  Polaroids
                </Link>
              </li>
              <li>
                <Link to="/bundles" className="text-gray-300 hover:text-purple-400 transition-colors">
                  Bundles
                </Link>
              </li>
              <li>
                <Link to="/customizable" className="text-gray-300 hover:text-purple-400 transition-colors">
                  Custom Designs
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Categories</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-300 hover:text-purple-400 transition-colors">
                  Anime & Manga
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-purple-400 transition-colors">
                  Movies & TV
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-purple-400 transition-colors">
                  Sports
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-purple-400 transition-colors">
                  Celebrities
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-purple-400 transition-colors">
                  Motivational
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-purple-400" />
                <a href="mailto:madcreationoffl@gmail.com" className="text-gray-300 hover:text-purple-400 transition-colors">
                  madcreationoffl@gmail.com
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-purple-400" />
                <a href="tel:+918667009306" className="text-gray-300 hover:text-purple-400 transition-colors">
                  +91 8667009306
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-purple-400" />
                <span className="text-gray-300">Chennai, Tamil Nadu, India</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="text-center">
            <p className="text-gray-400 mb-2">
              © 2024 Mad Creations. All rights reserved. | 
              <Link to="/privacy" className="hover:text-purple-400 transition-colors ml-1">
                Privacy Policy
              </Link> | 
              <Link to="/terms" className="hover:text-purple-400 transition-colors ml-1">
                Terms of Service
              </Link>
            </p>
            <div className="border-t border-gray-700 pt-4 mt-4">
              <p className="text-sm text-gray-500">
                Developed by{' '}
                <a 
                  href="https://www.strucureo.works" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 transition-colors font-medium"
                >
                  www.strucureo.works
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;