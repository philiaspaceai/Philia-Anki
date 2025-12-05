
import { Deck, CardTemplate, DeckPreset, FieldLayout, State } from './types';
import { State as FsrsState } from './types'; // Source of truth import

const defaultFsrsParameters = {
    requestRetention: 0.9,
    maximumInterval: 36500,
    // FSRS-6 Standard Weights (21 parameters)
    // Ref: https://github.com/open-spaced-repetition/fsrs-rs
    // Ref: https://github.com/open-spaced-repetition/ts-fsrs
    w: [
        0.212, 1.2931, 2.3065, 8.2956,  // Initial Stability (0-3)
        6.4133, 0.8334,                 // Initial Difficulty (4-5)
        3.0194, 0.001,                  // Difficulty Transition (6-7)
        1.8722, 0.1666, 0.796,          // Stability Recall (8-10)
        1.4835, 0.0614, 0.2629, 1.6483, // Stability Forget (11-14)
        0.6014, 1.8729,                 // Hard/Easy Factors (15-16)
        0.5425, 0.0912, 0.0658,         // Short Term (17-19)
        0.1542                          // Decay (20)
    ],
};

export const PRESET_CONFIGS = {
    [DeckPreset.Forgetful]: {
        learningSteps: "1m 5m 20m",
        relearningSteps: "5m 20m",
        fsrsParameters: { ...defaultFsrsParameters, requestRetention: 0.92 },
    },
    [DeckPreset.EasyToRemember]: {
        learningSteps: "10m 1d",
        relearningSteps: "10m",
        fsrsParameters: { ...defaultFsrsParameters, requestRetention: 0.85 },
    },
    [DeckPreset.Balanced]: {
        learningSteps: "1m 10m",
        relearningSteps: "10m",
        fsrsParameters: { ...defaultFsrsParameters, requestRetention: 0.9 },
    },
    [DeckPreset.ExamPrep]: {
        learningSteps: "1m 10m 30m 1h 3h 12h",
        relearningSteps: "1m 10m",
        fsrsParameters: { ...defaultFsrsParameters, requestRetention: 0.93, maximumInterval: 30 },
    },
};


const defaultSettings = {
    preset: DeckPreset.Balanced,
    newCardsPerDay: 20,
    reviewsPerDay: 200,
    ...PRESET_CONFIGS[DeckPreset.Balanced]
};

const initialFsrsData = {
    due: new Date(),
    s: 0,
    d: 0,
    lapses: 0,
    reps: 0,
    state: FsrsState.New,
    last_review: undefined,
    review_logs: [],
};

const createDefaultLayout = (fieldId: string, isVisible: boolean, size: number = 24, color: string = '#ffffff', bold: boolean = false): FieldLayout => ({
    fieldId,
    isVisible,
    fontFamily: 'sans',
    fontSize: size,
    color,
    isBold: bold
});

export const MOCK_TEMPLATES: CardTemplate[] = [
    {
        id: 'template-basic',
        name: 'Basic (Question/Answer)',
        fields: [
            { id: 'field-q', name: 'Question' },
            { id: 'field-a', name: 'Answer' },
        ],
        frontLayout: [
            createDefaultLayout('field-q', true, 30, '#ffffff', true),
            createDefaultLayout('field-a', false)
        ],
        backLayout: [
            createDefaultLayout('field-q', false),
            createDefaultLayout('field-a', true, 24, '#e5e7eb')
        ]
    },
    {
        id: 'template-vocab',
        name: 'Vocabulary (Word/Reading/Meaning)',
        fields: [
            { id: 'field-word', name: 'Word' },
            { id: 'field-reading', name: 'Reading' },
            { id: 'field-meaning', name: 'Meaning' },
        ],
        frontLayout: [
            createDefaultLayout('field-word', true, 36, '#22d3ee', true),
            createDefaultLayout('field-reading', false),
            createDefaultLayout('field-meaning', false)
        ],
        backLayout: [
            createDefaultLayout('field-word', true, 20, '#9ca3af', false),
            createDefaultLayout('field-reading', true, 24, '#ffffff', false),
            createDefaultLayout('field-meaning', true, 28, '#ffffff', true)
        ]
    }
];

