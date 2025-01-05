import { client } from "./configs";
import jwt = require("jsonwebtoken");

// Function to verify token
function getKey(header, callback) {
  console.log("Header:", header);

  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      console.log("Error getting signing key:", err); 
      return callback(err);
    }
    const signingKey = key.getPublicKey();
    console.log("Signing key:", signingKey);
    callback(null, signingKey);
  });
}

export function verifyToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
      if (err) {
        reject(`Token verification failed: ${err.message}`);
      } else {
        resolve(decoded); // token is valid
      }
    });
  });
}