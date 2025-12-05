
import React from 'react';
import { Card, FontType, CardTemplate } from '../types';
import { useAppContext } from '../context/AppContext';

interface CardRendererProps {
    card: Card;
    side: 'front' | 'back';
    template?: CardTemplate; // Optional template prop for preview mode
    mode?: 'full' | 'compact'; // 'full' uses template sizes, 'compact' forces standard size for lists
}

const CardRenderer: React.FC<CardRendererProps> = ({ card, side, template: propTemplate, mode = 'full' }) => {
    const { templates } = useAppContext();
    
    // Use the passed template (for preview) or find it in context
    const template = propTemplate || templates.find(t => t.id === card.templateId);

    if (!template) {
        return <div className="text-red-500 text-sm">Error: Template not found!</div>;
    }

    const layout = side === 'front' ? template.frontLayout : template.backLayout;

    // Filter visible fields
    let visibleItems = layout.filter(item => item.isVisible);

    // In compact mode, optimize by showing only the first 2 fields
    // This prevents cards with many fields from looking messy in the list view
    if (mode === 'compact') {
        visibleItems = visibleItems.slice(0, 2);
    }

    const renderedFields = visibleItems.map((item, index) => {
        const field = template.fields.find(f => f.id === item.fieldId);
        const value = card.fieldValues[item.fieldId];

        if (!field) return null; 

        let fontFamily = '';
        switch (item.fontFamily) {
            case 'handwriting':
                fontFamily = '"Patrick Hand", cursive';
                break;
            case 'serif':
                fontFamily = 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif';
                break;
            case 'sans':
            default:
                fontFamily = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
                break;
        }

        // In compact mode, we override size and alignment for list readability
        // We keep color, bold, and font-family for recognition
        const isCompact = mode === 'compact';

        const style: React.CSSProperties = {
            fontFamily: fontFamily,
            fontSize: isCompact ? '16px' : `${item.fontSize}px`,
            lineHeight: isCompact ? '1.5' : '1.2',
            color: item.color,
            fontWeight: item.isBold ? 'bold' : 'normal',
            whiteSpace: 'pre-wrap', 
            textAlign: isCompact ? 'left' : 'center',
            width: '100%',
            marginBottom: isCompact && index < visibleItems.length - 1 ? '0.25rem' : undefined, // Add small margin between fields in compact mode
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
        };

        return (
            <div key={item.fieldId} style={style} className={isCompact ? "" : ""}>
                {value || <span className="text-gray-600 opacity-50 italic text-sm">({field.name})</span>}
            </div>
        );
    });

    if (mode === 'compact') {
        // Use block layout for compact mode to ensure parent line-clamp works
        return (
            <div className="w-full text-left">
                {renderedFields.length > 0 ? renderedFields : <div className="text-gray-500 italic text-sm">(Empty)</div>}
            </div>
        );
    }

    // Default Flex layout for Study/Preview
    return (
        <div className="flex flex-col w-full items-center justify-center gap-4">
            {renderedFields.length > 0 ? renderedFields : <div className="text-gray-500 italic text-sm">(Empty)</div>}
        </div>
    );
};

export default CardRenderer;
