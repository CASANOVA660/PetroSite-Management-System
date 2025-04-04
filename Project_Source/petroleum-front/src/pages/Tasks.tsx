import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { fetchUserTasks, updateTaskStatus, addNewTask, updateTask } from '../store/slices/taskSlice';
import { RootState, AppDispatch } from '../store';
import { toast } from 'react-hot-toast';
import socket from '../utils/socket';

const Tasks: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { tasks, loading, error } = useSelector((state: RootState) => state.tasks);
    const { user } = useSelector((state: RootState) => state.auth);

    // Fetch tasks on component mount
    useEffect(() => {
        console.log('Tasks Component Mounted');
        const loadTasks = async () => {
            console.log('Fetching tasks...');
            try {
                const result = await dispatch(fetchUserTasks()).unwrap();
                console.log('Tasks fetched successfully:', result);
            } catch (err) {
                console.error('Error fetching tasks:', err);
                toast.error('Erreur lors du chargement des tâches');
            }
        };
        loadTasks();
    }, [dispatch]);

    // Handle socket events
    useEffect(() => {
        if (!user?._id) return;

        const handleNewTask = (task: any) => {
            if (task.assignee._id === user._id) {
                dispatch(addNewTask(task));
                toast.success('Nouvelle tâche assignée');
            }
        };

        const handleTaskUpdate = (task: any) => {
            if (task.assignee._id === user._id) {
                dispatch(updateTask(task));
            }
        };

        socket.on('newTask', handleNewTask);
        socket.on('taskUpdated', handleTaskUpdate);

        return () => {
            socket.off('newTask', handleNewTask);
            socket.off('taskUpdated', handleTaskUpdate);
        };
    }, [dispatch, user?._id]);

    const handleDragEnd = useCallback(async (result: any) => {
        if (!result.destination) return;

        const { draggableId, destination } = result;
        const newStatus = destination.droppableId;

        try {
            await dispatch(updateTaskStatus({ taskId: draggableId, status: newStatus })).unwrap();
            toast.success('Statut de la tâche mis à jour');
        } catch (err) {
            toast.error('Erreur lors de la mise à jour du statut');
        }
    }, [dispatch]);

    if (loading) {
        return <div>Chargement des tâches...</div>;
    }

    if (error) {
        return <div>Erreur: {error}</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Mes Tâches</h1>

            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Todo Column */}
                    <Droppable droppableId="todo">
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="bg-gray-50 p-4 rounded-lg"
                            >
                                <h2 className="text-lg font-semibold mb-4 text-gray-700">À faire</h2>
                                {tasks.todo.map((task, index) => (
                                    <Draggable key={task._id} draggableId={task._id} index={index}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className="bg-white p-4 rounded-md shadow mb-3"
                                            >
                                                <h3 className="font-medium text-gray-900">{task.title}</h3>
                                                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                                <div className="mt-2 text-xs text-gray-500">
                                                    <p>Assigné à: {task.assignee.prenom} {task.assignee.nom}</p>
                                                    <p>Date limite: {new Date(task.endDate).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>

                    {/* In Progress Column */}
                    <Droppable droppableId="inProgress">
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="bg-gray-50 p-4 rounded-lg"
                            >
                                <h2 className="text-lg font-semibold mb-4 text-gray-700">En cours</h2>
                                {tasks.inProgress.map((task, index) => (
                                    <Draggable key={task._id} draggableId={task._id} index={index}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className="bg-white p-4 rounded-md shadow mb-3"
                                            >
                                                <h3 className="font-medium text-gray-900">{task.title}</h3>
                                                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                                <div className="mt-2 text-xs text-gray-500">
                                                    <p>Assigné à: {task.assignee.prenom} {task.assignee.nom}</p>
                                                    <p>Date limite: {new Date(task.endDate).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>

                    {/* Done Column */}
                    <Droppable droppableId="done">
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="bg-gray-50 p-4 rounded-lg"
                            >
                                <h2 className="text-lg font-semibold mb-4 text-gray-700">Terminé</h2>
                                {tasks.done.map((task, index) => (
                                    <Draggable key={task._id} draggableId={task._id} index={index}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className="bg-white p-4 rounded-md shadow mb-3"
                                            >
                                                <h3 className="font-medium text-gray-900">{task.title}</h3>
                                                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                                <div className="mt-2 text-xs text-gray-500">
                                                    <p>Assigné à: {task.assignee.prenom} {task.assignee.nom}</p>
                                                    <p>Date limite: {new Date(task.endDate).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </div>
            </DragDropContext>
        </div>
    );
};

export default Tasks; 