const ExtractTextPlugin = require('extract-text-webpack-plugin')
const path = require('path')
//var webpack = require('webpack');

const extractCSS = new ExtractTextPlugin('AISSearch2.css')

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
        extractCSS
    ],
    devtool: 'source-map'
}
