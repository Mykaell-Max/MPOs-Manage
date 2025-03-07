const Os = require('../mongo/osModel')
const OSFeatures = require('../../../utils/osFeatures');


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


async function searchOs(req, res) {
    try {
        const osQuery = new OSFeatures(Os.find(), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate()
            .query;

        const result = await osQuery;
        const osList = result.map(os => ({
            id: os._id,
            type: os.type,
            requester: {
                id: os.requester._id,
                name: os.requester.name,
                email: os.requester.email
            },
            description: os.description,
            priority: os.priority,
            status: os.status,
            createdAt: os.createdAt,
            statusHistory: os.statusHistory.map(history => ({
                status: history.status,
                changedAt: history.changedAt,
                changedBy: history.changedBy,
                note: history.note
            })),
            items: os.items.length > 0 ? os.items.map(item => ({
                material: item.material,
                quantity: item.quantity
            })) : null,
            service: os.type === "serviço" ? {
                type: os.service.type,
                details: os.service.details
            } : null
        }));

        return res.status(200).json(osList);

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}


module.exports = {
    createOs,
    // getOsById,
    // getAllOs,
    deleteOs,
    changeStatus, 
    // getAllOsFromUser,
    resubmitOs,
    searchOs
};
