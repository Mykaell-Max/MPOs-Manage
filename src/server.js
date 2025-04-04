const app = require('./app');
const PORT = global.env.PORT;

app.listen(PORT, () => {
  console.log(`Service running on port ${PORT}...`);
});