const Os = require('../../mongo/osModel');


async function createOs(req, res) {
    try{
        const newOs = new Os(req.body);
        const os = await newOs.save();

        const response = {
            os: os
        };

        return res.status(201).json(response);
    }
    catch (error) {
        return res.status(500).send(error.message);
    }
}


async function getOsById(req, res) {
    try {
        const osId = req.params.osId;
        const os = await Os.findById(osId);

        if (!os) {
            return res.status(404).json({ message: "OS not found" });
        }

        return res.status(200).json(os);
    } catch (error) {
        return res.status(500).send(error.message);
    }
}
  

async function getAllOs(req, res) {
    try {
        const osList = await Os.find();

        return res.status(200).json(osList);
    } catch (error) {
        return res.status(500).send(error.message);
    }
}


async function updateOs(req, res) {
    try {
        const osId = req.params.osId;
        const updatedOs = await Os.findByIdAndUpdate(osId, req.body, {new: true});

        if (!updatedOs) {
            return res.status(404).json({ message: "OS not found" });
        }

        return res.status(200).json(updatedOs);
    } catch (error) {
        return res.status(500).send(error.message);
    }
}


async function deleteOs(req, res) {
    try {
        const osId = req.params.osId;
        const deletedOs = await Os.findByIdAndDelete(osId);
        
        if (!deletedOs) {
            return res.status(404).json({ message: "OS not found" });
        }
      
        return res.status(200).json({ message: "OS deleted successfully" });
    } catch (error) {
        return res.status(500).send(error.message);
    }
}


module.exports = {
    createOs,
    getOsById,
    getAllOs,
    updateOs,
    deleteOs,
};