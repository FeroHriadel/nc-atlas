export interface SightJson {
    title: string;
    description: string;
    category: string;
    tags: string[];
    location: {
        country: string;
        state: string;
        county: string;
        coordinates: [number, number];
    };
    image350S3Key: string;
    image1024S3Key: string;
}


/*
    "title": "Kolárovice",
    "description": "A dispersed settlement village in a valley through which an international road passes, known for its wooden folk architecture. Near the parish church, visitors can see a gallery of large wooden saint figures created by folk woodcarver Milan Mičienka.",
    "category": "village",
    "tags": [
      "folk architecture",
      "woodcarving",
      "rural"
    ],
    "location": {
      "country": "Slovensko",
      "state": "Žilinský kraj",
      "county": "okres Bytča",
      "coordinates": [
        49.2752487,
        18.5323123
      ]
    },
    "image350S3Key": "enrichments/2026-06-18-javorniky-kysuce/kol-rovice/350.png",
    "image1024S3Key": "enrichments/2026-06-18-javorniky-kysuce/kol-rovice/1024.png"

*/