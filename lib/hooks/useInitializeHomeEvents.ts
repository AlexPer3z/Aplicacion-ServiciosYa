// App.tsx or your initialization file
import React, { useEffect } from 'react';

import { EventPriority, useHomeEventsStore } from '../../store/homeEventsStore';
import HelpVideoModal from '../../components/HelpVideoModal';
import WelcomeModal from '../../components/home/WelcomeModal';
import { tr } from 'zod/v4/locales';

export function useInitializeHomeEvents() {
    const { registerEvents, incrementAppLaunch } = useHomeEventsStore();

    useEffect(() => {
        incrementAppLaunch();

        registerEvents([
            {
                id: 'welcome__video',
                component: HelpVideoModal,
                priority: EventPriority.CRITICAL,
                blockOnDismiss: false,
                blockOnComplete: true,
                data: {
                    videoSource: require("../../assets/video_2.mp4"),
                },
            },
            {
                id: 'select_choice',
                component: WelcomeModal,
                priority: EventPriority.MEDIUM,
                delayAfterPrevious: 5000,
                requiresPreviousEvents: ['welcome__video'],
                blockOnDismiss: false,
                blockOnComplete: true,
            },
        ]);
    }, []);
}