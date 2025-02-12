const Operator = require('../../mongo/operatorModel');

async function createOperator(req, res) {
    try{
        const newOperator = new Operator(req.body);
        const operator = await newOperator.save();

        // const response = {
        // };  

        return res.status(201);
        // .json(response);
    }
    catch (error) {
        return res.status(500).send(error.message);
    }
}


// login, update, delete | theres really not much to code here 


module.exports = {
    createOperator,
};