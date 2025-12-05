
export enum State {
  New = 0,
  Learning = 1,
  Review = 2,
  Relearning = 3
}

export enum Rating {
  Again = 1,
  Hard = 2,
  Good = 3,
  Easy = 4
}

export interface Field {
    id: string;
    name: string;
}

export type FontType = 'sans' | 'serif' | 'handwriting';

export interface FieldLayout {
    fieldId: string;
    isVisible: boolean;
    fontFamily: FontType;
    fontSize: number; // in pixels
    color: string;
    isBold: boolean;
}

export interface CardTemplate {
    id: string;
    name: string;
    fields: Field[];
    frontLayout: FieldLayout[];
    backLayout: FieldLayout[];
}

export interface ReviewLog {
    rating: Rating;
    state: State;
    due: Date; 
    elapsed_days: number;
    scheduled_days: number;
    review: Date; 
}

export interface Card {
    id: string;
    templateId: string;
    fieldValues: Record<string, string>; // Maps Field ID to its string value
    
    // FSRS Data
    due: Date;
    s: number; // Stability
    d: number; // Difficulty
    lapses: number;
    reps: number;
    state: State;
    last_review?: Date; // Added crucial property for FSRS calculation
    step_index?: number; // Tracks current learning step index
    review_logs: ReviewLog[];
    
    // Derived/Transient properties used by FSRS
    elapsed_days?: number;
    scheduled_days?: number;
}

export enum DeckPreset {
    Forgetful = 'Forgetful',
    EasyToRemember = 'EasyToRemember',
    Balanced = 'Balanced',
    ExamPrep = 'ExamPrep',
    Custom = 'Custom'
}

export interface Deck {
    id: string;
    name: string;
    description: string;
    cards: Card[];
    // Deck settings
    settings: {
        preset: DeckPreset;
        newCardsPerDay: number;
        reviewsPerDay: number;
        learningSteps: string; // e.g. "1m 10m 1d"
        relearningSteps: string; // e.g. "10m"
        fsrsParameters: {
            requestRetention: number;
            maximumInterval: number;
            w: number[]; // Array of weights
        };
        lastOptimized?: Date;
    };
}

export enum Page {
    Home,
    Settings,
    Study,
    CardLibrary,
    TemplateLibrary,
    Stats,
    Cram
}