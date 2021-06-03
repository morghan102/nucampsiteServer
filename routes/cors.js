const cors = require('cors');

const whitelist = ['http://localhost:3000', 'https://localhost:3443'];
const corsOptionsDelegate = (req, callback) => {
    let corsOptions;
    console.log(req.header('Origin'));
    if(whitelist.indexOf(req.header('Origin')) !== -1) {//indexOf() returns -1 if item not found
        corsOptions = { origin: true };
    } else {
        corsOptions = { origin: false };
    }
    callback(null, corsOptions);
};

exports.cors = cors();//calls the MWfunc we just made, configged to set a cors header of access cont allow origin on a response obj w * as its val,meaning it will allow cors for all origins
exports.corsWithOptions = cors(corsOptionsDelegate);//checks if incoming req is from whitelisted origins. if yes, sends back cors res header of access cont allow origin w WL origin as val. if no, no cors header in res at all