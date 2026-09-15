import React, { useState, useEffect } from 'react';

const Skeleton = ({ className }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(true);
        }, 100)
        return () => clearTimeout(timer);
    }, []);

    return (
        <div
            className={`animate-pulse bg-gray-200 rounded-md transition-opacity duration-500 ${
                visible ? 'opacity-100' : 'opacity-0'
            } ${className}`}
        />
    );
};

export default Skeleton;