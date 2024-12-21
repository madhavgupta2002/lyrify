'use client';

import { useState } from 'react';

interface GenerateButtonProps {
    loading: boolean;
    disabled?: boolean;
    onClick?: () => void;
}

export default function GenerateButton({ loading, disabled, onClick }: GenerateButtonProps) {
    return (
        <button
            type="submit"
            disabled={loading || disabled}
            onClick={onClick}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-6 rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
        >
            {loading ? 'Generating Lyrics...' : 'Generate Lyrics'}
        </button>
    );
} 