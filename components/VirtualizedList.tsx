import React, { useState, useRef, useCallback, useEffect } from 'react';

interface VirtualizedListProps {
    itemCount: number;
    itemHeight: number;
    renderItem: (props: { index: number, style: React.CSSProperties }) => React.ReactNode;
}

const VirtualizedList: React.FC<VirtualizedListProps> = ({ itemCount, itemHeight, renderItem }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);

    useEffect(() => {
        if (!containerRef.current) return;

        // Initialize height
        setContainerHeight(containerRef.current.clientHeight);

        // Use ResizeObserver for robust size tracking
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.target === containerRef.current) {
                    setContainerHeight(entry.contentRect.height);
                }
            }
        });

        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    // Scroll Reset Logic: When items change (e.g. search filter), reset scroll to top
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = 0;
            setScrollTop(0);
        }
    }, [itemCount]);

    const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(event.currentTarget.scrollTop);
    }, []);

    const renderItems = () => {
        if (!containerHeight) return [];

        const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 5); // Render 5 items before for smooth scroll
        const endIndex = Math.min(
            itemCount - 1,
            Math.floor((scrollTop + containerHeight) / itemHeight) + 5 // Render 5 items after
        );
        
        const items = [];
        for (let i = startIndex; i <= endIndex; i++) {
            items.push(
                renderItem({
                    index: i,
                    style: {
                        position: 'absolute',
                        top: `${i * itemHeight}px`,
                        width: '100%',
                        height: `${itemHeight}px`
                    }
                })
            );
        }
        return items;
    };

    const totalHeight = itemCount * itemHeight;

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            style={{ height: '100%', overflowY: 'auto', position: 'relative' }}
        >
            <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
                {renderItems()}
            </div>
        </div>
    );
};

export default VirtualizedList;