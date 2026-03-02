export const BlockRegistry = {
    stone: {
        name: "Kamień (Stone)",
        textures: { all: "stone.png" }
    },
    cobblestone: {
        name: "Bruk (Cobblestone)",
        textures: { all: "cobblestone.png" }
    },
    dirt: {
        name: "Ziemia (Dirt)",
        textures: { all: "dirt.png" }
    },
    grass_block: {
        name: "Blok trawy (Grass)",
        textures: {
            top: "grass_block_top.png",
            bottom: "dirt.png",
            side: "grass_block_side.png",
            all: "grass_block_side.png" // Fallback fallback dla pojedynczego materiału
        }
    },
    sand: {
        name: "Piasek (Sand)",
        textures: { all: "sand.png" }
    },
    oak_planks: {
        name: "Deski dębowe",
        textures: { all: "oak_planks.png" }
    },
    spruce_planks: {
        name: "Deski świerkowe",
        textures: { all: "spruce_planks.png" }
    },
    birch_planks: {
        name: "Deski brzozowe",
        textures: { all: "birch_planks.png" }
    },
    bricks: {
        name: "Cegły (Bricks)",
        textures: { all: "bricks.png" }
    },
    stone_bricks: {
        name: "Kamienne cegły",
        textures: { all: "stone_bricks.png" }
    },
    deepslate: {
        name: "Łupek (Deepslate)",
        textures: { all: "deepslate.png" }
    },
    polished_andesite: {
        name: "Wypol. Andezyt",
        textures: { all: "polished_andesite.png" }
    },
    quartz_block: {
        name: "Blok kwarcu",
        textures: { all: "quartz_block.png" }
    },
    nether_bricks: {
        name: "Cegły z Netheru",
        textures: { all: "nether_bricks.png" }
    },
    obsidian: {
        name: "Obsydian",
        textures: { all: "obsidian.png" }
    },
    glass: {
        name: "Szkło (Glass)",
        textures: { all: "glass.png" },
        transparent: true
    }
};