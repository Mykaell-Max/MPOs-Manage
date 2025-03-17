const ProductRegistration = require('../mongo/productRegistrationModel');
const ProductFeatures = require('../../../utils/productFeatures');


async function createRequest(req, res) {
    try {
        const newRequest = new ProductRegistration({
            ...req.body,
            status: "Enviado",
            statusHistory: [
                {
                    status: "Enviado",
                    changedAt: new Date(),
                    changedBy: req.user.id,
                    notes: "Solicitação criada e enviada"
                }
            ]
        });
        
        const request = await newRequest.save();
        
        return res.status(201).json({
            message: "Solicitação criada com sucesso",
            request
        });
    } catch (error) {
        return res.status(500).send(error.message);
    }
}


async function getMyRequests(req, res) {
    try {
        const baseQuery = ProductRegistration.find({ requester: req.user.id });
        
        const features = new ProductFeatures(baseQuery, req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();
        
        const requests = await features.query;
        
        const totalDocuments = await ProductRegistration.countDocuments({ requester: req.user.id });
        
        const formattedRequests = requests.map(request => ({
            id: request._id,
            requestType: request.requestType,
            productInfo: {
                name: request.productInfo.name,
                category: request.productInfo.category,
                specifications: request.productInfo.specifications,
                unit: request.productInfo.unit,
                supplier: request.productInfo.supplier,
                price: request.productInfo.price,
                changedFields: request.productInfo.changedFields
            },
            requesterNotes: request.requesterNotes,
            status: request.status,
            statusHistory: request.statusHistory.map(history => ({
                status: history.status,
                changedAt: history.changedAt,
                notes: history.notes
            })),
            createdAt: request.createdAt,
            updatedAt: request.updatedAt
        }));

        return res.status(200).json({
            results: formattedRequests.length,
            totalDocuments,
            page: req.query.page * 1 || 1,
            limit: req.query.limit * 1 || 10,
            data: formattedRequests
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}


async function getPendingPurchasingReviews(req, res) {
    try {
        const baseQuery = ProductRegistration.find({
            status: { $in: ["Enviado", "Em Análise (Compras)"] }
        });
        
        const features = new ProductFeatures(baseQuery, req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();
        
        const requests = await features.query
            .populate('requester', 'name email department');
        
        const totalDocuments = await ProductRegistration.countDocuments({
            status: { $in: ["Enviado", "Em Análise (Compras)"] }
        });
        
        const formattedRequests = requests.map(request => ({
            id: request._id,
            requestType: request.requestType,
            requester: {
                id: request.requester._id,
                name: request.requester.name,
                email: request.requester.email,
                department: request.requester.department
            },
            productInfo: {
                name: request.productInfo.name,
                category: request.productInfo.category,
                specifications: request.productInfo.specifications,
                unit: request.productInfo.unit,
                supplier: request.productInfo.supplier,
                price: request.productInfo.price
            },
            requesterNotes: request.requesterNotes,
            status: request.status,
            statusHistory: request.statusHistory.map(history => ({
                status: history.status,
                changedAt: history.changedAt,
                notes: history.notes
            })),
            createdAt: request.createdAt,
            updatedAt: request.updatedAt
        }));
        
        return res.status(200).json({
            results: formattedRequests.length,
            totalDocuments,
            page: req.query.page * 1 || 1,
            limit: req.query.limit * 1 || 10,
            data: formattedRequests
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}


async function reviewByPurchasing(req, res) {
    try {
        const { requestId } = req.params;
        const { decision, notes } = req.body;
        
        const request = await ProductRegistration.findById(requestId);
        
        if (!request) {
            return res.status(404).json({ message: "Solicitação não encontrada" });
        }
        
        if (request.status !== "Enviado" && request.status !== "Em Análise (Compras)") {
            return res.status(400).json({ 
                message: "Esta solicitação não está disponível para análise por Compras" 
            });
        }
        
        if (req.user.role !== "Compras" && req.user.role !== "Admin") {
            return res.status(403).json({ 
                message: "Você não tem permissão para revisar esta solicitação" 
            });
        }
        
        let newStatus = decision === "approve" ? 
            "Aprovado por Compras" : 
            "Reprovado por Compras";
        
        request.status = newStatus;
        
        request.statusHistory.push({
            status: newStatus,
            changedAt: new Date(),
            changedBy: req.user.id,
            notes
        });
        
        request.updatedAt = new Date();
        
        await request.save();
        
        return res.status(200).json({
            message: `Solicitação ${decision === "approve" ? "aprovada" : "reprovada"} com sucesso`,
            request
        });
    } catch (error) {
        return res.status(500).send(error.message);
    }
}


async function getPendingRegistrations(req, res) {
    try {
        const baseQuery = ProductRegistration.find({
            status: { $in: ["Aprovado por Compras", "Em Cadastro (Sistema ERP)"] }
        });
        
        const features = new ProductFeatures(baseQuery, req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();
        
        const requests = await features.query
            .populate('requester', 'name email department');
        
        const totalDocuments = await ProductRegistration.countDocuments({
            status: { $in: ["Aprovado por Compras", "Em Cadastro (Sistema ERP)"] }
        });
        
        const formattedRequests = requests.map(request => ({
            id: request._id,
            requestType: request.requestType,
            requester: {
                id: request.requester._id,
                name: request.requester.name,
                email: request.requester.email,
                department: request.requester.department
            },
            productInfo: {
                name: request.productInfo.name,
                category: request.productInfo.category,
                specifications: request.productInfo.specifications,
                unit: request.productInfo.unit,
                supplier: request.productInfo.supplier,
                price: request.productInfo.price
            },
            requesterNotes: request.requesterNotes,
            status: request.status,
            statusHistory: request.statusHistory.map(history => ({
                status: history.status,
                changedAt: history.changedAt,
                notes: history.notes
            })),
            createdAt: request.createdAt,
            updatedAt: request.updatedAt
        }));
        
        return res.status(200).json({
            results: formattedRequests.length,
            totalDocuments,
            page: req.query.page * 1 || 1,
            limit: req.query.limit * 1 || 10,
            data: formattedRequests
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}


async function processRegistration(req, res) {
    try {
        const { requestId } = req.params;
        const { decision, notes } = req.body;
        
        const request = await ProductRegistration.findById(requestId);
        
        if (!request) {
            return res.status(404).json({ message: "Solicitação não encontrada" });
        }
        

        if (request.status !== "Aprovado por Compras" && request.status !== "Em Cadastro (Sistema ERP)") {
            return res.status(400).json({ 
                message: "Esta solicitação não está disponível para cadastro" 
            });
        }
        
        
        if (req.user.role !== "Cadastro" && req.user.role !== "Admin") {
            return res.status(403).json({ 
                message: "Você não tem permissão para processar esta solicitação" 
            });
        }
        
        
        let newStatus = decision === "complete" ? 
            "Finalizado" : 
            "Reprovado por Cadastro";
        
        request.status = newStatus;
        
        request.statusHistory.push({
            status: newStatus,
            changedAt: new Date(),
            changedBy: req.user.id,
            notes
        });
        
        request.updatedAt = new Date();
        
        await request.save();
        
        return res.status(200).json({
            message: `Solicitação ${decision === "complete" ? "finalizada" : "reprovada"} com sucesso`,
            request
        });
    } catch (error) {
        return res.status(500).send(error.message);
    }
}


async function resubmitRequest(req, res) {
    try {
        const { requestId } = req.params;
        const updateData = req.body;
        
        const request = await ProductRegistration.findById(requestId);
        
        if (!request) {
            return res.status(404).json({ message: "Solicitação não encontrada" });
        }
        
        
        if (request.status !== "Reprovado por Compras" && request.status !== "Reprovado por Cadastro") {
            return res.status(400).json({ 
                message: "Apenas solicitações reprovadas podem ser reenviadas" 
            });
        }
        
        
        if (request.requester.toString() !== req.user.id && req.user.role !== "Admin") {
            return res.status(403).json({ 
                message: "Apenas o solicitante original pode reenviar esta solicitação" 
            });
        }
        
        
        Object.keys(updateData).forEach(key => {
            if (key === 'productInfo' && updateData[key]) {
                Object.keys(updateData[key]).forEach(productKey => {
                    request.productInfo[productKey] = updateData[key][productKey];
                });
            } else if (key !== 'status' && key !== 'statusHistory' && key !== 'requester') {
                request[key] = updateData[key];
            }
        });
        
        
        let newStatus = request.status === "Reprovado por Compras" ? 
            "Enviado" : 
            "Aprovado por Compras";
        
        request.status = newStatus;
        
        request.statusHistory.push({
            status: newStatus,
            changedAt: new Date(),
            changedBy: req.user.id,
            notes: "Solicitação reenviada após ajustes"
        });
        
        request.updatedAt = new Date();
        
        await request.save();
        
        return res.status(200).json({
            message: "Solicitação reenviada com sucesso",
            request
        });
    } catch (error) {
        return res.status(500).send(error.message);
    }
}


async function searchRequests(req, res) {
    try {
        let baseQuery = ProductRegistration.find();
        
        if (req.user.role === 'Solicitante') {
            baseQuery = ProductRegistration.find({ requester: req.user.id });
        } else if (req.user.role === 'Compras') {
            if (!req.query.status) {
                baseQuery = ProductRegistration.find({
                    status: { $in: ["Enviado", "Em Análise (Compras)", "Aprovado por Compras", "Reprovado por Compras"] }
                });
            }
        } else if (req.user.role === 'Cadastro') {
            if (!req.query.status) {
                baseQuery = ProductRegistration.find({
                    status: { $in: ["Aprovado por Compras", "Em Cadastro (Sistema ERP)", "Reprovado por Cadastro", "Finalizado"] }
                });
            }
        }
        
        const features = new ProductFeatures(baseQuery, req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();
        
        const requests = await features.query
            .populate('requester', 'name email department')
            .populate('statusHistory.changedBy', 'name email');
        
        const totalDocuments = await ProductRegistration.countDocuments(features.query._conditions);
        
        const formattedRequests = requests.map(request => ({
            id: request._id,
            requestType: request.requestType,
            requester: {
                id: request.requester._id,
                name: request.requester.name,
                email: request.requester.email,
                department: request.requester.department
            },
            productInfo: {
                name: request.productInfo.name,
                category: request.productInfo.category,
                specifications: request.productInfo.specifications,
                unit: request.productInfo.unit,
                supplier: request.productInfo.supplier,
                price: request.productInfo.price,
                changedFields: request.productInfo.changedFields
            },
            requesterNotes: request.requesterNotes,
            status: request.status,
            statusHistory: request.statusHistory.map(history => ({
                status: history.status,
                changedAt: history.changedAt,
                changedBy: history.changedBy ? {
                    id: history.changedBy._id,
                    name: history.changedBy.name,
                    email: history.changedBy.email
                } : null,
                notes: history.notes
            })),
            createdAt: request.createdAt,
            updatedAt: request.updatedAt
        }));
        
        return res.status(200).json({
            results: formattedRequests.length,
            totalDocuments,
            page: req.query.page * 1 || 1,
            limit: req.query.limit * 1 || 10,
            data: formattedRequests
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}


module.exports = {
    createRequest,
    getMyRequests,
    getPendingPurchasingReviews,
    reviewByPurchasing,
    getPendingRegistrations,
    processRegistration,
    resubmitRequest,
    searchRequests
};