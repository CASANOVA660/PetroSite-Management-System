const Document = require('../models/document.model');
const cloudinary = require('../../../config/cloudinary');

class DocumentService {
    async getProjectDocuments({ projectId, category }) {
        try {
            const documents = await Document.find({ projectId, category })
                .populate('uploadedBy', 'nom prenom')
                .sort({ createdAt: -1 });
            return documents;
        } catch (error) {
            console.error('Error in getProjectDocuments:', error);
            throw error;
        }
    }

    async uploadDocument(file, category, projectId, userId) {
        try {
            console.log('Starting document upload:', {
                fileName: file.originalname,
                category,
                projectId,
                userId
            });

            // Convert buffer to base64
            const buffer = file.buffer;
            const base64File = buffer.toString('base64');
            const uploadStr = `data:${file.mimetype};base64,${base64File}`;

            // Upload to Cloudinary
            const uploadResult = await cloudinary.uploader.upload(uploadStr, {
                resource_type: 'auto',
                folder: `documents/${category.toLowerCase().replace(/\s+/g, '-')}`,
                public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '')}`,
                overwrite: true
            });

            console.log('Cloudinary upload result:', uploadResult);

            // Create document in database
            const document = new Document({
                name: file.originalname,
                url: uploadResult.secure_url,
                publicId: uploadResult.public_id,
                category,
                projectId,
                uploadedBy: userId,
                type: file.mimetype,
                format: uploadResult.format,
                resourceType: uploadResult.resource_type,
                size: uploadResult.bytes,
                width: uploadResult.width,
                height: uploadResult.height
            });

            await document.save();
            console.log('Document saved to database:', document);

            return document;
        } catch (error) {
            console.error('Error in uploadDocument:', {
                error: error.message,
                stack: error.stack,
                file: {
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size
                }
            });
            throw error;
        }
    }

    async deleteDocument(documentId) {
        try {
            const document = await Document.findById(documentId);
            if (!document) {
                throw new Error('Document not found');
            }

            // Delete from Cloudinary
            await cloudinary.uploader.destroy(document.publicId);

            // Delete from database
            await document.remove();
            return document;
        } catch (error) {
            console.error('Error in deleteDocument:', error);
            throw error;
        }
    }

    getOptimizedUrl(publicId) {
        return cloudinary.url(publicId, {
            fetch_format: 'auto',
            quality: 'auto'
        });
    }

    getTransformedUrl(publicId) {
        return cloudinary.url(publicId, {
            transformation: [
                { width: 800, height: 600, crop: 'fill' },
                { quality: 'auto' }
            ]
        });
    }
}

module.exports = new DocumentService();