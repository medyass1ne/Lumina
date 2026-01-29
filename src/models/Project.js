import mongoose from 'mongoose';

const TemplateSchema = new mongoose.Schema({
    id: String,
    name: String,
    aspectRatio: String,
    driveFileId: String,
    previewUrl: String,
    highResUrl: String,
    width: Number,
    height: Number,
    jsonState: Object,
    isUploaded: Boolean,
    createdAt: Date,
    overlay: Object,
}, { _id: false });

const RuleSchema = new mongoose.Schema({
    id: String,
    field: String,
    operator: String,
    value: String,
    templateId: String,
    isActive: Boolean,
}, { _id: false });

const ProjectSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    settings: {
        watermarkText: String,
        scale: Number,
        outputFormat: String,
    },
    watchSettings: {
        isEnabled: { type: Boolean, default: false },
        folderId: String,
        folderName: String,
        templateId: String,
        scale: { type: Number, default: 2 },
        processedIds: [String],
        lastChecked: Date,
    },
    files: [{
        id: String,
        name: String,
        thumbnail: String,
        previewUrl: String,
        mimeType: String,
        status: { type: String, default: 'idle' },
        progress: { type: Number, default: 0 },
        width: Number,
        height: Number,
        aspectRatio: String,
        orientation: String,
        isEdited: Boolean,
        source: String
    }],
    templates: [TemplateSchema],
    rules: [RuleSchema],
    batchConfig: {
        type: Map,
        of: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

ProjectSchema.index({ 'watchSettings.isEnabled': 1 });

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);
