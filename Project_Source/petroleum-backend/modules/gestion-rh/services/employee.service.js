const Employee = require('../models/employee.model');
const cloudinary = require('../../../config/cloudinary');
const redis = require('../../../config/redis');
const { v4: uuidv4 } = require('uuid');
const { Readable } = require('stream');

// Helper: recursively find a folder by id
function findFolderById(folders, folderId) {
    if (!folders) return null;

    for (const folder of folders) {
        if (folder.id === folderId) {
            return folder;
        }
        if (folder.subfolders && folder.subfolders.length) {
            const found = findFolderById(folder.subfolders, folderId);
            if (found) return found;
        }
    }
    return null;
}

// Helper: recursively remove a folder by id
function removeFolderById(folders, folderId) {
    return folders.filter(folder => {
        if (folder.id === folderId) return false;
        if (folder.subfolders && folder.subfolders.length) {
            folder.subfolders = removeFolderById(folder.subfolders, folderId);
        }
        return true;
    });
}

// Add a folder
async function addFolder(employeeId, { name, parentId }) {
    try {
        const employee = await Employee.findById(employeeId);
        if (!employee) throw new Error('Employee not found');

        const newFolder = {
            id: uuidv4(),
            name,
            parentId: parentId || null,
            documents: [],
            subfolders: []
        };

        if (parentId) {
            // Find parent folder recursively
            const parentFolder = findFolderById(employee.folders, parentId);
            if (!parentFolder) throw new Error('Parent folder not found');

            // Add new folder to parent's subfolders
            parentFolder.subfolders.push(newFolder);
        } else {
            // Add as root folder
            employee.folders.push(newFolder);
        }

        // Mark folders as modified for deep changes
        employee.markModified('folders');

        // Save changes
        await employee.save();

        // Invalidate cache
        await redis.del('employees:all');
        await redis.del(`employees:${employeeId}`);

        return newFolder;
    } catch (error) {
        console.error('Error in addFolder:', error);
        throw error;
    }
}

// Rename a folder
async function renameFolder(employeeId, { folderId, newName }) {
    try {
        const employee = await Employee.findById(employeeId);
        if (!employee) throw new Error('Employee not found');

        const folder = findFolderById(employee.folders, folderId);
        if (!folder) throw new Error('Folder not found');

        folder.name = newName;
        await employee.save();

        // Invalidate cache
        await redis.del('employees:all');
        await redis.del(`employees:${employeeId}`);

        return folder;
    } catch (error) {
        console.error('Error in renameFolder:', error);
        throw error;
    }
}

// Delete a folder
async function deleteFolder(employeeId, folderId) {
    try {
        const employee = await Employee.findById(employeeId);
        if (!employee) throw new Error('Employee not found');

        employee.folders = removeFolderById(employee.folders, folderId);
        await employee.save();

        // Invalidate cache
        await redis.del('employees:all');
        await redis.del(`employees:${employeeId}`);

        return true;
    } catch (error) {
        console.error('Error in deleteFolder:', error);
        throw error;
    }
}

// Add document to folder
async function addDocumentToFolder(employeeId, folderId, file, uploadedBy) {
    try {
        console.log('Starting document upload process...');
        console.log('File details:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            buffer: file.buffer ? 'Buffer present' : 'No buffer'
        });

        if (!file || !file.buffer) {
            throw new Error('No file uploaded');
        }

        const employee = await Employee.findById(employeeId);
        if (!employee) throw new Error('Employee not found');

        // Find the folder recursively
        const folder = findFolderById(employee.folders, folderId);
        if (!folder) throw new Error('Folder not found');

        console.log('Found folder:', {
            id: folder.id,
            name: folder.name,
            parentId: folder.parentId
        });

        let uploadResult;

        // Handle PDF files specially
        if (file.mimetype === 'application/pdf') {
            const base64Data = file.buffer.toString('base64');
            const dataURI = `data:${file.mimetype};base64,${base64Data}`;

            uploadResult = await cloudinary.uploader.upload(dataURI, {
                resource_type: 'raw',
                folder: `employees/${employeeId}/folders/${folderId}`,
                public_id: `${Date.now()}-${file.originalname}`,
                format: 'pdf'
            });
        } else {
            uploadResult = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: `employees/${employeeId}/folders/${folderId}`,
                        resource_type: 'auto',
                        use_filename: true,
                        unique_filename: true
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );

                const bufferStream = new Readable();
                bufferStream.push(file.buffer);
                bufferStream.push(null);
                bufferStream.pipe(uploadStream);
            });
        }

        console.log('Upload result:', uploadResult);

        const folderDocument = {
            url: uploadResult.secure_url,
            type: file.mimetype,
            name: file.originalname,
            publicId: uploadResult.public_id,
            uploadedBy: uploadedBy,
            uploadedAt: new Date(),
            size: uploadResult.bytes,
            format: uploadResult.format,
            resourceType: uploadResult.resource_type,
            width: uploadResult.width,
            height: uploadResult.height
        };

        // Initialize documents array if it doesn't exist
        if (!Array.isArray(folder.documents)) {
            folder.documents = [];
        }

        // Add document to folder
        folder.documents.push(folderDocument);

        // Mark folders as modified for deep changes
        employee.markModified('folders');

        // Save the employee document
        const result = await employee.save();
        console.log('Document added to folder:', {
            folderId: folder.id,
            folderName: folder.name,
            documentCount: folder.documents.length,
            document: folderDocument
        });

        // Invalidate cache
        await redis.del('employees:all');
        await redis.del(`employees:${employeeId}`);

        return folderDocument;
    } catch (error) {
        console.error('Error in addDocumentToFolder:', error);
        throw error;
    }
}

