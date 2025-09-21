import React from "react";
import { Link } from "react-router-dom";

const Logo: React.FC<{ size?: number; linkToHome?: boolean }> = ({ size = 44, linkToHome = true }) => {
  const logoContent = (
    <div
      className="rounded-[30%] bg-accentDark flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
      style={{ width: size, height: size }}
    >
      <img
        src={"/src/images/logo.png"}
        alt="SukoonVerse Logo"
        className="object-contain rounded-[25%]"
        style={{ width: size * 0.85, height: size * 0.85 }}
      />
    </div>
  );
  
  return linkToHome ? (
    <Link to="/" className="flex items-center">
      {logoContent}
    </Link>
  ) : (
    logoContent
  );
};

export default Logo;
