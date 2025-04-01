const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
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
        enum: ['leak', 'water_quality', 'pressure', 'other']
    },
    priority: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    status: {
        type: String,
        required: true,
        enum: ['reported', 'assigned', 'in_progress', 'resolved', 'closed'],
        default: 'reported'
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    waterService: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WaterService'
    },
    photos: [{
        url: String,
        caption: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    comments: [{
        text: String,
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    resolution: {
        description: String,
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        resolvedAt: Date
    },
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
issueSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Method to add a comment
issueSchema.methods.addComment = async function(userId, text) {
    this.comments.push({
        text,
        user: userId
    });
    await this.save();
};

// Method to update status
issueSchema.methods.updateStatus = async function(newStatus, userId) {
    this.status = newStatus;
    if (newStatus === 'resolved') {
        this.resolution = {
            resolvedBy: userId,
            resolvedAt: Date.now()
        };
    }
    await this.save();
};

// Static method to find issues by status
issueSchema.statics.findByStatus = function(status) {
    return this.find({ status });
};

// Static method to find issues by priority
issueSchema.statics.findByPriority = function(priority) {
    return this.find({ priority });
};

// Static method to find issues by type
issueSchema.statics.findByType = function(type) {
    return this.find({ type });
};

const Issue = mongoose.model('Issue', issueSchema);

module.exports = Issue; 