import { Tag } from "../tags/tag.model";
import { SightImage } from "../../types/SightImage";

export interface Sight {
    id: string;
    title: string;
    description: string;
    categoryId: number;
    categoryName: string;
    latitude: number;
    longitude: number;
    ratingAvg: number;
    ratingCount: number;
    source: string;
    createdAt: Date;
    tags: Tag[];
    images: SightImage[];
}