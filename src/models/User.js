import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    name: String,
    image: String,
    refreshToken: {
        type: String,
        required: true,
    },
    settings: {
        notifications: { type: Boolean, default: true },
        defaultQuality: { type: String, default: "2" },
        autoApplyRules: { type: Boolean, default: true },
        batchProcessing: { type: Boolean, default: true },
        cacheTemplates: { type: Boolean, default: true }
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

export default mongoose.models.User || mongoose.model('User', UserSchema);
