import React from 'react';
import { Link } from 'react-router-dom';

const LoginButton = () => {
  return (
    <Link
      to="/login"
      className="w-40 px-12 py-3 bg-cyan-800 hover:bg-cyan-900 text-white font-medium rounded-lg shadow transition duration-150 border border-white"
    >
      Log In
    </Link>
  );
};

export default LoginButton;
