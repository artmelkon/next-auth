/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    DB_URI: process.env.DB_URI,
    SECRET_KEY: process.env.SECRET_KEY,
  },
}

module.exports = nextConfig
