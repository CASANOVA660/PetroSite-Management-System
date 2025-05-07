const employeeService = require('../services/employee.service');

// Create employee
exports.createEmployee = async (req, res) => {
    try {
        const employee = await employeeService.createEmployee(req.body, req.files);
        res.status(201).json(employee);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all employees
exports.getAllEmployees = async (req, res) => {
    try {
        const employees = await employeeService.getAllEmployees();
        res.json(employees);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get employee by ID
exports.getEmployeeById = async (req, res) => {
    try {
        const employee = await employeeService.getEmployeeById(req.params.id);
        if (!employee) return res.status(404).json({ error: 'Employé non trouvé' });
        res.json(employee);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update employee
exports.updateEmployee = async (req, res) => {
    try {
        const employee = await employeeService.updateEmployee(req.params.id, req.body, req.files);
        if (!employee) return res.status(404).json({ error: 'Employé non trouvé' });
        res.json(employee);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
    try {
        const employee = await employeeService.deleteEmployee(req.params.id);
        if (!employee) return res.status(404).json({ error: 'Employé non trouvé' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Add folder
exports.addFolder = async (req, res) => {
    try {
        const folder = await employeeService.addFolder(req.params.employeeId, req.body);
        res.status(201).json(folder);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Rename folder
exports.renameFolder = async (req, res) => {
    try {
        const folder = await employeeService.renameFolder(req.params.employeeId, req.params.folderId, req.body);
        res.json(folder);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete folder
exports.deleteFolder = async (req, res) => {
    try {
        await employeeService.deleteFolder(req.params.employeeId, req.params.folderId);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Add document to folder
exports.addDocumentToFolder = async (req, res) => {
    try {
        const { employeeId, folderId } = req.params;

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        console.log('File upload request received:', {
            employeeId,
            folderId,
            fileName: req.file.originalname,
            fileType: req.file.mimetype,
            fileSize: req.file.size
        });

        const document = await employeeService.addDocumentToFolder(
            employeeId,
            folderId,
            req.file,
            req.user._id // Pass the authenticated user's ID as uploadedBy
        );

        res.status(201).json({
            message: 'Document uploaded successfully',
            document
        });
    } catch (error) {
        console.error('Error in addDocumentToFolder controller:', error);
        res.status(500).json({
            message: 'Error uploading document',
            error: error.message
        });
    }
};

// Delete document from folder
exports.deleteDocumentFromFolder = async (req, res) => {
    try {
        await employeeService.deleteDocumentFromFolder(
            req.params.employeeId,
            req.params.folderId,
            { url: req.body.url, publicId: req.body.publicId }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}; 