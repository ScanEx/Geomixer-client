
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const SpriteLoaderPlugin = require('svg-sprite-loader/plugin');
const path = require('path');
const isProduction = true;

const fileName = isProduction ? 'TrackExportPlugin' : 'TrackExportPluginTest';

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
            { test: /\.(js)$/i, exclude: /node_modules/, use: ['babel-loader'] },
            { test: /\.svg$/, use: [ 'svg-sprite-loader' ] },
            {
                test: /\.css$/,
                use: [
                  {
                    loader: MiniCssExtractPlugin.loader,
                  },
                  'css-loader',
                ],
              },
          ]//,
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: fileName + '.css',
            chunkFilename: '[id].css',
            ignoreOrder: false, // Enable to remove warnings about conflicting order
        }),
        new SpriteLoaderPlugin()
    ],
}
