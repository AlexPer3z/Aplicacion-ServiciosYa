import { useState } from 'react';
import { Alert } from 'react-native';

type OnboardingQuestion = {
    id: string;
    title: string;
    description: string;
    onYes: () => Promise<void>;
    onNo: () => Promise<void>;
};

const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
    {
        id: 'useBiometric',
        title: 'Acceso biométrico',
        description: '¿Deseas habilitar el inicio biométrico?',
        onYes: async () => {
            console.log('Inicio de sesión biométrico habilitado.');
        },
        onNo: async () => {
            console.log('El usuario rechazó el inicio de sesión biométrico.');
        },
    },
];

export function useOnboarding(questions: OnboardingQuestion[] = ONBOARDING_QUESTIONS) {
    const [isLoading, setIsLoading] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [results, setResults] = useState<Record<string, boolean>>({});

    const startOnboarding = async (onFinish?: (results: Record<string, boolean>) => void) => {
        setIsLoading(true);
        setIsFinished(false);
        const newResults: Record<string, boolean> = {};

        for (const question of questions) {
            try {
                const answer = await new Promise<'yes' | 'no'>((resolve) => {
                    Alert.alert(
                        question.title,
                        question.description,
                        [
                            { text: 'No', style: 'cancel', onPress: () => resolve('no') },
                            { text: 'Si', onPress: () => resolve('yes') },
                        ],
                        { cancelable: false }
                    );
                });

                if (answer === 'yes') {
                    await question.onYes();
                    newResults[question.id] = true;
                } else {
                    await question.onNo();
                    newResults[question.id] = false;
                }
            } catch (error) {
                console.error(`Error processing answer for ${question.id}:`, error);
            }
        }

        setResults(newResults);

        try {
            if (onFinish) onFinish(newResults);
        } catch (error) {
            console.error('Failed to update onboarding status:', error);
        } finally {
            setIsLoading(false);
            setIsFinished(true);
        }
    };

    return { startOnboarding, isLoading, isFinished, results };
}