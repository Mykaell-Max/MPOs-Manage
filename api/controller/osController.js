const Os = require('../../mongo/osModel');

async function createOs(req, res) {
    try{
        const newOs = new Os(req.body);
        const os = await newOs.save();

        // const response = {
        
        // };

        return res.status(201);
        // .json(response);
    }
    catch (error) {
        return res.status(500).send(error.message);
    }
}


// need to know more about OS 


module.exports = {
    createOs,
};