// Delete document from folder
async function deleteDocumentFromFolder(employeeId, folderId, { url, publicId }) {
    try {
        const employee = await Employee.findById(employeeId);
        if (!employee) throw new Error('Employee not found');

        const folder = findFolderById(employee.folders, folderId);
        if (!folder) throw new Error('Folder not found');

        // Delete from Cloudinary if publicId is provided
        if (publicId) {
            await cloudinary.uploader.destroy(publicId);
        }

        // Remove document from folder
        folder.documents = folder.documents.filter(doc => doc.url !== url);
        await employee.save();

        // Invalidate cache
        await redis.del('employees:all');
        await redis.del(`employees:${employeeId}`);

        return true;
    } catch (error) {
        console.error('Error in deleteDocumentFromFolder:', error);
        throw error;
    }
}

// Get employee by ID (with Redis cache)
async function getEmployeeById(id) {
    const cacheKey = `employees:${id}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const employee = await Employee.findById(id);
    if (employee) {
        await redis.set(cacheKey, JSON.stringify(employee), 'EX', 60 * 5);
    }
    return employee;
}

// Get all employees (with Redis cache)
async function getAllEmployees() {
    const cacheKey = 'employees:all';
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const employees = await Employee.find();
    await redis.set(cacheKey, JSON.stringify(employees), 'EX', 60 * 5);
    return employees;
}

// Create employee
async function createEmployee(body, files) {
    const { name, email, phone, department, position, hireDate } = body;
    const employeeData = {
        name,
        email,
        phone,
        department: department || '',
        position,
        hireDate,
        status: 'active',
        folders: [],
    };

    // Handle profile image upload to Cloudinary
    if (files && files.profileImage && files.profileImage[0]) {
        const imageFile = files.profileImage[0];
        const uploadResult = await cloudinary.uploader.upload_stream_promise
            ? await cloudinary.uploader.upload_stream_promise(imageFile.buffer, {
                folder: 'employees/profileImages',
                resource_type: 'image',
                use_filename: true,
                unique_filename: true
            })
            : await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'employees/profileImages',
                        resource_type: 'image',
                        use_filename: true,
                        unique_filename: true
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                const { Readable } = require('stream');
                const bufferStream = new Readable();
                bufferStream.push(imageFile.buffer);
                bufferStream.push(null);
                bufferStream.pipe(uploadStream);
            });
        employeeData.profileImage = uploadResult.secure_url;
        employeeData.profileImagePublicId = uploadResult.public_id;
    }

    // Handle initial documents upload to Cloudinary
    let initialDocuments = [];
    if (files && files.documents && files.documents.length > 0) {
        for (const docFile of files.documents) {
            const uploadResult = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'employees/documents',
                        resource_type: 'auto',
                        use_filename: true,
                        unique_filename: true
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                const { Readable } = require('stream');
                const bufferStream = new Readable();
                bufferStream.push(docFile.buffer);
                bufferStream.push(null);
                bufferStream.pipe(uploadStream);
            });
            initialDocuments.push({
                url: uploadResult.secure_url,
                type: docFile.mimetype,
                name: docFile.originalname,
                publicId: uploadResult.public_id,
                uploadedAt: new Date(),
                size: uploadResult.bytes,
                format: uploadResult.format,
                resourceType: uploadResult.resource_type,
                width: uploadResult.width,
                height: uploadResult.height
            });
        }
    }

    // If there are initial documents, create a default folder
    if (initialDocuments.length > 0) {
        employeeData.folders.push({
            id: uuidv4(),
            name: 'Documents',
            parentId: null,
            documents: initialDocuments,
            subfolders: []
        });
    }

    // Create and save employee
    const employee = new Employee(employeeData);
    await employee.save();
    return employee;
}

module.exports = {
    getEmployeeById,
    getAllEmployees,
    addFolder,
    renameFolder,
    deleteFolder,
    addDocumentToFolder,
    deleteDocumentFromFolder,
    createEmployee
};