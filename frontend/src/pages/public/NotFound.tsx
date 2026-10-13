import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-24 text-center">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#1C2541]/10 text-[#0B132B] mx-auto flex items-center justify-center font-serif text-2xl font-bold">
          404
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0B132B]">
            Page Not Found
          </h1>
          <p className="text-xs text-gray-600 leading-relaxed">
            The page you requested could not be located on the Anveshana Club portal. It may have moved or been updated.
          </p>
        </div>
        <Link to="/" className="inline-block">
          <Button variant="primary" size="md">
            Return to Homepage
          </Button>
        </Link>
      </div>
    </div>
  );
};
