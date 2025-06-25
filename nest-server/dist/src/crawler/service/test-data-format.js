const mockMovies = [
    {
        title: "测试电影1",
        quality: "HD",
        cast: ["演员1", "演员2", "演员3"],
        link: "/movie/1",
        poster: "/poster1.jpg",
        backdrop: "/backdrop1.jpg"
    },
    {
        title: "测试电影2",
        quality: "4K",
        cast: [],
        link: "/movie/2",
        poster: "/poster2.jpg",
        backdrop: "/backdrop2.jpg"
    },
    {
        title: "测试电影3",
        quality: "HD",
        cast: ["演员A", "", "演员C"],
        link: "/movie/3",
        poster: "/poster3.jpg",
        backdrop: "/backdrop3.jpg"
    }
];
function testDataCleaning() {
    console.log("=== 测试数据清理 ===");
    mockMovies.forEach((movie, index) => {
        console.log(`\n原始数据 ${index + 1}:`, JSON.stringify(movie.cast));
        const castArray = movie.cast && movie.cast.length > 0
            ? movie.cast.filter(actor => actor && actor.trim() !== '')
            : ['未知演员'];
        console.log(`清理后数据 ${index + 1}:`, JSON.stringify(castArray));
        console.log(`是否为数组:`, Array.isArray(castArray));
        console.log(`数组长度:`, castArray.length);
        console.log(`所有元素都是字符串:`, castArray.every(item => typeof item === 'string'));
    });
}
function testEntityCreation() {
    console.log("\n=== 测试实体创建 ===");
    const MediaType = { MOVIE: 'movie' };
    const MediaStatus = { RELEASED: 'released' };
    mockMovies.forEach((movie, index) => {
        const castArray = movie.cast && movie.cast.length > 0
            ? movie.cast.filter(actor => actor && actor.trim() !== '')
            : ['未知演员'];
        const entity = {
            title: movie.title,
            description: '暂无描述',
            poster: movie.poster,
            backdrop: movie.backdrop,
            rating: 7.5,
            year: 2023,
            genres: ['动作', '剧情'],
            type: MediaType.MOVIE,
            status: MediaStatus.RELEASED,
            cast: castArray,
            isImagesDownloaded: false,
            duration: 0,
            director: '',
            boxOffice: 0,
            views: 0,
            likes: 0,
            sourceUrl: movie.link,
        };
        console.log(`\n实体 ${index + 1}:`, JSON.stringify(entity, null, 2));
    });
}
testDataCleaning();
testEntityCreation();
console.log("\n=== 测试完成 ===");
//# sourceMappingURL=test-data-format.js.map