const ExtractTextPlugin = require('extract-text-webpack-plugin')
const path = require('path')
const HasJsPlugin = require('./webpack-hasjs-plugin.js');

const extractCSS = new ExtractTextPlugin('AISSearch2.css')
const hasJs = new HasJsPlugin({
            features: {
                NOSIDEBAR: false,
                SIDEBAR2: true,
				PRODUCTION: false
            }
        })

module.exports = {
    entry: './src/entry.js',
    output: {
        path: path.join(__dirname, ''),
        filename: 'AISSearch2.js'
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
