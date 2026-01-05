// components/HomeEventRenderer.tsx
import type React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useHomeEventsStore } from '../../store/homeEventsStore';


export const HomeEventRenderer: React.FC = () => {
    const {
        getNextEventToShow,
        markEventShown,
        markEventDismissed,
        markEventCompleted,
        isHomeVisible,
        isHomeDataReady,
    } = useHomeEventsStore();

    const [currentEvent, setCurrentEvent] = useState(() => getNextEventToShow());

    // Update current event when home becomes visible and data is ready
    useEffect(() => {
        if (isHomeVisible && isHomeDataReady) {
            const nextEvent = getNextEventToShow();
            setCurrentEvent(nextEvent);
        } else {
            // Clear current event if home is not ready
            setCurrentEvent(null);
        }
    }, [isHomeVisible, isHomeDataReady, getNextEventToShow]);

    // Mark event as shown when it appears
    useEffect(() => {
        if (currentEvent && isHomeVisible && isHomeDataReady) {
            markEventShown(currentEvent.id);
        }
    }, [currentEvent?.id, isHomeVisible, isHomeDataReady, markEventShown]);

    const handleDismiss = useCallback(() => {
        if (currentEvent) {
            markEventDismissed(currentEvent.id);
            setCurrentEvent(getNextEventToShow());
        }
    }, [currentEvent, markEventDismissed, getNextEventToShow]);

    const handleComplete = useCallback(() => {
        if (currentEvent) {
            markEventCompleted(currentEvent.id);
            setCurrentEvent(getNextEventToShow());
        }
    }, [currentEvent, markEventCompleted, getNextEventToShow]);

    // Don't render if home is not ready or no event
    if (!isHomeVisible || !isHomeDataReady || !currentEvent) {
        return null;
    }

    const EventComponent = currentEvent.component;

    return (
        <View style={styles.container}>
            <EventComponent
                eventId={currentEvent.id}
                onDismiss={handleDismiss}
                onComplete={handleComplete}
                data={currentEvent.data}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
});