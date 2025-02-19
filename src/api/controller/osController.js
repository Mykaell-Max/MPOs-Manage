const Os = require('../mongo/osModel')


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


async function getAllOsFromUser(req, res) {
    try {
        const userId = req.params.userId;
        const osList = await Os.find({ requester: userId });
  
        return res.status(200).json(osList);
    } catch (error) {
        return res.status(500).json({ error: error.message });
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


async function changeStatus(req, res) {
    try {
        const osId = req.params.osId;
        const { newStatus, note, changedBy } = req.body;
        
        const os = await Os.findById(osId);

        if (!os) {
            return res.status(404).json({ message: 'OS not found' });
        }
  
        os.status = newStatus;
  
        os.statusHistory.push({
            status: newStatus,
            changedAt: new Date(),
            changedBy, 
            note 
        });
        
        const updatedOs = await os.save();
        
        return res.status(200).json({ message: 'Status updated successfully', os: updatedOs });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}


async function resubmitOs(req, res) {
    try {
        const osId = req.params.osId;
        const updateData = req.body;

        const os = await Os.findById(osId);
        if (!os) {
            return res.status(404).json({ message: 'OS not found' });
        }

        if (os.status !== "Rejeitada") {
            return res.status(400).json({ message: 'Only rejected OS can be resubmitted.' });
        }

        Object.keys(updateData).forEach(key => {
            if (os[key] !== undefined) {
                os[key] = updateData[key];
            }
        });
        
        os.status = "Aberta";
        os.statusHistory.push({
            status: "Aberta",
            changedAt: new Date(),
            changedBy: os.requester,
            note: "OS resubmitted by operator after rejection."
        });

        const updatedOs = await os.save();
        return res.status(200).json({ message: 'OS resubmitted successfully', os: updatedOs });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}


module.exports = {
    createOs,
    getOsById,
    getAllOs,
    deleteOs,
    changeStatus, 
    getAllOsFromUser,
    resubmitOs
};
