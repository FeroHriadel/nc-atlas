import { Tag } from '../tags/tag.model';
import { SightImage } from '../../types/SightImage';
import { SightFactContent } from '../sights/sight-fact.model';

export interface TripItinerarySight {
    id: string;
    title: string;
    description: string;
    categoryName: string;
    latitude: number;
    longitude: number;
    country: string | null;
    state: string | null;
    county: string | null;
    tags: Tag[];
    images: SightImage[];
    facts: SightFactContent | null;
    thumbnailDataUri: string | null;
}

export interface TripRouteStop {
    sightId: string;
    note: string | null;
}

export interface TripRoute {
    summary: string | null;
    stops: TripRouteStop[];
}

export interface TripItinerary {
    title: string;
    note: string | null;
    sights: TripItinerarySight[];
    recommendedRoute: TripRoute | null;
    routeError: string | null;
}
