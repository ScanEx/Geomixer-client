const ExtractTextPlugin = require('extract-text-webpack-plugin')
const path = require('path')
const HasJsPlugin = require('./webpack-hasjs-plugin.js');
let isProduction = true,
    isBeta = true;
switch(String(process.env.PRODUCTION).toLowerCase()) {case'undefined': case'false': case'no': case '0':isProduction = false;}
switch(String(process.env.BETA).toLowerCase()) {case'undefined': case'false': case'no': case '0':isBeta = false;}
const hasJs = new HasJsPlugin({
            features: {
                NOSIDEBAR: false,
                SIDEBAR2: true,
				PRODUCTION: isProduction,
				BETA: isBeta
            }
        })

const fileName = 'AISVesselCard';//isProduction ? (isBeta ? 'AISPluginBeta' : 'AISPlugin') : 'AISSearch2Test';
const extractCSS = new ExtractTextPlugin(fileName + '.css');

module.exports = {
    entry: './src/entry.js',
    output: {
        path: path.join(__dirname, ''),
        filename: fileName + '.js'
    },
    module: {
        loaders: [
            { test: /\.js$/, loader: 'babel-loader', query: { presets: ['es2015'] } },
            { test: /\.css$/, loader: extractCSS.extract(['css']) },
            { test: /\.styl$/, loader: extractCSS.extract(['css', 'stylus']) }
        ]
    },
    plugins: [
        extractCSS,
		hasJs
    ],
    devtool: 'source-map'
}
