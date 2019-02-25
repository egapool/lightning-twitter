require('dotenv').config();
const config = require('config');
var fs = require('fs');
var grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const packageDefinition = protoLoader.loadSync(
  "rpc.proto",
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
   }
)

process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA'

// Lnd admin macaroon is at ~/.lnd/data/chain/bitcoin/simnet/admin.macaroon on Linux and
// ~/Library/Application Support/Lnd/data/chain/bitcoin/simnet/admin.macaroon on Mac
// var m = fs.readFileSync(LND_DIR + '/data/chain/bitcoin/regtest/admin.macaroon');
var m = fs.readFileSync(config.get("lnd.macaroon"));
var macaroon = m.toString('hex');

// build meta data credentials
var metadata = new grpc.Metadata()
metadata.add('macaroon', macaroon)
var macaroonCreds = grpc.credentials.createFromMetadataGenerator((_args, callback) => {
  callback(null, metadata);
});

// build ssl credentials using the cert the same as before
var lndCert = fs.readFileSync(config.get("lnd.tlscert"));
var sslCreds = grpc.credentials.createSsl(lndCert);

// combine the cert credentials and the macaroon auth credentials
// such that every call is properly encrypted and authenticated
var credentials = grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);

// Pass the crendentials when creating a channel
// var lnrpcDescriptor = grpc.load("rpc.proto");
var lnrpcDescriptor = grpc.loadPackageDefinition(packageDefinition);
var lnrpc = lnrpcDescriptor.lnrpc;
const client = new lnrpc.Lightning(config.get("lnd.rpchost"), credentials);

exports.client = client