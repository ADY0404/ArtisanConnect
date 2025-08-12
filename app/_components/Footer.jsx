import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Facebook, Twitter, Instagram } from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Artisan Connect */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Artisan Connect</h3>
            <p className="text-gray-500 text-sm">
              Connecting homeowners with skilled artisans for all your home service needs.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-gray-400 hover:text-gray-500">
                <Facebook className="h-6 w-6" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-gray-500">
                <Twitter className="h-6 w-6" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-gray-500">
                <Instagram className="h-6 w-6" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Quick Links</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/search/cleaning" className="text-gray-500 hover:text-gray-900">Services</Link></li>
              <li><Link href="/provider/register" className="text-gray-500 hover:text-gray-900">Providers</Link></li>
              <li><Link href="/about" className="text-gray-500 hover:text-gray-900">About Us</Link></li>
              <li><Link href="/contact" className="text-gray-500 hover:text-gray-900">Contact</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Legal</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/terms" className="text-gray-500 hover:text-gray-900">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-gray-500 hover:text-gray-900">Privacy Policy</Link></li>
              <li><Link href="/cookies" className="text-gray-500 hover:text-gray-900">Cookie Policy</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Newsletter</h3>
            <p className="mt-4 text-sm text-gray-500">
              Subscribe to our newsletter for updates and promotions.
            </p>
            <form className="mt-4 flex flex-col sm:flex-row gap-2">
              <Input type="email" placeholder="Email" className="w-full" />
              <Button type="submit" className="w-full sm:w-auto">Subscribe</Button>
            </form>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Artisan Connect. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer; 