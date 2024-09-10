const path = require('path');
const ExitOnCompletePlugin = require('./ExitOnCompletePlugin');

module.exports = {
    mode: "development",
    entry: "./src/index.ts",
    watch: false,
    output: {
        path: path.resolve(__dirname, 'build/client/build'),
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
                use: [
                    "file-loader",
                    {
                        loader: "image-webpack-loader",
                        options: {
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
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"]
            }
        ]
    },
    performance: {
        hints: false
    },
    devtool: "source-map",
    plugins: [
        new ExitOnCompletePlugin()
    ]
};