export const MOCK_DECKS: Deck[] = [
    {
        id: 'sample-deck',
        name: 'Sample Deck',
        description: 'A multilingual vocabulary deck containing German, Korean, and Japanese words.',
        settings: { ...defaultSettings },
        cards: [
            // --- GERMAN (10 Cards) ---
            { 
                id: 'ger-1', templateId: 'template-vocab', ...initialFsrsData,
                fieldValues: { 'field-word': 'Hallo', 'field-reading': 'Interjection', 'field-meaning': 'Hello' } 
            },
            { 
                id: 'ger-2', templateId: 'template-vocab', ...initialFsrsData,
                fieldValues: { 'field-word': 'Danke', 'field-reading': 'Interjection', 'field-meaning': 'Thank you' } 
            },
            { 
                id: 'ger-3', templateId: 'template-vocab', ...initialFsrsData,
                fieldValues: { 'field-word': 'Wasser', 'field-reading': 'das', 'field-meaning': 'Water' } 
            },
            { 
                id: 'ger-4', templateId: 'template-vocab', ...initialFsrsData,
                fieldValues: { 'field-word': 'Apfel', 'field-reading': 'der', 'field-meaning': 'Apple' } 
            },
            { 
                id: 'ger-5', templateId: 'template-vocab', ...initialFsrsData,
                fieldValues: { 'field-word': 'Buch', 'field-reading': 'das', 'field-meaning': 'Book' } 
            },
            { 
                id: 'ger-6', templateId: 'template-vocab', ...initialFsrsData,
                fieldValues: { 'field-word': 'Katze', 'field-reading': 'die', 'field-meaning': 'Cat' } 
            },
            { 
                id: 'ger-7', templateId: 'template-vocab', ...initialFsrsData,
                fieldValues: { 'field-word': 'Hund', 'field-reading': 'der', 'field-meaning': 'Dog' } 
            },
            { 
                id: 'ger-8', templateId: 'template-vocab', ...initialFsrsData,
                fieldValues: { 'field-word': 'Haus', 'field-reading': 'das', 'field-meaning': 'House' } 
            },
            { 
                id: 'ger-9', templateId: 'template-vocab', ...initialFsrsData,
                fieldValues: { 'field-word': 'Auto', 'field-reading': 'das', 'field-meaning': 'Car' } 
            },
            { 
                id: 'ger-10', templateId: 'template-vocab', ...initialFsrsData,
                fieldValues: { 'field-word': 'Brot', 'field-reading': 'das', 'field-meaning': 'Bread' } 
            },

            // --- KOREAN (10 Cards) ---
            { 
                id: 'kor-1', templateId: 'template-vocab', ...initialFsrsData,
                fieldValues: { 'field-word': '안녕하세요', 'field-reading': 'Annyeonghaseyo', 'field-meaning': 'Hello' } 
            },
            { 
                id: 'kor-2', templateId: 'template-vocab', ...initialFsrsData,
                fieldValues: { 'field-word': '감사합니다', 'field-reading': 'Gamsahamnida', 'field-meaning': 'Thank you' } 
            },
            { 
                id: 'kor-3', templateId: 'template-vocab', ...initialFsrsData,
                fieldValues: { 'field-word': '물', 'field-reading': 'Mul', 'field-meaning': 'Water' } 
            },
            { 
                id: 'kor-4', templateId: 'template-vocab', ...initialFsrsData,
                fieldValues: { 'field-word': '사과', 'field-reading': 'Sagwa', 'field-meaning': 'Apple' } 
            },
            { 
                id: 'kor-5', templateId: 'template-vocab', ...initialFsrsData,
                fieldValues: { 'field-word': '책', 'field-reading': 'Chaek', 'field-meaning': 'Book' } 
            },
            { 
                id: 'kor-6', templateId: 'template-vocab', ...initialFsrsData,
                fieldValues: { 'field-word': '고양이', 'field-reading': 'Goyangi', 'field-meaning': 'Cat' } 
            },
            { 
                id: 'kor-7', templateId: 'template-vocab', ...initialFsrsData,
                fieldValues: { 'field-word': '개', 'field-reading': 'Gae', 'field-meaning': 'Dog' } 
            },
            { 
                id: 'kor-8', templateId: 'template-vocab', ...initialFsrsData,
                fieldValues: { 'field-word': '집', 'field-reading': 'Jip', 'field-meaning': 'House' } 
            },
            { 
                id: 'kor-9', templateId: 'template-vocab', ...initialFsrsData,
                fieldValues: { 'field-word': '차', 'field-reading': 'Cha', 'field-meaning': 'Car' } 
            },
            { 
                id: 'kor-10', templateId: 'template-vocab', ...initialFsrsData,
                fieldValues: { 'field-word': '빵', 'field-reading': 'Ppang', 'field-meaning': 'Bread' } 
            },

            // --- JAPANESE (10 Cards) ---
            { 
                id: 'jpn-1', templateId: 'template-vocab', ...initialFsrsData,
                fieldValues: { 'field-word': 'こんにちは', 'field-reading': 'Konnichiwa', 'field-meaning': 'Hello' } 
            },
            { 
                id: 'jpn-2', templateId: 'template-vocab', ...initialFsrsData,
                fieldValues: { 'field-word': 'ありがとう', 'field-reading': 'Arigatou', 'field-meaning': 'Thank you' } 
            },
            { 
                id: 'jpn-3', templateId: 'template-vocab', ...initialFsrsData,
                fieldValues: { 'field-word': '水', 'field-reading': 'Mizu', 'field-meaning': 'Water' } 
            },
            { 
                id: 'jpn-4', templateId: 'template-vocab', ...initialFsrsData,
                fieldValues: { 'field-word': '林檎', 'field-reading': 'Ringo', 'field-meaning': 'Apple' } 
            },
            { 
                id: 'jpn-5', templateId: 'template-vocab', ...initialFsrsData,
                fieldValues: { 'field-word': '本', 'field-reading': 'Hon', 'field-meaning': 'Book' } 
            },
            { 
                id: 'jpn-6', templateId: 'template-vocab', ...initialFsrsData,
                fieldValues: { 'field-word': '猫', 'field-reading': 'Neko', 'field-meaning': 'Cat' } 
            },
            { 
                id: 'jpn-7', templateId: 'template-vocab', ...initialFsrsData,
                fieldValues: { 'field-word': '犬', 'field-reading': 'Inu', 'field-meaning': 'Dog' } 
            },
            { 
                id: 'jpn-8', templateId: 'template-vocab', ...initialFsrsData,
                fieldValues: { 'field-word': '家', 'field-reading': 'Ie', 'field-meaning': 'House' } 
            },
            { 
                id: 'jpn-9', templateId: 'template-vocab', ...initialFsrsData,
                fieldValues: { 'field-word': '車', 'field-reading': 'Kuruma', 'field-meaning': 'Car' } 
            },
            { 
                id: 'jpn-10', templateId: 'template-vocab', ...initialFsrsData,
                fieldValues: { 'field-word': 'パン', 'field-reading': 'Pan', 'field-meaning': 'Bread' } 
            },
        ],
    },
];
