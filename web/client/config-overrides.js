module.exports = function override (config, env) {
    console.log('override...')
    let loaders = config.resolve
    loaders.fallback = {
        "fs": false,
        "http": require.resolve("stream-http"),
        "zlib": require.resolve("browserify-zlib") ,
        "path": require.resolve("path-browserify"),
        "crypto": require.resolve("crypto-browserify")
    }
    
    return config
}