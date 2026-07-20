import { Tag } from "../tags/tag.model";
import { SightImage } from "../../types/SightImage";

export interface SightFilters {
    search?: string;
    categoryId?: number;
    tagId?: string;
    sortDirection?: 'asc' | 'desc';
}

export interface Sight {
    id: string;
    title: string;
    description: string;
    categoryId: number;
    categoryName: string;
    latitude: number;
    longitude: number;
    country: string | null;
    state: string | null;
    county: string | null;
    ratingAvg: number;
    ratingCount: number;
    source: string;
    createdAt: Date;
    tags: Tag[];
    images: SightImage[];
}

export interface SightRequest {
    title: string;
    description: string;
    categoryId: number;
    latitude: number;
    longitude: number;
    country?: string;
    state?: string;
    county?: string;
    source: string;
    tagIds: string[];
    imageUrls: string[];
}