/**
 * Navbar.tsx: A navigation bar component with text title or logo.
 */
import { Link } from 'react-router-dom';
import { ArrowLeft, Menu } from 'lucide-react';

type NavbarProps = {
  title?: string;
  showBack?: boolean;
  showMenu?: boolean;
  onClickMenu?: () => void;
  transparent?: boolean;
  textColor?: string;
};

/**
 * A responsive navigation bar with customizable title, back button, and menu toggle.
 */
const Navbar: React.FC<NavbarProps> = ({
  title = '',
  showBack = false,
  showMenu = false,
  onClickMenu,
  transparent = false,
  textColor = 'text-main',
}) => {
  return (
    <div
      className={`z-30 sticky top-0 w-full ${
        transparent ? 'bg-transparent' : 'bg-white/80 backdrop-blur-sm shadow-sm border-b border-border/30'
      }`}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBack && (
              <Link to="/" aria-label="Back" className={`p-2 rounded-full hover:bg-neutral-100 ${textColor}`}>
                <ArrowLeft size={20} />
              </Link>
            )}
            <div className={`text-xl font-medium ${textColor}`}>{title}</div>
          </div>

          {showMenu && (
            <button
              onClick={onClickMenu}
              className={`p-2 rounded-full hover:bg-neutral-100 ${textColor}`}
              aria-label="Menu"
            >
              <Menu size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;