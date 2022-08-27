import { MessageOptions } from "slash-create";

export function ErrorResponse(title: string, description: string): MessageOptions {
    return {
        embeds: [{
            author: {
                icon_url: "https://cdn.discordapp.com/emojis/439756811420172308.png",
                name: title
            },
            description: description,
            color: 0xFF0000
        }]
    };
}

export function OKResponse(title: string, description: string): MessageOptions {
    return {
        embeds: [{
            author: {
                icon_url: "https://cdn.discordapp.com/emojis/439756811113857025.png",
                name: title
            },
            description: description,
            color: 0x00FF00
        }]
    };
}