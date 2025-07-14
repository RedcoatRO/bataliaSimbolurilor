
import React from 'react';

export const GoogleIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M48 24C48 22.0427 47.8227 20.1273 47.4818 18.2727H24.5V28.8182H37.8182C37.2636 32.0909 35.7136 34.8545 33.2182 36.6364V43.1455H41.5C45.5727 39.2364 48 32.1818 48 24Z" fill="#4285F4"/>
    <path d="M24.5 48C31.0273 48 36.5727 45.6545 41.5 41.7273L33.2182 36.6364C30.9364 38.0909 27.9727 39 24.5 39C17.7 39 12.0682 34.4182 10.1545 28.5H1.54545V35.1818C6.32727 43.1818 14.7364 48 24.5 48Z" fill="#34A853"/>
    <path d="M10.1545 28.5C9.68636 27.0818 9.40909 25.5636 9.40909 24C9.40909 22.4364 9.68636 20.9182 10.1545 19.5H1.54545C0.545455 21.6 0 24 0 24C0 24 0.545455 26.4 1.54545 28.5L10.1545 28.5Z" fill="#FBBC05"/>
    <path d="M24.5 9C28.3182 9 31.4364 10.3636 33.9 12.6364L41.7636 4.85455C36.5727 0.436364 31.0273 0 24.5 0C14.7364 0 6.32727 4.81818 1.54545 12.8182L10.1545 19.5C12.0682 13.5818 17.7 9 24.5 9Z" fill="#EA4335"/>
  </svg>
);

export const PlayerIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"/>
    </svg>
);

export const AiIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12,2A10,10,0,0,0,2,12A10,10,0,0,0,12,22A10,10,0,0,0,22,12A10,10,0,0,0,12,2M8.5,7A1.5,1.5,0,0,1,10,8.5A1.5,1.5,0,0,1,8.5,10A1.5,1.5,0,0,1,7,8.5A1.5,1.5,0,0,1,8.5,7M15.5,7A1.5,1.5,0,0,1,17,8.5A1.5,1.5,0,0,1,15.5,10A1.5,1.5,0,0,1,14,8.5A1.5,1.5,0,0,1,15.5,7M12,18C9.5,18,7.5,16.5,6.6,14.5H17.4C16.5,16.5,14.5,18,12,18Z"/>
    </svg>
);

export const SparklesIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L9.5 9.5L2 12L9.5 14.5L12 22L14.5 14.5L22 12L14.5 9.5L12 2Z"/>
    </svg>
);

export const SendIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" />
    </svg>
);

export const QuestionMarkIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 19H14V17H10V19ZM12 2C8.13 2 5 5.13 5 9C5 10.57 5.58 12.02 6.59 13.08L8.03 14.53C8.42 14.92 8.61 15.45 8.57 16H15.43C15.39 15.45 15.58 14.92 15.97 14.53L17.41 13.08C18.42 12.02 19 10.57 19 9C19 5.13 15.87 2 12 2Z"/>
    </svg>
);

export const LikeIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 21h4V9H1v12zM23 10c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z"/>
    </svg>
);

export const ConfusedIcon: React.FC<{className?: string}> = ({ className }) => (
     <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z" opacity="0.6"/>
        <path d="M11 7h2v6h-2zm0 8h2v2h-2z"/>
    </svg>
);