import React from 'react';
interface NodeIconProps {
    icon: string;
    size?: number;
    className?: string;
}
export declare function NodeIcon({ icon, size, className }: NodeIconProps): React.JSX.Element;
export declare function NodeIconSvg({ icon, size }: {
    icon: string;
    size?: number;
}): React.JSX.Element;
export {};
