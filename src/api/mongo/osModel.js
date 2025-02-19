const mongoose = require("mongoose")

const osSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['material/peça', 'serviço']
    },

    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    description: {
        type: String,
        trim: true,
        required: false,
        maxlength: [500, 'A descrição deve ter menos de 500 caracteres'],
    },

    priority: {
        type: String, 
        enum: ["Baixa", "Média", "Alta", "Urgente"]
    },
    
    items: [
        {
            material: {
                type: String,
                required: function () { 
                    return this.parent().type === "material/peça"; 
                }
            },
            
            quantity: {
                type: Number,
                min: 1,
                required: function () { 
                    return this.parent().type === "material/peça"; 
                }
            }
        }
    ],

    service: {
        type: { 
            type: String, 
            required: function () { 
                return this.parent().type === "serviço"; 
            } 
        },

        details: { 
            type: String, 
            required: function () { 
                return this.parent().type === "serviço"; 
            } 
        }
    },

    status: {
        type: String,
        required: true,
        enum: ["Aberta", "Em análise", "Aprovada", "Rejeitada"],
        default: "Aberta"
    },

    statusHistory: [
        {
            status: {
                type: String,
                enum: ["Aberta", "Em análise", "Aprovada", "Rejeitada"],
                required: true
            },
            changedAt: {
                type: Date,
                default: Date.now
            },
            changedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            note: {
                type: String,
                trim: true,
                required: false,
                maxlength: [500, 'A nota deve ter menos de 500 caracteres'],
            }
        }
    ],

    createdAt: {
        type: Date,
        default: Date.now,
    }
});


const Os = mongoose.model('Os', osSchema);

module.exports = Os;