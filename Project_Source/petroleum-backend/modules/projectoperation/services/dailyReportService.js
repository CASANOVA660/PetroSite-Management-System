const mongoose = require('mongoose');
const DailyReport = require('../models/DailyReport');
const Project = require('../../projects/models/Project');
const logger = require('../../../utils/logger');

class DailyReportService {
    /**
     * Get all daily reports for a project
     * @param {string} projectId - Project ID
     * @param {Object} filters - Optional filters (date range, etc.)
     * @returns {Promise<Array>} List of daily reports
     */
    async getProjectDailyReports(projectId, filters = {}) {
        try {
            // Validate projectId format
            if (!mongoose.Types.ObjectId.isValid(projectId)) {
                throw new Error('Format de l\'identifiant du projet invalide');
            }

            // Check if project exists
            const project = await Project.findById(projectId);
            if (!project) {
                throw new Error('Projet non trouvé');
            }

            // Build query
            const query = {
                projectId,
                isDeleted: false
            };

            // Apply date range filter if provided
            if (filters.startDate && filters.endDate) {
                query.date = {
                    $gte: new Date(filters.startDate),
                    $lte: new Date(filters.endDate)
                };
            }

            // Get daily reports with populated data
            const dailyReports = await DailyReport.find(query)
                .populate({
                    path: 'equipmentUsed.equipmentId',
                    select: 'nom reference type'
                })
                .populate({
                    path: 'createdBy',
                    select: 'name email'
                })
                .sort({ date: -1 });

            return dailyReports;
        } catch (error) {
            logger.error(`Error in getProjectDailyReports: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get a specific daily report by ID
     * @param {string} reportId - Report ID
     * @returns {Promise<Object>} Daily report
     */
    async getDailyReportById(reportId) {
        try {
            // Validate reportId format
            if (!mongoose.Types.ObjectId.isValid(reportId)) {
                throw new Error('Format de l\'identifiant du rapport invalide');
            }

            // Get daily report with populated data
            const dailyReport = await DailyReport.findOne({
                _id: reportId,
                isDeleted: false
            })
                .populate({
                    path: 'equipmentUsed.equipmentId',
                    select: 'nom reference type'
                })
                .populate({
                    path: 'createdBy',
                    select: 'name email'
                });

            if (!dailyReport) {
                throw new Error('Rapport journalier non trouvé');
            }

            return dailyReport;
        } catch (error) {
            logger.error(`Error in getDailyReportById: ${error.message}`);
            throw error;
        }
    }

    /**
     * Create a new daily report
     * @param {string} projectId - Project ID
     * @param {Object} reportData - Report data
     * @param {string} userId - ID of the user creating the report
     * @returns {Promise<Object>} Created daily report
     */
    async createDailyReport(projectId, reportData, userId) {
        try {
            // Validate projectId format
            if (!mongoose.Types.ObjectId.isValid(projectId)) {
                throw new Error('Format de l\'identifiant du projet invalide');
            }

            // Check if project exists
            const project = await Project.findById(projectId);
            if (!project) {
                throw new Error('Projet non trouvé');
            }

            // Check if a report for this date already exists
            const existingReport = await DailyReport.findOne({
                projectId,
                date: new Date(reportData.date),
                isDeleted: false
            });

            if (existingReport) {
                throw new Error('Un rapport existe déjà pour cette date');
            }

            // Create daily report object
            const newDailyReport = new DailyReport({
                projectId,
                date: reportData.date || new Date(),
                activities: reportData.activities || [],
                equipmentUsed: reportData.equipmentUsed || [],
                healthAndSafety: reportData.healthAndSafety || {
                    incidents: 0,
                    nearMisses: 0,
                    safetyMeetingHeld: false
                },
                weatherConditions: reportData.weatherConditions || '',
                challenges: reportData.challenges || '',
                solutions: reportData.solutions || '',
                notes: reportData.notes || '',
                attachments: reportData.attachments || [],
                createdBy: userId
            });

            // Save daily report
            await newDailyReport.save();

            // Return created daily report with populated data
            const createdDailyReport = await DailyReport.findById(newDailyReport._id)
                .populate({
                    path: 'equipmentUsed.equipmentId',
                    select: 'nom reference type'
                })
                .populate({
                    path: 'createdBy',
                    select: 'name email'
                });

            return createdDailyReport;
        } catch (error) {
            logger.error(`Error in createDailyReport: ${error.message}`);
            throw error;
        }
    }

    /**
     * Update a daily report
     * @param {string} reportId - Report ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated daily report
     */
    async updateDailyReport(reportId, updateData) {
        try {
            // Validate reportId format
            if (!mongoose.Types.ObjectId.isValid(reportId)) {
                throw new Error('Format de l\'identifiant du rapport invalide');
            }

            // Check if daily report exists
            const dailyReport = await DailyReport.findById(reportId);
            if (!dailyReport || dailyReport.isDeleted) {
                throw new Error('Rapport journalier non trouvé');
            }

            // Update daily report fields
            Object.keys(updateData).forEach(key => {
                // Only update valid fields
                if (key !== '_id' && key !== 'projectId' && key !== 'createdBy' && key !== 'isDeleted') {
                    dailyReport[key] = updateData[key];
                }
            });

            // Save updated daily report
            await dailyReport.save();

            // Return updated daily report with populated data
            const updatedDailyReport = await DailyReport.findById(reportId)
                .populate({
                    path: 'equipmentUsed.equipmentId',
                    select: 'nom reference type'
                })
                .populate({
                    path: 'createdBy',
                    select: 'name email'
                });

            return updatedDailyReport;
        } catch (error) {
            logger.error(`Error in updateDailyReport: ${error.message}`);
            throw error;
        }
    }

    /**
     * Delete a daily report
     * @param {string} reportId - Report ID
     * @returns {Promise<Object>} Result message
     */
    async deleteDailyReport(reportId) {
        try {
            // Validate reportId format
            if (!mongoose.Types.ObjectId.isValid(reportId)) {
                throw new Error('Format de l\'identifiant du rapport invalide');
            }

            // Check if daily report exists
            const dailyReport = await DailyReport.findById(reportId);
            if (!dailyReport || dailyReport.isDeleted) {
                throw new Error('Rapport journalier non trouvé');
            }

            // Soft delete
            dailyReport.isDeleted = true;
            await dailyReport.save();

            return { message: 'Rapport journalier supprimé avec succès' };
        } catch (error) {
            logger.error(`Error in deleteDailyReport: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new DailyReportService(); 