
const appConfig = {
    port : process.env.PORT,
    jwtSecretKey : process.env.JWT_SECRET,
    nodeEnv : process.env.NODE_ENV
}

export default appConfig;