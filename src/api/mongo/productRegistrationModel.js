const mongoose = require("mongoose");

const productRegistrationSchema = new mongoose.Schema({
    requestType: {
        type: String,
        required: true,
        enum: ['cadastro', 'alteração']
    },

    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    productInfo: {
        name: {
            type: String,
            required: true,
            trim: true
        },
        category: {
            type: String,
            required: true
        },
        specifications: {
            type: String,
            required: true
        },
        unit: String,
        supplier: String,
        price: Number,
        changedFields: [String]
    },

    requesterNotes: {
        type: String,
        trim: true
    },

    status: {
        type: String,
        required: true,
        enum: [
            "Rascunho", 
            "Enviado", 
            "Em Análise (Compras)", 
            "Reprovado por Compras", 
            "Aprovado por Compras", 
            "Em Cadastro (Protheus)", 
            "Reprovado por Cadastro",
            "Finalizado"
        ],
        default: "Rascunho"
    },

    statusHistory: [
        {
            status: {
                type: String,
                required: true,
                enum: [
                    "Rascunho", 
                    "Enviado", 
                    "Em Análise (Compras)", 
                    "Reprovado por Compras", 
                    "Aprovado por Compras", 
                    "Em Cadastro (Protheus)", 
                    "Reprovado por Cadastro",
                    "Finalizado"
                ]
            },
            changedAt: {
                type: Date,
                default: Date.now
            },
            changedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            notes: {
                type: String,
                trim: true,
                required: false,
                maxlength: [500, 'A nota deve ter menos de 500 caracteres'],
            }
        }
    ],

    createdAt: {
        type: Date,
        default: Date.now
    },
    
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const ProductRegistration = mongoose.model('ProductRegistration', productRegistrationSchema);

module.exports = ProductRegistration;