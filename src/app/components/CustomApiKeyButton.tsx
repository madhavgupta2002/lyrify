'use client';

interface CustomApiKeyButtonProps {
    showApiKey: boolean;
    onClick: () => void;
}

export default function CustomApiKeyButton({ showApiKey, onClick }: CustomApiKeyButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="text-sm text-gray-300 hover:text-white flex items-center transition-colors duration-200"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 mr-2 transform transition-transform duration-200 ${showApiKey ? 'rotate-90' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                />
            </svg>
            <span>Use Custom API Key</span>
        </button>
    );
} 