import React from "react";

const Logo: React.FC<{ size?: number }> = ({ size = 44 }) => (
  <div
    className="rounded-full bg-accentDark flex items-center justify-center"
    style={{ width: size, height: size }}
  >
    <img
      src={"/src/images/logo.png"}
      alt="Logo"
      className="object-contain rounded-full"
      style={{ width: size * 0.8, height: size * 0.8 }}
    />
  </div>
);

export default Logo;
