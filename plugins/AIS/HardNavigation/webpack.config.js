
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const SpriteLoaderPlugin = require('svg-sprite-loader/plugin');
// const HasJsPlugin = require('./webpack-hasjs-plugin.js');
const path = require('path');
const isProduction = true;

// switch(String(process.env.PRODUCTION).toLowerCase()) {case'undefined': case'false': case'no': case '0':isProduction = false;}
// const hasJs = new HasJsPlugin({
//             features: {
// 				PRODUCTION: isProduction
//             }
//         })

const fileName = isProduction ? 'HardNavigationPlugin' : 'HardNavigationPluginTest';

module.exports = {
    entry: './src/entry.js',
    mode: 'development',
    output: {
        path: path.join(__dirname, ''),
        filename: fileName + '.js'
    },
    devtool: 'source-map',
    module: {
        rules: [
            { test: /\.(js)$/i, exclude: /node_modules/, 
               // use: ['babel-loader'], 
               loader: 'babel-loader',
                options: {plugins: ["@babel/plugin-transform-template-literals"] }},
            //{ test: /\.css$/i, use: ['style-loader', 'css-loader'], },
            { test: /\.svg$/, use: [ 'svg-sprite-loader' ] },
            {
                test: /\.css$/,
                use: [
                  {
                    loader: MiniCssExtractPlugin.loader,
                    // options: {
                    //   // you can specify a publicPath here
                    //   // by default it uses publicPath in webpackOptions.output
                    //   publicPath: '../',
                    //   hmr: process.env.NODE_ENV === 'development',
                    // },
                  },
                  'css-loader',
                ],
              },
          ]//,
    },
    plugins: [
    // 	hasJs
        new MiniCssExtractPlugin({
            filename: fileName + '.css',//'[name].css',
            chunkFilename: '[id].css',
            ignoreOrder: false, // Enable to remove warnings about conflicting order
        }),
        new SpriteLoaderPlugin()
    ],
}
