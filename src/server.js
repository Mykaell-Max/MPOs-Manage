const app = require('./api/api');
const PORT = global.env.PORT;

app.listen(PORT, () => {
  console.log(`Service running on port ${PORT}...`);
});