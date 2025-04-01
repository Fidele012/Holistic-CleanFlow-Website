const mongoose = require('mongoose');

const waterServiceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        latitude: {
            type: Number,
            required: true
        },
        longitude: {
            type: Number,
            required: true
        }
    },
    type: {
        type: String,
        required: true,
        enum: ['water_treatment', 'distribution', 'collection']
    },
    description: {
        type: String,
        trim: true
    },
    capacity: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        required: true,
        enum: ['operational', 'maintenance', 'out_of_service'],
        default: 'operational'
    },
    currentUsage: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    lastMaintenance: {
        type: Date
    },
    nextMaintenance: {
        type: Date
    },
    maintenanceHistory: [{
        date: Date,
        description: String,
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    issues: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Issue'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
waterServiceSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Method to calculate usage percentage
waterServiceSchema.methods.getUsagePercentage = function() {
    return (this.currentUsage / this.capacity) * 100;
};

// Method to check if maintenance is needed
waterServiceSchema.methods.needsMaintenance = function() {
    if (!this.lastMaintenance) return true;
    
    const daysSinceLastMaintenance = (Date.now() - this.lastMaintenance) / (1000 * 60 * 60 * 24);
    return daysSinceLastMaintenance >= 30; // Maintenance needed every 30 days
};

// Static method to find nearby services
waterServiceSchema.statics.findNearby = async function(latitude, longitude, maxDistance) {
    return this.find({
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                },
                $maxDistance: maxDistance
            }
        }
    });
};

const WaterService = mongoose.model('WaterService', waterServiceSchema);

module.exports = WaterService; 