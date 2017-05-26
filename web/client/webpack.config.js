module.exports = {
    entry: "./src/index.ts",
    output: {
        path: `${__dirname}/build`,
        filename: "build.js",
        publicPath: "build/"
    },
    resolve: {
        extensions: [".ts", ".js"],
        alias: {
            "vue$": "vue/dist/vue.esm.js"
        }
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules|vue\/src/,
                loader: "ts-loader",
                options: {
                    appendTsSuffixTo: [/\.vue$/]
                }
            },
            {
                test: /\.vue$/,
                loader: "vue-loader",
                options: {
                    esModule: true,

                }
            },
            {
                test: /\.(jpe?g|png|gif|svg)$/i,
                loaders: [
                    "file-loader",
                    {
                        loader: "image-webpack-loader",
                        query: {
                            mozjpeg: {
                                progressive: true,
                                quality: 50
                            },
                            gifsicle: {
                                interlaced: false
                            },
                            optipng: {
                                optimizationLevel: 7
                            },
                            pngquant: {
                                quality: '75-90',
                                speed: 3
                            }
                        }
                    }
                ]
            }
        ]
    },
    performance: {
        hints: false
    },
    devtool: "source-map"
};
