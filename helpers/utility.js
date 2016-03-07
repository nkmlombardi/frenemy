module.exports = {

    /*
        Generate globally unique identifier
     */
    guid: function() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + '-' + s4() + '-' + s4() + '-' + s4();
    },

    // These are all the CSS colors. We will use them for player names!
    colors:  [
            "AliceBlue", "AntiqueWhite", "Aqua", "Aquamarine",
            "Azure", "Beige", "Bisque", "Black",
            "BlanchedAlmond", "Blue", "BlueViolet", "Brown",
            "BurlyWood", "CadetBlue", "Chartreuse", "Chocolate",
            "Coral", "CornflowerBlue", "Cornsilk", "Crimson",
            "Cyan", "DarkBlue", "DarkCyan", "DarkGoldenRod",
            "DarkGray", "DarkGrey", "DarkGreen", "DarkKhaki",
            "DarkMagenta", "DarkOliveGreen", "Darkorange", "DarkOrchid",
            "DarkRed", "DarkSalmon", "DarkSeaGreen", "DarkSlateBlue",
            "DarkSlateGray", "DarkSlateGrey", "DarkTurquoise", "DarkViolet",
            "DeepPink", "DeepSkyBlue", "DimGray", "DimGrey",
            "DodgerBlue", "FireBrick", "FloralWhite", "ForestGreen",
            "Fuchsia", "Gainsboro", "GhostWhite", "Gold",
            "GoldenRod", "Gray", "Grey", "Green",
            "GreenYellow", "HoneyDew", "HotPink", "IndianRed",
            "Indigo", "Ivory", "Khaki", "Lavender",
            "LavenderBlush", "LawnGreen", "LemonChiffon", "LightBlue",
            "LightCoral", "LightCyan", "LightGoldenRodYellow", "LightGray",
            "LightGrey", "LightGreen", "LightPink", "LightSalmon",
            "LightSeaGreen", "LightSkyBlue", "LightSlateGray", "LightSlateGrey",
            "LightSteelBlue", "LightYellow", "Lime", "LimeGreen",
            "Linen", "Magenta", "Maroon", "MediumAquaMarine",
            "MediumBlue", "MediumOrchid", "MediumPurple", "MediumSeaGreen",
            "MediumSlateBlue", "MediumSpringGreen", "MediumTurquoise", "MediumVioletRed",
            "MidnightBlue", "MintCream", "MistyRose", "Moccasin",
            "NavajoWhite", "Navy", "OldLace", "Olive",
            "OliveDrab", "Orange", "OrangeRed", "Orchid",
            "PaleGoldenRod", "PaleGreen", "PaleTurquoise", "PaleVioletRed",
            "PapayaWhip", "PeachPuff", "Peru", "Pink",
            "Plum", "PowderBlue", "Purple", "Red",
            "RosyBrown", "RoyalBlue", "SaddleBrown", "Salmon",
            "SandyBrown", "SeaGreen", "SeaShell", "Sienna",
            "Silver", "SkyBlue", "SlateBlue", "SlateGray",
            "SlateGrey", "Snow", "SpringGreen", "SteelBlue",
            "Tan", "Teal", "Thistle", "Tomato",
            "Turquoise", "Violet", "Wheat", "White",
            "WhiteSmoke", "Yellow", "YellowGreen"
    ],
    getColor: function() {
        // Slice the color out to prevent duplicate names
        var ri = Math.floor(Math.random() * this.colors.length);
        var rs = this.colors.splice(ri, 1);

        // Splice returns an array
        return rs[0];
    }
};
