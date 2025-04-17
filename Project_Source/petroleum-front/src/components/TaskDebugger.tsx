import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { Task, fetchUserTasks, fetchProjectActionTasks, fetchGlobalActionTasks } from '../store/slices/taskSlice';
import { toast } from 'react-hot-toast';

// Define interfaces for the populated objects
interface PopulatedId {
    _id: string;
    [key: string]: any; // Allow other properties
}

// Simplified display function for IDs
const displayId = (id: any): string => {
    if (typeof id === 'string') {
        return id.substring(0, 8) + '...';
    } else if (id && typeof id === 'object') {
        // Handle populated object case
        const objectId = (id as PopulatedId)?._id;
        if (objectId && typeof objectId === 'string') {
            return objectId.substring(0, 8) + '...';
        }
    }
    return 'N/A';
};

const TaskDebugger: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { tasks } = useSelector((state: RootState) => state.tasks);
    const { user } = useSelector((state: RootState) => state.auth);
    const [isOpen, setIsOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Add this to show in the debugger
    useEffect(() => {
        if (user) {
            console.log('Current user ID:', user._id);
        }
    }, [user]);

    const handleRefreshTasks = async () => {
        try {
            setIsRefreshing(true);

            // Fetch personal tasks
            await dispatch(fetchUserTasks({})).unwrap();

            // Fetch project action tasks
            await dispatch(fetchProjectActionTasks()).unwrap();

            // Fetch global action tasks
            await dispatch(fetchGlobalActionTasks()).unwrap();

            toast.success('All tasks refreshed');
        } catch (error) {
            console.error('Error refreshing tasks:', error);
            toast.error('Failed to refresh tasks');
        } finally {
            setIsRefreshing(false);
        }
    };

    // Helper function to categorize tasks by source
    const categorizeTasksBySource = () => {
        const allTasks = [
            ...tasks.todo || [],
            ...tasks.inProgress || [],
            ...tasks.inReview || [],
            ...tasks.done || []
        ];

        console.log('ALL TASKS FOR DEBUGGING:', allTasks);

        const result = {
            personal: [] as Task[],
            projectAction: [] as Task[],
            globalAction: [] as Task[],
            other: [] as Task[]
        };

        allTasks.forEach(task => {
            // Log each task to debug
            console.log('Checking task:', {
                id: task._id,
                title: task.title,
                actionId: task.actionId,
                globalActionId: task.globalActionId,
                projectId: task.projectId,
                tags: task.tags
            });

            // Check if task has the "Action" tag and is from a project action
            if (task.actionId) {
                result.projectAction.push(task);
            } else if (task.globalActionId) {
                result.globalAction.push(task);
            } else if (!task.actionId && !task.globalActionId) {
                result.personal.push(task);
            } else {
                result.other.push(task);
            }
        });

        // Log the categorized results for debugging
        console.log('Categorized tasks:', {
            personal: result.personal.length,
            projectAction: result.projectAction.length,
            globalAction: result.globalAction.length,
            other: result.other.length
        });

        return result;
    };

    const categorizedTasks = categorizeTasksBySource();

    return (
        <div className="fixed bottom-0 right-0 m-4 p-0 bg-white border border-gray-300 rounded shadow-lg z-[99999] w-96 overflow-hidden">
            <div
                className="p-2 bg-gray-100 cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <h3 className="text-sm font-bold">Task Debugger {isOpen ? '▼' : '▶'}</h3>
            </div>

            {isOpen && (
                <div className="p-4 overflow-auto max-h-[70vh]">
                    {/* User info for debugging */}
                    <div className="mb-3 bg-gray-100 p-2 rounded">
                        <h4 className="text-xs font-semibold mb-1">Current User</h4>
                        {user ? (
                            <div className="text-xs">
                                <div><strong>ID:</strong> {user._id}</div>
                                <div><strong>Name:</strong> {(user as any).prenom || ''} {(user as any).nom || ''}</div>
                            </div>
                        ) : (
                            <div className="text-xs text-red-600">No user logged in</div>
                        )}
                    </div>

                    <div className="mb-3 flex justify-between">
                        <button
                            onClick={handleRefreshTasks}
                            disabled={isRefreshing}
                            className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded flex items-center"
                        >
                            {isRefreshing ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Refreshing...
                                </>
                            ) : (
                                'Refresh Tasks'
                            )}
                        </button>

                        <button
                            onClick={() => {
                                console.log('FULL TASK DUMP:', tasks);
                                console.log('ACTION TASKS:', [
                                    ...(tasks.todo || []),
                                    ...(tasks.inProgress || []),
                                    ...(tasks.inReview || []),
                                    ...(tasks.done || [])
                                ].filter(t => t.actionId));
                                toast.success('Task data exported to console');
                            }}
                            className="text-xs bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded"
                        >
                            Export to Console
                        </button>
                    </div>

                    <div className="mb-3">
                        <h4 className="text-xs font-semibold mb-1">Personal Tasks: {categorizedTasks.personal.length}</h4>
                        <div className="text-xs">
                            {categorizedTasks.personal.map(task => (
                                <div key={task._id} className="p-1 border-b border-gray-100">
                                    {task.title} ({task.status})
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mb-3">
                        <h4 className="text-xs font-semibold mb-1 text-orange-600">
                            Project Action Tasks: {categorizedTasks.projectAction.length}
                        </h4>
                        <div className="text-xs">
                            {categorizedTasks.projectAction.map(task => (
                                <div key={task._id} className="p-2 border-b border-gray-100 bg-orange-50">
                                    <div className="font-semibold">{task.title} ({task.status})</div>
                                    <div className="text-gray-500 mt-1">
                                        <div>ActionID: {displayId(task.actionId)}</div>
                                        {task.projectId && <div>ProjectID: {displayId(task.projectId)}</div>}
                                        {task.category && <div>Category: {task.category}</div>}
                                        {task.tags && task.tags.length > 0 && <div>Tags: {task.tags.join(', ')}</div>}
                                    </div>
                                </div>
                            ))}
                            {categorizedTasks.projectAction.length === 0 && (
                                <div className="p-2 bg-red-50 text-red-600 rounded">
                                    No project action tasks found! Check the backend and API response.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mb-3">
                        <h4 className="text-xs font-semibold mb-1 text-blue-600">
                            Global Action Tasks: {categorizedTasks.globalAction.length}
                        </h4>
                        <div className="text-xs">
                            {categorizedTasks.globalAction.map(task => (
                                <div key={task._id} className="p-2 border-b border-gray-100 bg-blue-50">
                                    <div className="font-semibold">{task.title} ({task.status})</div>
                                    <div className="text-gray-500 mt-1">
                                        <div>GlobalActionID: {displayId(task.globalActionId)}</div>
                                        {task.projectId && <div>ProjectID: {displayId(task.projectId)}</div>}
                                        {task.category && <div>Category: {task.category}</div>}
                                        {task.tags && task.tags.length > 0 && <div>Tags: {task.tags.join(', ')}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mb-3">
                        <h4 className="text-xs font-semibold mb-1 text-gray-500">
                            Other Tasks: {categorizedTasks.other.length}
                        </h4>
                        <div className="text-xs">
                            {categorizedTasks.other.map(task => (
                                <div key={task._id} className="p-1 border-b border-gray-100">
                                    {task.title} ({task.status})
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskDebugger; 