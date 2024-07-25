import Link from 'next/link';
import Image from 'next/image';
import { UserButton } from '@clerk/nextjs';
import { ModeToggle } from '@/components/mode-toggle';

const Navbar = () => {
  return (
    <nav className="flex items-center justify-between p-4 bg-zinc-900">
      <Link href="/" className="text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300">
        <div className="relative w-8 h-8">
          <Image
            src="/logo-light.png"
            alt="Logo Light"
            layout="fill"
            className="hidden dark:block"
          />
          <Image
            src="/logo-dark.png"
            alt="Logo Dark"
            layout="fill"
            className="block dark:hidden"
          />
        </div>
      </Link>
      
      <div className="flex items-center space-x-4">
        <Link href="/about" className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300">
          About
        </Link>
        <Link href="/services" className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300">
          Services
        </Link>
        <ModeToggle />
        <UserButton/>
      </div>
    </nav>
  );
};

export default Navbar;
