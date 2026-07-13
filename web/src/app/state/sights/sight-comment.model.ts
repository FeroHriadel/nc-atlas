export interface SightComment {
    id: string;
    text: string;
    imageUrl: string | null;
    username: string;
    createdAt: string;
    sightId: string;
    sightTitle: string;
}
