/**
* @package   Social Magazine
* @author    Arnaldo Baumanis
* @copyright 2019
* @license   This project is licensed under the MIT License
*/

const dotenv = require('dotenv');
dotenv.config();
const mongodb = require('mongodb');

mongodb.connect(process.env.CONNECTIONSTRING, { useNewUrlParser: true, useUnifiedTopology: true }, function (err, client) {
  module.exports = client;

  const app = require('./app');
  // app.listen(3000);
  app.listen(process.env.PORT, () => {
    console.log(`Listening on port 3000`);
  });
});