export enum MediaType {
    MOVIE = 'movie',
    TV = 'tv'
}

export interface Movie {
    id: string;
    title: string;
    description: string;
    poster: string;
    backdrop: string;
    year: number;
    rating: number;
    genres: string[];
    type: MediaType;
    status: string;
    duration: number;
    director: string;
    cast: string[];
    boxOffice: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface TVShow {
    id: string;
    title: string;
    description: string;
    poster: string;
    backdrop: string;
    year: number;
    rating: number;
    genres: string[];
    type: MediaType;
    status: string;
    seasons: number;
    episodes: number;
    creator: string;
    cast: string[];
    network: string;
    createdAt: Date;
    updatedAt: Date;
}

export type MediaItem = Movie | TVShow;

// Mock电影数据
export const mockMovies: Movie[] = [
    {
        id: "1",
        title: "阿凡达：水之道",
        description: "杰克·萨利与奈蒂莉组建了家庭，他们的孩子也逐渐成长。然而某一天，有个部族的兄弟遭到了天空人的残酷杀害。",
        poster: "https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
        backdrop: "https://image.tmdb.org/t/p/w1280/s16H6tpK2utvwDtzZ8Qy4qm5Emw.jpg",
        year: 2022,
        rating: 8.1,
        genres: ["科幻", "动作", "冒险"],
        type: MediaType.MOVIE,
        status: "released",
        duration: 192,
        director: "詹姆斯·卡梅隆",
        cast: ["萨姆·沃辛顿", "佐伊·索尔达娜", "西格妮·韦弗"],
        boxOffice: 2320000000,
        createdAt: new Date("2022-12-16"),
        updatedAt: new Date("2022-12-16"),
    },
    {
        id: "2",
        title: "黑豹：瓦坎达万岁",
        description: "瓦坎达王国正努力保护自己的国家不受世界强国的干预。",
        poster: "https://image.tmdb.org/t/p/w500/sv1xJUazXeYqALzczSZ3O6nkH75.jpg",
        backdrop: "https://image.tmdb.org/t/p/w1280/yYrvN5WFeGYjJnRzhY0QXuo4Isw.jpg",
        year: 2022,
        rating: 7.3,
        genres: ["动作", "冒险", "科幻"],
        type: MediaType.MOVIE,
        status: "released",
        duration: 161,
        director: "瑞恩·库格勒",
        cast: ["莱蒂希娅·赖特", "安吉拉·贝塞特", "丹娜·奎里拉"],
        boxOffice: 859000000,
        createdAt: new Date("2022-11-11"),
        updatedAt: new Date("2022-11-11"),
    },
    {
        id: "3",
        title: "壮志凌云：独行侠",
        description: "经过三十多年的服役，皮特·米切尔仍然是一名顶尖的飞行员。",
        poster: "https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
        backdrop: "https://image.tmdb.org/t/p/w1280/odJ4hx6g6vBt4lBWKFD1tI8WS4x.jpg",
        year: 2022,
        rating: 8.5,
        genres: ["动作", "剧情"],
        type: MediaType.MOVIE,
        status: "released",
        duration: 130,
        director: "约瑟夫·科辛斯基",
        cast: ["汤姆·克鲁斯", "迈尔斯·特勒", "詹妮弗·康纳利"],
        boxOffice: 1488000000,
        createdAt: new Date("2022-05-27"),
        updatedAt: new Date("2022-05-27"),
    },
    {
        id: "4",
        title: "奇异博士2：疯狂多元宇宙",
        description: "奇异博士在无限战争中展望了1400万个可能的未来，只有一个能战胜灭霸。",
        poster: "https://image.tmdb.org/t/p/w500/9Gtg2DzBhmYamXBS1hKAhiwbBKS.jpg",
        backdrop: "https://image.tmdb.org/t/p/w1280/wcKFYIiVDvRURrzglV9kGu7fpfY.jpg",
        year: 2022,
        rating: 7.0,
        genres: ["动作", "奇幻", "科幻"],
        type: MediaType.MOVIE,
        status: "released",
        duration: 126,
        director: "山姆·雷米",
        cast: ["本尼迪克特·康伯巴奇", "伊丽莎白·奥尔森", "雷切尔·麦克亚当斯"],
        boxOffice: 956000000,
        createdAt: new Date("2022-05-06"),
        updatedAt: new Date("2022-05-06"),
    },
    {
        id: "5",
        title: "雷神4：爱与雷霆",
        description: "雷神踏上了一次前所未有的旅程：寻找内心的平静。",
        poster: "https://image.tmdb.org/t/p/w500/pIkRyD18kl4FhoCNQuWxWu5cBLM.jpg",
        backdrop: "https://image.tmdb.org/t/p/w1280/p1F51Lvj3sMopG948F5HsBbl43C.jpg",
        year: 2022,
        rating: 6.8,
        genres: ["动作", "冒险", "喜剧"],
        type: MediaType.MOVIE,
        status: "released",
        duration: 119,
        director: "塔伊加·维迪提",
        cast: ["克里斯·海姆斯沃斯", "娜塔莉·波特曼", "克里斯蒂安·贝尔"],
        boxOffice: 760000000,
        createdAt: new Date("2022-07-08"),
        updatedAt: new Date("2022-07-08"),
    },
    {
        id: "6",
        title: "蜘蛛侠：纵横宇宙",
        description: "迈尔斯·莫拉莱斯重新投入到蜘蛛侠的身份中，但被大批蜘蛛侠追杀。",
        poster: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
        backdrop: "https://image.tmdb.org/t/p/w1280/nGxUxi3PfXDRm7Vg95VBNgNM8yc.jpg",
        year: 2023,
        rating: 8.7,
        genres: ["动画", "动作", "冒险"],
        type: MediaType.MOVIE,
        status: "released",
        duration: 140,
        director: "华金·多斯·桑托斯",
        cast: ["沙美克·摩尔", "海莉·斯坦菲尔德", "布莱恩·泰瑞·亨利"],
        boxOffice: 690000000,
        createdAt: new Date("2023-06-02"),
        updatedAt: new Date("2023-06-02"),
    }
];

// Mock电视剧数据
export const mockTVShows: TVShow[] = [
    {
        id: "7",
        title: "权力的游戏",
        description: "一个史诗般的奇幻剧集，讲述了七个王国争夺铁王座的故事。",
        poster: "https://image.tmdb.org/t/p/w500/7WUHnWGx5OO145IRxPDUkQSh4C7.jpg",
        backdrop: "https://image.tmdb.org/t/p/w1280/suopoADq0k8YHr9VB6eatO7LRM3.jpg",
        year: 2011,
        rating: 9.2,
        genres: ["剧情", "奇幻", "冒险"],
        type: MediaType.TV,
        status: "released",
        seasons: 8,
        episodes: 73,
        creator: "戴维·贝尼奥夫",
        cast: ["彼特·丁拉基", "艾米莉亚·克拉克", "基特·哈林顿"],
        network: "HBO",
        createdAt: new Date("2011-04-17"),
        updatedAt: new Date("2019-05-19"),
    },
    {
        id: "8",
        title: "怪奇物语",
        description: "一群孩子在他们的小镇上发现了超自然的秘密和政府阴谋。",
        poster: "https://image.tmdb.org/t/p/w500/x2LSRK2Cm7MZhjluni1msVJ3wDF.jpg",
        backdrop: "https://image.tmdb.org/t/p/w1280/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
        year: 2016,
        rating: 8.7,
        genres: ["剧情", "奇幻", "科幻"],
        type: MediaType.TV,
        status: "released",
        seasons: 4,
        episodes: 34,
        creator: "达弗兄弟",
        cast: ["米莉·博比·布朗", "芬恩·沃夫哈德", "盖顿·马塔拉佐"],
        network: "Netflix",
        createdAt: new Date("2016-07-15"),
        updatedAt: new Date("2022-07-01"),
    },
    {
        id: "9",
        title: "绝命毒师",
        description: "一个高中化学老师在被诊断出患有肺癌后开始制造毒品。",
        poster: "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
        backdrop: "https://image.tmdb.org/t/p/w1280/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
        year: 2008,
        rating: 9.4,
        genres: ["剧情", "犯罪", "惊悚"],
        type: MediaType.TV,
        status: "released",
        seasons: 5,
        episodes: 62,
        creator: "文斯·吉利根",
        cast: ["布莱恩·克兰斯顿", "亚伦·保尔", "安娜·冈"],
        network: "AMC",
        createdAt: new Date("2008-01-20"),
        updatedAt: new Date("2013-09-29"),
    },
    {
        id: "10",
        title: "曼达洛人",
        description: "在银河帝国沦陷后，一个孤独的赏金猎人在银河系外围执行任务。",
        poster: "https://image.tmdb.org/t/p/w500/sWgBv7LV2PRoQgkxwlibdGXKz1S.jpg",
        backdrop: "https://image.tmdb.org/t/p/w1280/9ijMGlJKqcslswWUzTEwScm82Gs.jpg",
        year: 2019,
        rating: 8.6,
        genres: ["科幻", "冒险", "动作"],
        type: MediaType.TV,
        status: "ongoing",
        seasons: 3,
        episodes: 24,
        creator: "乔恩·费儒",
        cast: ["佩德罗·帕斯卡", "吉娜·卡拉诺", "卡尔·韦瑟斯"],
        network: "Disney+",
        createdAt: new Date("2019-11-12"),
        updatedAt: new Date("2023-04-19"),
    },
    {
        id: "11",
        title: "鱿鱼游戏",
        description: "数百名债务缠身的人接受邀请参加儿童游戏，获胜者将赢得巨额奖金。",
        poster: "https://image.tmdb.org/t/p/w500/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg",
        backdrop: "https://image.tmdb.org/t/p/w1280/qw3J9cNeLioOLoR68WX7z79aCdK.jpg",
        year: 2021,
        rating: 8.0,
        genres: ["剧情", "惊悚", "悬疑"],
        type: MediaType.TV,
        status: "ongoing",
        seasons: 1,
        episodes: 9,
        creator: "黄东赫",
        cast: ["李政宰", "朴海秀", "魏嘏隽"],
        network: "Netflix",
        createdAt: new Date("2021-09-17"),
        updatedAt: new Date("2021-09-17"),
    },
    {
        id: "12",
        title: "瑞克和莫蒂",
        description: "一个疯狂科学家和他14岁外孙的跨维度冒险。",
        poster: "https://image.tmdb.org/t/p/w500/cvhNj9eoRBe5SxjCbQTkh05UP5K.jpg",
        backdrop: "https://image.tmdb.org/t/p/w1280/eV3XnUul4UfIivz3kxgeqOUjqLx.jpg",
        year: 2013,
        rating: 9.1,
        genres: ["动画", "喜剧", "科幻"],
        type: MediaType.TV,
        status: "ongoing",
        seasons: 7,
        episodes: 71,
        creator: "丹·哈萌",
        cast: ["贾斯汀·罗兰", "克里斯·帕内尔", "斯宾瑟·格拉默"],
        network: "Adult Swim",
        createdAt: new Date("2013-12-02"),
        updatedAt: new Date("2023-10-15"),
    }
]; 