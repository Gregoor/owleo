export default {
  port: process.env.PORT || 8080,
  dev: process.env.NODE_ENV === 'development',
  forceHTTPS: process.env.FORCE_HTTPS,
  pgURL: process.env.DATABASE_URL || 'postgres://user:pw@localhost:5432/owleo'
};
