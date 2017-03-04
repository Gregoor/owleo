export default {
  port: process.env.PORT || 8080,
  dev: process.env.NODE_ENV == 'development',
  pgURL: process.env.DATABASE_URL || 'postgres://user:pw@localhost:5432/owleo'
};
