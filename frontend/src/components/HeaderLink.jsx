import { FaSearch } from 'react-icons/fa';
import { Link } from 'react-router-dom';

export default function Navigation() {
  return (
    <nav className="hidden md:flex items-center justify-center space-x-12 w-full px-5 py-2 bg-[#DCE3E8]">
      <div className="flex items-center space-x-12">
        <Link to="/category/news" className="text-cyan-800 font-medium hover:text-yellow-500 transition-colors duration-200">
          NEWS
        </Link>
        <Link to="/category/sports" className="text-cyan-800 font-medium hover:text-yellow-500 transition-colors duration-200">
          SPORTS
        </Link>
        <Link to="/category/opinion" className="text-cyan-800 font-medium hover:text-yellow-500 transition-colors duration-200">
          OPINION
        </Link>
        <Link to="/category/literary" className="text-cyan-800 font-medium hover:text-yellow-500 transition-colors duration-200">
          LITERARY
        </Link>
        <Link to="/category/features" className="text-cyan-800 font-medium hover:text-yellow-500 transition-colors duration-200">
          FEATURES
        </Link>
        <Link to="/category/specials" className="text-cyan-800 font-medium hover:text-yellow-500 transition-colors duration-200">
          SPECIALS
        </Link>
        <Link to="/category/art" className="text-cyan-800 font-medium hover:text-yellow-500 transition-colors duration-200">
          ART
        </Link>
        <Link to="/about" className="text-cyan-800 font-medium hover:text-yellow-500 transition-colors duration-200">
          ABOUT
        </Link>
        <Link to="/contact" className="text-cyan-800 font-medium hover:text-yellow-500 transition-colors duration-200">
          CONTACT US
        </Link>
        <Link to="/search" className="text-cyan-800 text-xl hover:text-yellow-500 transition-colors duration-200">
          <FaSearch />
        </Link>
      </div>
    </nav>
  );
}
