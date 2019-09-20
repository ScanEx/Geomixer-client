const ExtractTextPlugin = require('extract-text-webpack-plugin')
const path = require('path')


const fileName = 'IceDriftPlugin';
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
		//hasJs
    ],
    devtool: 'source-map'
}
