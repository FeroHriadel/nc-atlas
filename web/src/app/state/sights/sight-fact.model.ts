export interface SightFactItem {
    emoji: string;
    title: string;
    text: string;
}

export interface SightFactPerson {
    name: string;
    funFact: string;
}

export interface SightFactContent {
    title: string;
    funFacts: SightFactItem[];
    history: SightFactItem[];
    dontMiss: SightFactItem[];
    people: SightFactPerson[];
    historyContext: SightFactItem[];
}

export type SightFactJobStatus = 'Pending' | 'Processing' | 'Succeeded' | 'Failed';

export interface SightFactJob {
    id: string;
    sightId: string;
    status: SightFactJobStatus;
    result: SightFactContent | null;
    feedback: string | null;
    errorMessage: string | null;
    saved: boolean;
    createdAt: string;
    completedAt: string | null;
}
