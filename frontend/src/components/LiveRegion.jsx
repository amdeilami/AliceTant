/**
 * LiveRegion Component
 * 
 * Provides screen reader announcements for dynamic content updates.
 * Uses ARIA live regions to announce changes to assistive technologies.
 * 
 * Features:
 * - Polite announcements (default) - announced when screen reader is idle
 * - Assertive announcements - announced immediately, interrupting current speech
 * - Automatic cleanup of old announcements
 * 
 * @param {Object} props - Component props
 * @param {string} props.message - Message to announce
 * @param {string} [props.politeness='polite'] - ARIA live politeness level ('polite' or 'assertive')
 * @param {boolean} [props.atomic=true] - Whether entire region should be announced
 */
import { useEffect, useRef } from 'react';

const LiveRegion = ({ message, politeness = 'polite', atomic = true }) => {
    const regionRef = useRef(null);

    useEffect(() => {
        if (message && regionRef.current) {
            // Clear and set message to ensure announcement
            regionRef.current.textContent = '';
            setTimeout(() => {
                if (regionRef.current) {
                    regionRef.current.textContent = message;
                }
            }, 100);
        }
    }, [message]);

    return (
        <div
            ref={regionRef}
            role="status"
            aria-live={politeness}
            aria-atomic={atomic}
            className="sr-only"
        />
    );
};

export default LiveRegion;
