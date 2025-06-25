interface MovieData {
    title: string;
    quality: string;
    cast: string[];
    link: string;
    poster: string;
    backdrop: string;
}
declare const mockMovies: MovieData[];
declare function testDataCleaning(): void;
declare function testEntityCreation(): void;
