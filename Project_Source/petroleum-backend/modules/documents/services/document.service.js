const Document = require('../models/document.model');
const cloudinary = require('../../../config/cloudinary');
const redis = require('../../../config/redis');

class DocumentService {
    async uploadDocument(file, category, projectId, userId) {
        try {
            console.log('[DEBUG] Starting document upload:', {
                fileName: file.originalname,
                category,
                projectId,
                userId
            });

            // Convert buffer to base64
            const buffer = file.buffer;
            const base64File = buffer.toString('base64');
            const uploadStr = `data:${file.mimetype};base64,${base64File}`;

            // Upload to Cloudinary with optimized settings
            const uploadResult = await cloudinary.uploader.upload(uploadStr, {
                resource_type: 'auto',
                folder: `documents/${category.toLowerCase().replace(/\s+/g, '-')}`,
                public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '')}`,
                overwrite: true,
                chunk_size: 6000000 // 6MB chunks for large files
            });

            console.log('[DEBUG] Cloudinary upload result:', uploadResult);

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
            console.log('[DEBUG] Document saved to database:', document);

            // Invalidate cache for this category
            const cacheKey = `documents:${projectId}:${category}`;
            await redis.del(cacheKey);
            console.log('[DEBUG] Cache invalidated for key:', cacheKey);

            return document;
        } catch (error) {
            console.error('[ERROR] Error in uploadDocument:', {
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

    async getProjectDocuments({ projectId, category }) {
        const cacheKey = `documents:${projectId}:${category}`;

        try {
            console.log('[DEBUG] Checking cache for key:', cacheKey);
            const cached = await redis.get(cacheKey);

            if (cached) {
                console.log('[DEBUG] Cache hit for key:', cacheKey);
                return JSON.parse(cached);
            }

            console.log('[DEBUG] Cache miss, fetching from database');
            const documents = await Document.find({ projectId, category })
                .populate('uploadedBy', 'nom prenom')
                .sort({ createdAt: -1 })
                .lean()
                .exec();

            // Cache the results for 5 minutes
            await redis.set(cacheKey, JSON.stringify(documents), 'EX', 300);
            console.log('[DEBUG] Cached documents for key:', cacheKey);

            return documents;
        } catch (error) {
            console.error('[ERROR] Error in getProjectDocuments:', error);
            throw error;
        }
    }

    async deleteDocument(documentId) {
        try {
            console.log('[DEBUG] Deleting document:', documentId);

            const document = await Document.findById(documentId);
            if (!document) {
                throw new Error('Document not found');
            }

            // Delete from Cloudinary
            await cloudinary.uploader.destroy(document.publicId);
            console.log('[DEBUG] Document deleted from Cloudinary');

            // Delete from database
            await document.remove();
            console.log('[DEBUG] Document deleted from database');

            // Invalidate cache for this category
            const cacheKey = `documents:${document.projectId}:${document.category}`;
            await redis.del(cacheKey);
            console.log('[DEBUG] Cache invalidated for key:', cacheKey);

            return document;
        } catch (error) {
            console.error('[ERROR] Error in deleteDocument:', error);
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